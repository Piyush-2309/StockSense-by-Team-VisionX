package com.stocksense.service;

import com.stocksense.dto.inventory.*;
import com.stocksense.entity.*;
import com.stocksense.exception.InsufficientStockException;
import com.stocksense.exception.InvalidStateTransitionException;
import com.stocksense.exception.InvalidTransferException;
import com.stocksense.repository.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Integration test suite covering the Golden E2E Test (Section 40),
 * the Transaction Test Matrix (Section 36), and failure scenarios.
 *
 * Uses H2 in-memory database with application-test.yml profile.
 */
@SpringBootTest
@ActiveProfiles("test")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class InventoryIntegrationTest {

    @Autowired private OperationService operationService;
    @Autowired private StockService stockService;
    @Autowired private ProductService productService;
    @Autowired private CategoryService categoryService;
    @Autowired private WarehouseService warehouseService;
    @Autowired private LocationService locationService;
    @Autowired private DashboardService dashboardService;

    @Autowired private UserRepository userRepository;
    @Autowired private CategoryRepository categoryRepository;
    @Autowired private WarehouseRepository warehouseRepository;
    @Autowired private LocationRepository locationRepository;
    @Autowired private ProductRepository productRepository;
    @Autowired private StockRepository stockRepository;
    @Autowired private StockMoveRepository stockMoveRepository;

    private User manager;
    private User staff;
    private Product steelRod;
    private Location rackA;       // Main Warehouse
    private Location rackP1;      // Production area
    private Warehouse mainWarehouse;

    @BeforeEach
    void setUp() {
        // Clean slate
        stockMoveRepository.deleteAll();
        stockRepository.deleteAll();
        productRepository.deleteAll();
        locationRepository.deleteAll();
        warehouseRepository.deleteAll();
        categoryRepository.deleteAll();
        userRepository.deleteAll();

        // Create users
        manager = userRepository.save(User.builder()
                .name("Test Manager")
                .email("manager@test.com")
                .passwordHash("$2a$10$dummy")
                .role(Role.MANAGER)
                .active(true)
                .build());

        staff = userRepository.save(User.builder()
                .name("Test Staff")
                .email("staff@test.com")
                .passwordHash("$2a$10$dummy")
                .role(Role.STAFF)
                .active(true)
                .build());

        // Create category
        Category rawMaterials = categoryRepository.save(Category.builder()
                .name("Raw Materials")
                .description("Base materials")
                .active(true)
                .build());

        // Create warehouse
        mainWarehouse = warehouseRepository.save(Warehouse.builder()
                .name("Main Warehouse")
                .code("WH")
                .address("123 Industrial Ave")
                .active(true)
                .build());

        // Create locations
        rackA = locationRepository.save(Location.builder()
                .name("Rack A")
                .code("WH-RA")
                .warehouse(mainWarehouse)
                .active(true)
                .build());

        rackP1 = locationRepository.save(Location.builder()
                .name("Rack P1")
                .code("WH-PA-P1")
                .warehouse(mainWarehouse)
                .active(true)
                .build());

        // Create product — Steel Rod starts at 0 stock
        steelRod = productRepository.save(Product.builder()
                .name("Steel Rod")
                .sku("STL-ROD-001")
                .category(rawMaterials)
                .unitOfMeasure("pieces")
                .unitCost(BigDecimal.valueOf(25.50))
                .reorderLevel(50)
                .active(true)
                .build());
    }

    // ==================================================================
    // GOLDEN END-TO-END TEST (Section 40)
    // ==================================================================

    @Test
    @Order(1)
    void goldenEndToEndTest() {
        // Verify initial state: Steel Rod = 0
        assertEquals(0, stockService.getTotalStockForProduct(steelRod.getId()));

        // === Step 1: Receipt +100 ===
        ReceiptRequest receiptReq = ReceiptRequest.builder()
                .supplier("SteelCorp Ltd.")
                .destinationLocationId(rackA.getId())
                .items(List.of(MoveLineRequest.builder()
                        .productId(steelRod.getId())
                        .quantity(100)
                        .build()))
                .build();

        DocumentResponse receipt = operationService.createReceipt(receiptReq, manager);
        assertNotNull(receipt.getDocumentId());
        assertEquals("DRAFT", receipt.getStatus());

        // Mark ready
        receipt = operationService.markReceiptReady(receipt.getDocumentId());
        assertEquals("READY", receipt.getStatus());

        // Validate — stock should now be 100
        receipt = operationService.validateReceipt(receipt.getDocumentId(), manager);
        assertEquals("DONE", receipt.getStatus());
        assertEquals(100, receipt.getLines().get(0).getResultingQuantity());
        assertEquals(100, stockService.getTotalStockForProduct(steelRod.getId()));

        // === Step 2: Transfer 30, Rack A → Rack P1 ===
        TransferRequest transferReq = TransferRequest.builder()
                .sourceLocationId(rackA.getId())
                .destinationLocationId(rackP1.getId())
                .items(List.of(MoveLineRequest.builder()
                        .productId(steelRod.getId())
                        .quantity(30)
                        .build()))
                .build();

        DocumentResponse transfer = operationService.createTransfer(transferReq, manager);
        assertEquals("DRAFT", transfer.getStatus());

        transfer = operationService.validateTransfer(transfer.getDocumentId(), manager);
        assertEquals("DONE", transfer.getStatus());

        // Verify location-level: Rack A=70, Rack P1=30, total=100
        List<StockResponse> stockByProduct = stockService.getStockByProduct(steelRod.getId());
        int rackAQty = stockByProduct.stream()
                .filter(s -> s.getLocationId().equals(rackA.getId()))
                .findFirst().map(StockResponse::getQuantityOnHand).orElse(-1);
        int rackP1Qty = stockByProduct.stream()
                .filter(s -> s.getLocationId().equals(rackP1.getId()))
                .findFirst().map(StockResponse::getQuantityOnHand).orElse(-1);

        assertEquals(70, rackAQty, "Rack A should have 70 after transfer");
        assertEquals(30, rackP1Qty, "Rack P1 should have 30 after transfer");
        assertEquals(100, stockService.getTotalStockForProduct(steelRod.getId()),
                "Total stock must remain 100 after transfer");

        // === Step 3: Delivery -20 from Rack A ===
        DeliveryRequest deliveryReq = DeliveryRequest.builder()
                .customer("BuildRight Inc.")
                .sourceLocationId(rackA.getId())
                .items(List.of(MoveLineRequest.builder()
                        .productId(steelRod.getId())
                        .quantity(20)
                        .build()))
                .build();

        DocumentResponse delivery = operationService.createDelivery(deliveryReq, manager);
        // Should be READY since 70 >= 20
        assertEquals("READY", delivery.getStatus());

        delivery = operationService.validateDelivery(delivery.getDocumentId(), manager);
        assertEquals("DONE", delivery.getStatus());
        assertEquals(50, delivery.getLines().get(0).getResultingQuantity());

        // Total: Rack A=50 + Rack P1=30 = 80
        assertEquals(80, stockService.getTotalStockForProduct(steelRod.getId()),
                "Total stock should be 80 after delivery");

        // === Step 4: Adjustment physical=77 at Rack A (system=50, delta=-3... wait, system at rackA is 50) ===
        // Actually let's adjust at the overall level. The spec says physical=77, system=80
        // But adjustment is per-location. So we adjust Rack A from 50 to 47 (delta = -3)
        // That gives total = 47 + 30 = 77
        AdjustmentRequest adjReq = AdjustmentRequest.builder()
                .locationId(rackA.getId())
                .reason("DAMAGED")
                .notes("Three damaged units found")
                .items(List.of(AdjustmentLineRequest.builder()
                        .productId(steelRod.getId())
                        .physicalQuantity(47)
                        .build()))
                .build();

        DocumentResponse adjustment = operationService.createAdjustment(adjReq, manager);
        assertEquals("DRAFT", adjustment.getStatus());

        adjustment = operationService.validateAdjustment(adjustment.getDocumentId(), manager);
        assertEquals("DONE", adjustment.getStatus());
        assertEquals(47, adjustment.getLines().get(0).getResultingQuantity());

        // === Final verification ===
        int totalStock = stockService.getTotalStockForProduct(steelRod.getId());
        assertEquals(77, totalStock, "Final total stock should be 77");

        // Verify Rack A = 47, Rack P1 = 30
        stockByProduct = stockService.getStockByProduct(steelRod.getId());
        rackAQty = stockByProduct.stream()
                .filter(s -> s.getLocationId().equals(rackA.getId()))
                .findFirst().map(StockResponse::getQuantityOnHand).orElse(-1);
        rackP1Qty = stockByProduct.stream()
                .filter(s -> s.getLocationId().equals(rackP1.getId()))
                .findFirst().map(StockResponse::getQuantityOnHand).orElse(-1);

        assertEquals(47, rackAQty, "Rack A final quantity");
        assertEquals(30, rackP1Qty, "Rack P1 final quantity");

        // Verify dashboard agrees
        DashboardResponse dashboard = dashboardService.getDashboard();
        assertNotNull(dashboard);
        assertEquals(1, dashboard.getTotalProducts());

        // Verify product response agrees
        ProductResponse productResponse = productService.getProduct(steelRod.getId());
        assertEquals(77, productResponse.getTotalStock());
    }

    // ==================================================================
    // RECEIPT TESTS
    // ==================================================================

    @Test
    @Order(2)
    void receiptCreationDoesNotChangeStock() {
        ReceiptRequest request = ReceiptRequest.builder()
                .supplier("Test Supplier")
                .destinationLocationId(rackA.getId())
                .items(List.of(MoveLineRequest.builder()
                        .productId(steelRod.getId())
                        .quantity(100)
                        .build()))
                .build();

        operationService.createReceipt(request, manager);
        assertEquals(0, stockService.getTotalStockForProduct(steelRod.getId()),
                "Creating a receipt must NOT change stock");
    }

    @Test
    @Order(3)
    void receiptZeroPlusHundred() {
        // 0 + 100 = 100
        ReceiptRequest request = ReceiptRequest.builder()
                .supplier("Test Supplier")
                .destinationLocationId(rackA.getId())
                .items(List.of(MoveLineRequest.builder()
                        .productId(steelRod.getId())
                        .quantity(100)
                        .build()))
                .build();

        DocumentResponse receipt = operationService.createReceipt(request, manager);
        operationService.markReceiptReady(receipt.getDocumentId());
        DocumentResponse validated = operationService.validateReceipt(receipt.getDocumentId(), manager);

        assertEquals(100, validated.getLines().get(0).getResultingQuantity());
        assertEquals(100, stockService.getTotalStockForProduct(steelRod.getId()));
    }

    // ==================================================================
    // DELIVERY TESTS
    // ==================================================================

    @Test
    @Order(4)
    void deliveryInsufficientStock() {
        // No stock, try to deliver — should be WAITING, not READY
        DeliveryRequest request = DeliveryRequest.builder()
                .customer("Customer")
                .sourceLocationId(rackA.getId())
                .items(List.of(MoveLineRequest.builder()
                        .productId(steelRod.getId())
                        .quantity(50)
                        .build()))
                .build();

        DocumentResponse delivery = operationService.createDelivery(request, manager);
        assertEquals("WAITING", delivery.getStatus(),
                "Delivery with insufficient stock should be WAITING");
        assertTrue(delivery.getLines().get(0).getIsShort());
    }

    @Test
    @Order(5)
    void deliveryValidateInsufficientStockThrows() {
        // Seed stock
        seedStock(steelRod, rackA, 10);

        DeliveryRequest request = DeliveryRequest.builder()
                .customer("Customer")
                .sourceLocationId(rackA.getId())
                .items(List.of(MoveLineRequest.builder()
                        .productId(steelRod.getId())
                        .quantity(15)
                        .build()))
                .build();

        DocumentResponse delivery = operationService.createDelivery(request, manager);
        assertEquals("WAITING", delivery.getStatus());

        // Force status to READY for testing the validation re-check
        // (In production the check-availability would do this)
        List<StockMove> moves = stockMoveRepository.findByDocumentId(delivery.getDocumentId());
        moves.forEach(m -> m.setStatus(MoveStatus.READY));
        stockMoveRepository.saveAll(moves);

        // Validate should fail with InsufficientStockException
        assertThrows(InsufficientStockException.class,
                () -> operationService.validateDelivery(delivery.getDocumentId(), manager));
    }

    // ==================================================================
    // TRANSFER TESTS
    // ==================================================================

    @Test
    @Order(6)
    void transferConservesTotal() {
        seedStock(steelRod, rackA, 100);
        seedStock(steelRod, rackP1, 20);

        TransferRequest request = TransferRequest.builder()
                .sourceLocationId(rackA.getId())
                .destinationLocationId(rackP1.getId())
                .items(List.of(MoveLineRequest.builder()
                        .productId(steelRod.getId())
                        .quantity(30)
                        .build()))
                .build();

        DocumentResponse transfer = operationService.createTransfer(request, manager);
        operationService.validateTransfer(transfer.getDocumentId(), manager);

        List<StockResponse> stocks = stockService.getStockByProduct(steelRod.getId());
        int rackAQty = stocks.stream()
                .filter(s -> s.getLocationId().equals(rackA.getId()))
                .findFirst().map(StockResponse::getQuantityOnHand).orElse(-1);
        int rackP1Qty = stocks.stream()
                .filter(s -> s.getLocationId().equals(rackP1.getId()))
                .findFirst().map(StockResponse::getQuantityOnHand).orElse(-1);

        assertEquals(70, rackAQty);
        assertEquals(50, rackP1Qty);
        assertEquals(120, rackAQty + rackP1Qty, "Total must remain 120");
    }

    @Test
    @Order(7)
    void transferSameLocationThrows() {
        seedStock(steelRod, rackA, 100);

        TransferRequest request = TransferRequest.builder()
                .sourceLocationId(rackA.getId())
                .destinationLocationId(rackA.getId())
                .items(List.of(MoveLineRequest.builder()
                        .productId(steelRod.getId())
                        .quantity(10)
                        .build()))
                .build();

        assertThrows(InvalidTransferException.class,
                () -> operationService.createTransfer(request, manager));
    }

    // ==================================================================
    // ADJUSTMENT TESTS
    // ==================================================================

    @Test
    @Order(8)
    void adjustmentDelta() {
        seedStock(steelRod, rackA, 80);

        AdjustmentRequest request = AdjustmentRequest.builder()
                .locationId(rackA.getId())
                .reason("DAMAGED")
                .items(List.of(AdjustmentLineRequest.builder()
                        .productId(steelRod.getId())
                        .physicalQuantity(77)
                        .build()))
                .build();

        DocumentResponse adj = operationService.createAdjustment(request, manager);
        DocumentResponse validated = operationService.validateAdjustment(adj.getDocumentId(), manager);

        assertEquals(77, validated.getLines().get(0).getResultingQuantity());
    }

    @Test
    @Order(9)
    void adjustmentStaffCannotValidate() {
        seedStock(steelRod, rackA, 80);

        AdjustmentRequest request = AdjustmentRequest.builder()
                .locationId(rackA.getId())
                .reason("COUNTING_ERROR")
                .items(List.of(AdjustmentLineRequest.builder()
                        .productId(steelRod.getId())
                        .physicalQuantity(75)
                        .build()))
                .build();

        DocumentResponse adj = operationService.createAdjustment(request, staff);

        // Staff should not be able to validate
        assertThrows(Exception.class,
                () -> operationService.validateAdjustment(adj.getDocumentId(), staff));
    }

    // ==================================================================
    // STATE TRANSITION TESTS
    // ==================================================================

    @Test
    @Order(10)
    void duplicateValidationThrows() {
        seedStock(steelRod, rackA, 100);

        ReceiptRequest request = ReceiptRequest.builder()
                .supplier("Test")
                .destinationLocationId(rackA.getId())
                .items(List.of(MoveLineRequest.builder()
                        .productId(steelRod.getId())
                        .quantity(50)
                        .build()))
                .build();

        DocumentResponse receipt = operationService.createReceipt(request, manager);
        operationService.markReceiptReady(receipt.getDocumentId());
        operationService.validateReceipt(receipt.getDocumentId(), manager);

        // Try to validate again
        UUID docId = receipt.getDocumentId();
        assertThrows(InvalidStateTransitionException.class,
                () -> operationService.validateReceipt(docId, manager));
    }

    @Test
    @Order(11)
    void cancelDoneDocumentThrows() {
        seedStock(steelRod, rackA, 100);

        ReceiptRequest request = ReceiptRequest.builder()
                .supplier("Test")
                .destinationLocationId(rackA.getId())
                .items(List.of(MoveLineRequest.builder()
                        .productId(steelRod.getId())
                        .quantity(50)
                        .build()))
                .build();

        DocumentResponse receipt = operationService.createReceipt(request, manager);
        operationService.markReceiptReady(receipt.getDocumentId());
        operationService.validateReceipt(receipt.getDocumentId(), manager);

        UUID docId = receipt.getDocumentId();
        assertThrows(InvalidStateTransitionException.class,
                () -> operationService.cancelDocument(docId, OperationType.RECEIPT));
    }

    @Test
    @Order(12)
    void cancelCanceledDocumentThrows() {
        ReceiptRequest request = ReceiptRequest.builder()
                .supplier("Test")
                .destinationLocationId(rackA.getId())
                .items(List.of(MoveLineRequest.builder()
                        .productId(steelRod.getId())
                        .quantity(50)
                        .build()))
                .build();

        DocumentResponse receipt = operationService.createReceipt(request, manager);
        operationService.cancelDocument(receipt.getDocumentId(), OperationType.RECEIPT);

        UUID docId = receipt.getDocumentId();
        assertThrows(InvalidStateTransitionException.class,
                () -> operationService.cancelDocument(docId, OperationType.RECEIPT));
    }

    // ==================================================================
    // PRODUCT TESTS
    // ==================================================================

    @Test
    @Order(13)
    void productStockStatusComputation() {
        seedStock(steelRod, rackA, 0);
        ProductResponse product = productService.getProduct(steelRod.getId());
        assertEquals("OUT_OF_STOCK", product.getStockStatus());

        // Set stock to reorder level
        stockService.adjustStock(steelRod, rackA, 50);
        product = productService.getProduct(steelRod.getId());
        assertEquals("LOW_STOCK", product.getStockStatus());

        // Set stock above reorder level
        stockService.adjustStock(steelRod, rackA, 100);
        product = productService.getProduct(steelRod.getId());
        assertEquals("HEALTHY", product.getStockStatus());
    }

    // ==================================================================
    // HELPER
    // ==================================================================

    private void seedStock(Product product, Location location, int quantity) {
        Stock stock = stockRepository.findByProductIdAndLocationId(product.getId(), location.getId())
                .orElseGet(() -> Stock.builder()
                        .product(product)
                        .location(location)
                        .quantityOnHand(0)
                        .quantityReserved(0)
                        .build());
        stock.setQuantityOnHand(quantity);
        stockRepository.save(stock);
    }
}
