package com.stocksense.service;

import com.stocksense.dto.inventory.*;
import com.stocksense.entity.*;
import com.stocksense.exception.*;
import com.stocksense.mapper.InventoryMapper;
import com.stocksense.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Core inventory operations engine.
 * Handles create/validate/cancel/mark-ready/check-availability for all operation types.
 * 
 * All stock-changing operations are @Transactional. StockMove is the single source of truth.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OperationService {

    private final StockMoveRepository stockMoveRepository;
    private final ProductRepository productRepository;
    private final LocationRepository locationRepository;
    private final StockService stockService;
    private final ReferenceGeneratorService referenceGeneratorService;
    private final UserRepository userRepository;

    // ========================
    // RECEIPT OPERATIONS
    // ========================

    @Transactional
    public DocumentResponse createReceipt(ReceiptRequest request, User currentUser) {
        Location destination = findActiveLocation(request.getDestinationLocationId());
        String reference = referenceGeneratorService.generate(OperationType.RECEIPT, destination.getWarehouse());
        UUID documentId = UUID.randomUUID();

        List<StockMove> moves = new ArrayList<>();
        for (MoveLineRequest item : request.getItems()) {
            Product product = findProduct(item.getProductId());
            StockMove move = StockMove.builder()
                    .documentId(documentId)
                    .reference(reference)
                    .type(OperationType.RECEIPT)
                    .status(MoveStatus.DRAFT)
                    .product(product)
                    .quantity(item.getQuantity())
                    .destinationLocation(destination)
                    .partnerName(request.getSupplier())
                    .scheduledDate(request.getScheduledDate())
                    .reason(request.getNotes())
                    .user(currentUser)
                    .responsible(currentUser)
                    .build();
            moves.add(stockMoveRepository.save(move));
        }

        log.info("Created RECEIPT {} with {} lines", reference, moves.size());
        return InventoryMapper.toDocumentResponse(moves);
    }

    @Transactional
    public DocumentResponse updateReceipt(UUID documentId, ReceiptRequest request, User currentUser) {
        List<StockMove> moves = getDocumentMoves(documentId);
        validateAllStatus(moves, MoveStatus.DRAFT, "Only DRAFT receipts can be updated");

        Location destination = findActiveLocation(request.getDestinationLocationId());

        // Delete old lines and create new ones
        stockMoveRepository.deleteAll(moves);
        stockMoveRepository.flush();

        String reference = moves.get(0).getReference();
        List<StockMove> newMoves = new ArrayList<>();
        for (MoveLineRequest item : request.getItems()) {
            Product product = findProduct(item.getProductId());
            StockMove move = StockMove.builder()
                    .documentId(documentId)
                    .reference(reference)
                    .type(OperationType.RECEIPT)
                    .status(MoveStatus.DRAFT)
                    .product(product)
                    .quantity(item.getQuantity())
                    .destinationLocation(destination)
                    .partnerName(request.getSupplier())
                    .scheduledDate(request.getScheduledDate())
                    .reason(request.getNotes())
                    .user(currentUser)
                    .responsible(currentUser)
                    .build();
            newMoves.add(stockMoveRepository.save(move));
        }

        log.info("Updated RECEIPT {}", reference);
        return InventoryMapper.toDocumentResponse(newMoves);
    }

    @Transactional
    public DocumentResponse markReceiptReady(UUID documentId) {
        List<StockMove> moves = getDocumentMoves(documentId);
        validateAllStatus(moves, MoveStatus.DRAFT, "Only DRAFT receipts can be marked ready");

        moves.forEach(m -> m.setStatus(MoveStatus.READY));
        stockMoveRepository.saveAll(moves);

        log.info("Marked RECEIPT {} as READY", moves.get(0).getReference());
        return InventoryMapper.toDocumentResponse(moves);
    }

    @Transactional
    public DocumentResponse validateReceipt(UUID documentId, User currentUser) {
        List<StockMove> moves = getDocumentMoves(documentId);
        validateAllStatus(moves, MoveStatus.READY, "Only READY receipts can be validated");

        for (StockMove move : moves) {
            // Increase stock at destination
            int resultingQty = stockService.increaseStock(
                    move.getProduct(), move.getDestinationLocation(), move.getQuantity());
            move.setResultingQuantity(resultingQty);
            move.setStatus(MoveStatus.DONE);
            move.setValidatedBy(currentUser);
        }
        stockMoveRepository.saveAll(moves);

        log.info("Validated RECEIPT {} — stock updated", moves.get(0).getReference());
        return InventoryMapper.toDocumentResponse(moves);
    }

    // ========================
    // DELIVERY OPERATIONS
    // ========================

    @Transactional
    public DocumentResponse createDelivery(DeliveryRequest request, User currentUser) {
        Location source = findActiveLocation(request.getSourceLocationId());
        String reference = referenceGeneratorService.generate(OperationType.DELIVERY, source.getWarehouse());
        UUID documentId = UUID.randomUUID();

        // Check availability for all lines
        boolean allAvailable = true;
        List<StockMove> moves = new ArrayList<>();
        List<Boolean> shortFlags = new ArrayList<>();

        for (MoveLineRequest item : request.getItems()) {
            Product product = findProduct(item.getProductId());
            boolean hasSufficient = stockService.hasSufficientStock(
                    product.getId(), source.getId(), item.getQuantity());
            if (!hasSufficient) {
                allAvailable = false;
            }
            shortFlags.add(!hasSufficient);

            MoveStatus status = allAvailable ? MoveStatus.READY : MoveStatus.WAITING;
            StockMove move = StockMove.builder()
                    .documentId(documentId)
                    .reference(reference)
                    .type(OperationType.DELIVERY)
                    .status(status) // Will be updated below after checking all lines
                    .product(product)
                    .quantity(item.getQuantity())
                    .sourceLocation(source)
                    .partnerName(request.getCustomer())
                    .scheduledDate(request.getScheduledDate())
                    .reason(request.getNotes())
                    .user(currentUser)
                    .responsible(currentUser)
                    .build();
            moves.add(move);
        }

        // Set all to the same status based on overall availability
        MoveStatus finalStatus = allAvailable ? MoveStatus.READY : MoveStatus.WAITING;
        moves.forEach(m -> m.setStatus(finalStatus));

        List<StockMove> savedMoves = stockMoveRepository.saveAll(moves);
        DocumentResponse response = InventoryMapper.toDocumentResponse(savedMoves);

        // Set isShort flags on the response lines
        for (int i = 0; i < response.getLines().size(); i++) {
            response.getLines().get(i).setIsShort(shortFlags.get(i));
        }

        log.info("Created DELIVERY {} with status {} ({} lines)", reference, finalStatus, moves.size());
        return response;
    }

    @Transactional
    public DocumentResponse updateDelivery(UUID documentId, DeliveryRequest request, User currentUser) {
        List<StockMove> moves = getDocumentMoves(documentId);
        MoveStatus currentStatus = moves.get(0).getStatus();
        if (currentStatus == MoveStatus.DONE || currentStatus == MoveStatus.CANCELED) {
            throw new InvalidStateTransitionException(
                    "Cannot update delivery in " + currentStatus + " status");
        }

        Location source = findActiveLocation(request.getSourceLocationId());

        stockMoveRepository.deleteAll(moves);
        stockMoveRepository.flush();

        String reference = moves.get(0).getReference();
        boolean allAvailable = true;
        List<StockMove> newMoves = new ArrayList<>();
        List<Boolean> shortFlags = new ArrayList<>();

        for (MoveLineRequest item : request.getItems()) {
            Product product = findProduct(item.getProductId());
            boolean hasSufficient = stockService.hasSufficientStock(
                    product.getId(), source.getId(), item.getQuantity());
            if (!hasSufficient) allAvailable = false;
            shortFlags.add(!hasSufficient);

            StockMove move = StockMove.builder()
                    .documentId(documentId)
                    .reference(reference)
                    .type(OperationType.DELIVERY)
                    .status(MoveStatus.DRAFT) // Will be updated below
                    .product(product)
                    .quantity(item.getQuantity())
                    .sourceLocation(source)
                    .partnerName(request.getCustomer())
                    .scheduledDate(request.getScheduledDate())
                    .reason(request.getNotes())
                    .user(currentUser)
                    .responsible(currentUser)
                    .build();
            newMoves.add(move);
        }

        MoveStatus finalStatus = allAvailable ? MoveStatus.READY : MoveStatus.WAITING;
        newMoves.forEach(m -> m.setStatus(finalStatus));
        List<StockMove> savedMoves = stockMoveRepository.saveAll(newMoves);

        DocumentResponse response = InventoryMapper.toDocumentResponse(savedMoves);
        for (int i = 0; i < response.getLines().size(); i++) {
            response.getLines().get(i).setIsShort(shortFlags.get(i));
        }

        log.info("Updated DELIVERY {}", reference);
        return response;
    }

    @Transactional
    public DocumentResponse checkDeliveryAvailability(UUID documentId) {
        List<StockMove> moves = getDocumentMoves(documentId);
        MoveStatus currentStatus = moves.get(0).getStatus();

        if (currentStatus == MoveStatus.DONE || currentStatus == MoveStatus.CANCELED) {
            // No-op for DONE/CANCELED
            return InventoryMapper.toDocumentResponse(moves);
        }

        boolean allAvailable = true;
        List<Boolean> shortFlags = new ArrayList<>();

        for (StockMove move : moves) {
            boolean hasSufficient = stockService.hasSufficientStock(
                    move.getProduct().getId(),
                    move.getSourceLocation().getId(),
                    move.getQuantity());
            if (!hasSufficient) allAvailable = false;
            shortFlags.add(!hasSufficient);
        }

        MoveStatus newStatus = allAvailable ? MoveStatus.READY : MoveStatus.WAITING;
        moves.forEach(m -> m.setStatus(newStatus));
        stockMoveRepository.saveAll(moves);

        DocumentResponse response = InventoryMapper.toDocumentResponse(moves);
        for (int i = 0; i < response.getLines().size(); i++) {
            response.getLines().get(i).setIsShort(shortFlags.get(i));
        }

        log.info("Checked availability for DELIVERY {} → {}", moves.get(0).getReference(), newStatus);
        return response;
    }

    @Transactional
    public DocumentResponse validateDelivery(UUID documentId, User currentUser) {
        List<StockMove> moves = getDocumentMoves(documentId);
        validateAllStatus(moves, MoveStatus.READY, "Only READY deliveries can be validated");

        for (StockMove move : moves) {
            // Decrease stock at source (re-verifies inside the same transaction)
            int resultingQty = stockService.decreaseStock(
                    move.getProduct(), move.getSourceLocation(), move.getQuantity());
            move.setResultingQuantity(resultingQty);
            move.setStatus(MoveStatus.DONE);
            move.setValidatedBy(currentUser);
        }
        stockMoveRepository.saveAll(moves);

        log.info("Validated DELIVERY {} — stock decremented", moves.get(0).getReference());
        return InventoryMapper.toDocumentResponse(moves);
    }

    // ========================
    // INTERNAL TRANSFER OPERATIONS
    // ========================

    @Transactional
    public DocumentResponse createTransfer(TransferRequest request, User currentUser) {
        Location source = findActiveLocation(request.getSourceLocationId());
        Location destination = findActiveLocation(request.getDestinationLocationId());

        if (source.getId().equals(destination.getId())) {
            throw new InvalidTransferException("Source and destination locations cannot be the same");
        }

        // Use the source warehouse for reference generation
        String reference = referenceGeneratorService.generate(OperationType.INTERNAL, source.getWarehouse());
        UUID documentId = UUID.randomUUID();

        List<StockMove> moves = new ArrayList<>();
        for (MoveLineRequest item : request.getItems()) {
            Product product = findProduct(item.getProductId());
            StockMove move = StockMove.builder()
                    .documentId(documentId)
                    .reference(reference)
                    .type(OperationType.INTERNAL)
                    .status(MoveStatus.DRAFT)
                    .product(product)
                    .quantity(item.getQuantity())
                    .sourceLocation(source)
                    .destinationLocation(destination)
                    .reason(request.getNotes())
                    .user(currentUser)
                    .responsible(currentUser)
                    .build();
            moves.add(stockMoveRepository.save(move));
        }

        log.info("Created TRANSFER {} with {} lines", reference, moves.size());
        return InventoryMapper.toDocumentResponse(moves);
    }

    @Transactional
    public DocumentResponse updateTransfer(UUID documentId, TransferRequest request, User currentUser) {
        List<StockMove> moves = getDocumentMoves(documentId);
        validateAllStatus(moves, MoveStatus.DRAFT, "Only DRAFT transfers can be updated");

        Location source = findActiveLocation(request.getSourceLocationId());
        Location destination = findActiveLocation(request.getDestinationLocationId());

        if (source.getId().equals(destination.getId())) {
            throw new InvalidTransferException("Source and destination locations cannot be the same");
        }

        stockMoveRepository.deleteAll(moves);
        stockMoveRepository.flush();

        String reference = moves.get(0).getReference();
        List<StockMove> newMoves = new ArrayList<>();
        for (MoveLineRequest item : request.getItems()) {
            Product product = findProduct(item.getProductId());
            StockMove move = StockMove.builder()
                    .documentId(documentId)
                    .reference(reference)
                    .type(OperationType.INTERNAL)
                    .status(MoveStatus.DRAFT)
                    .product(product)
                    .quantity(item.getQuantity())
                    .sourceLocation(source)
                    .destinationLocation(destination)
                    .reason(request.getNotes())
                    .user(currentUser)
                    .responsible(currentUser)
                    .build();
            newMoves.add(stockMoveRepository.save(move));
        }

        log.info("Updated TRANSFER {}", reference);
        return InventoryMapper.toDocumentResponse(newMoves);
    }

    @Transactional
    public DocumentResponse validateTransfer(UUID documentId, User currentUser) {
        List<StockMove> moves = getDocumentMoves(documentId);
        validateAllStatus(moves, MoveStatus.DRAFT, "Only DRAFT transfers can be validated");

        for (StockMove move : moves) {
            // Decrease source, increase destination — same transaction
            int sourceResult = stockService.decreaseStock(
                    move.getProduct(), move.getSourceLocation(), move.getQuantity());
            int destResult = stockService.increaseStock(
                    move.getProduct(), move.getDestinationLocation(), move.getQuantity());

            // Store the destination resulting quantity on the move
            move.setResultingQuantity(destResult);
            move.setStatus(MoveStatus.DONE);
            move.setValidatedBy(currentUser);
        }
        stockMoveRepository.saveAll(moves);

        log.info("Validated TRANSFER {} — stock moved", moves.get(0).getReference());
        return InventoryMapper.toDocumentResponse(moves);
    }

    // ========================
    // ADJUSTMENT OPERATIONS
    // ========================

    @Transactional
    public DocumentResponse createAdjustment(AdjustmentRequest request, User currentUser) {
        validateAdjustmentReason(request.getReason());
        Location location = findActiveLocation(request.getLocationId());
        String reference = referenceGeneratorService.generate(OperationType.ADJUSTMENT, location.getWarehouse());
        UUID documentId = UUID.randomUUID();

        List<StockMove> moves = new ArrayList<>();
        for (AdjustmentLineRequest item : request.getItems()) {
            Product product = findProduct(item.getProductId());
            StockMove move = StockMove.builder()
                    .documentId(documentId)
                    .reference(reference)
                    .type(OperationType.ADJUSTMENT)
                    .status(MoveStatus.DRAFT)
                    .product(product)
                    .quantity(item.getPhysicalQuantity()) // Store the target physical quantity
                    .sourceLocation(location) // Adjustment location stored as source
                    .destinationLocation(location) // And destination
                    .reason(request.getReason())
                    .user(currentUser)
                    .responsible(currentUser)
                    .build();
            if (request.getNotes() != null) {
                move.setReason(request.getReason() + " — " + request.getNotes());
            }
            moves.add(stockMoveRepository.save(move));
        }

        log.info("Created ADJUSTMENT {} with {} lines", reference, moves.size());
        return InventoryMapper.toDocumentResponse(moves);
    }

    /**
     * Validate adjustment — MANAGER only (enforced at controller + service level).
     * For each line: read current stock, compute delta, apply.
     */
    @Transactional
    public DocumentResponse validateAdjustment(UUID documentId, User currentUser) {
        // Service-layer MANAGER check (in addition to @PreAuthorize at controller)
        if (currentUser.getRole() != Role.MANAGER) {
            throw new UnauthorizedOperationException("Only managers can validate adjustments");
        }

        List<StockMove> moves = getDocumentMoves(documentId);
        validateAllStatus(moves, MoveStatus.DRAFT, "Only DRAFT adjustments can be validated");

        for (StockMove move : moves) {
            int physicalQuantity = move.getQuantity(); // We stored physicalQuantity in the quantity field
            Location location = move.getSourceLocation(); // Adjustment location

            // Adjust stock — computes delta internally
            int resultingQty = stockService.adjustStock(move.getProduct(), location, physicalQuantity);

            move.setResultingQuantity(resultingQty);
            move.setStatus(MoveStatus.DONE);
            move.setValidatedBy(currentUser);
        }
        stockMoveRepository.saveAll(moves);

        log.info("Validated ADJUSTMENT {} — stock adjusted", moves.get(0).getReference());
        return InventoryMapper.toDocumentResponse(moves);
    }

    // ========================
    // CANCEL (shared across all types)
    // ========================

    @Transactional
    public DocumentResponse cancelDocument(UUID documentId, OperationType expectedType) {
        List<StockMove> moves = getDocumentMoves(documentId);

        // Validate type matches
        if (moves.get(0).getType() != expectedType) {
            throw new ResourceNotFoundException("Document", "documentId", documentId);
        }

        MoveStatus currentStatus = moves.get(0).getStatus();
        if (currentStatus == MoveStatus.DONE || currentStatus == MoveStatus.CANCELED) {
            throw new InvalidStateTransitionException(
                    "Cannot cancel a document in " + currentStatus + " status");
        }

        // Validate allowed transitions per type
        validateCancelAllowed(moves.get(0).getType(), currentStatus);

        moves.forEach(m -> m.setStatus(MoveStatus.CANCELED));
        stockMoveRepository.saveAll(moves);

        log.info("Canceled {} document {}", expectedType, moves.get(0).getReference());
        return InventoryMapper.toDocumentResponse(moves);
    }

    // ========================
    // DOCUMENT QUERIES
    // ========================

    @Transactional(readOnly = true)
    public DocumentResponse getDocument(UUID documentId, OperationType expectedType) {
        List<StockMove> moves = getDocumentMoves(documentId);
        if (moves.get(0).getType() != expectedType) {
            throw new ResourceNotFoundException("Document", "documentId", documentId);
        }
        return InventoryMapper.toDocumentResponse(moves);
    }

    @Transactional(readOnly = true)
    public Page<DocumentResponse> listDocuments(OperationType type, MoveStatus status, Pageable pageable) {
        Page<UUID> documentIds;
        if (status != null) {
            documentIds = stockMoveRepository.findDistinctDocumentIdsByTypeAndStatus(type, status, pageable);
        } else {
            documentIds = stockMoveRepository.findDistinctDocumentIdsByType(type, pageable);
        }

        List<DocumentResponse> responses = documentIds.getContent().stream()
                .map(id -> {
                    List<StockMove> moves = stockMoveRepository.findByDocumentId(id);
                    return InventoryMapper.toDocumentResponse(moves);
                })
                .collect(Collectors.toList());

        return new PageImpl<>(responses, pageable, documentIds.getTotalElements());
    }

    /**
     * Ledger view — same StockMove table, different filters.
     */
    @Transactional(readOnly = true)
    public Page<DocumentResponse> listLedger(OperationType type, MoveStatus status,
                                              Long productId, String search,
                                              Pageable pageable) {
        // Get all relevant document IDs with pagination
        Page<UUID> documentIds;
        if (type != null && status != null) {
            documentIds = stockMoveRepository.findDistinctDocumentIdsByTypeAndStatus(type, status, pageable);
        } else if (type != null) {
            documentIds = stockMoveRepository.findDistinctDocumentIdsByType(type, pageable);
        } else {
            // All types — use a different approach
            documentIds = stockMoveRepository.findAllDistinctDocumentIds(pageable);
        }

        List<DocumentResponse> responses = documentIds.getContent().stream()
                .map(id -> {
                    List<StockMove> moves = stockMoveRepository.findByDocumentId(id);
                    return InventoryMapper.toDocumentResponse(moves);
                })
                .filter(doc -> {
                    // Apply additional filters
                    if (productId != null) {
                        return doc.getLines().stream()
                                .anyMatch(line -> line.getProductId().equals(productId));
                    }
                    if (search != null && !search.isBlank()) {
                        String s = search.toLowerCase();
                        return (doc.getReference() != null && doc.getReference().toLowerCase().contains(s))
                                || (doc.getPartnerName() != null && doc.getPartnerName().toLowerCase().contains(s));
                    }
                    return true;
                })
                .collect(Collectors.toList());

        return new PageImpl<>(responses, pageable, documentIds.getTotalElements());
    }

    /**
     * Get a document from the ledger view (any type).
     */
    @Transactional(readOnly = true)
    public DocumentResponse getLedgerDocument(UUID documentId) {
        List<StockMove> moves = getDocumentMoves(documentId);
        return InventoryMapper.toDocumentResponse(moves);
    }

    /**
     * Create and auto-validate a single-line adjustment for direct stock updates.
     * Used by PATCH /api/v1/stock/{id} endpoint.
     */
    @Transactional
    public DocumentResponse createAndValidateAdjustment(Product product, Location location,
                                                         int newQuantityOnHand, String reason,
                                                         User currentUser) {
        String reference = referenceGeneratorService.generate(OperationType.ADJUSTMENT, location.getWarehouse());
        UUID documentId = UUID.randomUUID();

        StockMove move = StockMove.builder()
                .documentId(documentId)
                .reference(reference)
                .type(OperationType.ADJUSTMENT)
                .status(MoveStatus.DRAFT)
                .product(product)
                .quantity(newQuantityOnHand)
                .sourceLocation(location)
                .destinationLocation(location)
                .reason(reason)
                .user(currentUser)
                .responsible(currentUser)
                .build();
        stockMoveRepository.save(move);

        // Immediately validate
        int resultingQty = stockService.adjustStock(product, location, newQuantityOnHand);
        move.setResultingQuantity(resultingQty);
        move.setStatus(MoveStatus.DONE);
        move.setValidatedBy(currentUser);
        stockMoveRepository.save(move);

        log.info("Auto-validated stock update ADJUSTMENT {} for product {} at location {}",
                reference, product.getSku(), location.getCode());
        return InventoryMapper.toDocumentResponse(List.of(move));
    }

    // ========================
    // HELPER METHODS
    // ========================

    private List<StockMove> getDocumentMoves(UUID documentId) {
        List<StockMove> moves = stockMoveRepository.findByDocumentId(documentId);
        if (moves.isEmpty()) {
            throw new ResourceNotFoundException("Document", "documentId", documentId);
        }
        return moves;
    }

    private void validateAllStatus(List<StockMove> moves, MoveStatus expected, String errorMessage) {
        boolean allMatch = moves.stream().allMatch(m -> m.getStatus() == expected);
        if (!allMatch) {
            MoveStatus actual = moves.get(0).getStatus();
            if (actual == MoveStatus.DONE) {
                throw new InvalidStateTransitionException(
                        "Document is already validated (DONE). Cannot modify a completed document.");
            }
            throw new InvalidStateTransitionException(
                    errorMessage + ". Current status: " + actual);
        }
    }

    private void validateCancelAllowed(OperationType type, MoveStatus currentStatus) {
        boolean allowed = switch (type) {
            case RECEIPT -> currentStatus == MoveStatus.DRAFT || currentStatus == MoveStatus.READY;
            case DELIVERY -> currentStatus == MoveStatus.DRAFT || currentStatus == MoveStatus.WAITING
                    || currentStatus == MoveStatus.READY;
            case INTERNAL -> currentStatus == MoveStatus.DRAFT;
            case ADJUSTMENT -> currentStatus == MoveStatus.DRAFT;
        };

        if (!allowed) {
            throw new InvalidStateTransitionException(
                    String.format("Cannot cancel %s document from %s status", type, currentStatus));
        }
    }

    private Location findActiveLocation(Long locationId) {
        Location location = locationRepository.findById(locationId)
                .orElseThrow(() -> new InvalidLocationException(
                        "Location not found with id: " + locationId));
        if (!location.getActive()) {
            throw new InvalidLocationException("Location '" + location.getName() + "' is inactive");
        }
        return location;
    }

    private Product findProduct(Long productId) {
        return productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", productId));
    }

    private void validateAdjustmentReason(String reason) {
        Set<String> validReasons = Set.of("DAMAGED", "MISSING", "MISPLACED", "COUNTING_ERROR", "OTHER");
        if (!validReasons.contains(reason.toUpperCase())) {
            throw new IllegalArgumentException(
                    "Invalid adjustment reason: " + reason + ". Must be one of: " + validReasons);
        }
    }
}
