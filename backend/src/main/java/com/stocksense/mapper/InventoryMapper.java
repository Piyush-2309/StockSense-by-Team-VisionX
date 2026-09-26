package com.stocksense.mapper;

import com.stocksense.dto.inventory.*;
import com.stocksense.entity.*;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Utility class for mapping inventory entities to DTOs.
 * All methods are stateless and static.
 */
public final class InventoryMapper {

    private InventoryMapper() {}

    // ---- Product ----

    public static ProductResponse toProductResponse(Product product, Integer totalStock) {
        String status = computeStockStatus(totalStock, product.getReorderLevel());
        return ProductResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .sku(product.getSku())
                .categoryId(product.getCategory().getId())
                .categoryName(product.getCategory().getName())
                .unitOfMeasure(product.getUnitOfMeasure())
                .unitCost(product.getUnitCost())
                .reorderLevel(product.getReorderLevel())
                .active(product.getActive())
                .totalStock(totalStock)
                .stockStatus(status)
                .createdAt(product.getCreatedAt())
                .updatedAt(product.getUpdatedAt())
                .build();
    }

    // ---- Category ----

    public static CategoryResponse toCategoryResponse(Category category) {
        return CategoryResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .description(category.getDescription())
                .active(category.getActive())
                .createdAt(category.getCreatedAt())
                .updatedAt(category.getUpdatedAt())
                .build();
    }

    // ---- Warehouse ----

    public static WarehouseResponse toWarehouseResponse(Warehouse warehouse) {
        return WarehouseResponse.builder()
                .id(warehouse.getId())
                .name(warehouse.getName())
                .code(warehouse.getCode())
                .address(warehouse.getAddress())
                .active(warehouse.getActive())
                .createdAt(warehouse.getCreatedAt())
                .updatedAt(warehouse.getUpdatedAt())
                .build();
    }

    // ---- Location ----

    public static LocationResponse toLocationResponse(Location location) {
        LocationResponse.LocationResponseBuilder builder = LocationResponse.builder()
                .id(location.getId())
                .name(location.getName())
                .code(location.getCode())
                .warehouseId(location.getWarehouse().getId())
                .warehouseName(location.getWarehouse().getName())
                .active(location.getActive())
                .createdAt(location.getCreatedAt())
                .updatedAt(location.getUpdatedAt());

        if (location.getParentLocation() != null) {
            builder.parentLocationId(location.getParentLocation().getId())
                   .parentLocationName(location.getParentLocation().getName());
        }

        return builder.build();
    }

    // ---- Stock ----

    public static StockResponse toStockResponse(Stock stock) {
        Product p = stock.getProduct();
        Location l = stock.getLocation();
        Warehouse w = l.getWarehouse();
        int free = stock.getQuantityOnHand() - stock.getQuantityReserved();
        String status = computeStockStatus(stock.getQuantityOnHand(), p.getReorderLevel());

        return StockResponse.builder()
                .id(stock.getId())
                .productId(p.getId())
                .productName(p.getName())
                .sku(p.getSku())
                .locationId(l.getId())
                .locationName(l.getName())
                .locationCode(l.getCode())
                .warehouseId(w.getId())
                .warehouseName(w.getName())
                .warehouseCode(w.getCode())
                .quantityOnHand(stock.getQuantityOnHand())
                .quantityReserved(stock.getQuantityReserved())
                .quantityFree(Math.max(free, 0))
                .unitOfMeasure(p.getUnitOfMeasure())
                .unitCost(p.getUnitCost())
                .reorderLevel(p.getReorderLevel())
                .status(status)
                .updatedAt(stock.getUpdatedAt())
                .build();
    }

    // ---- StockMove → DocumentResponse ----

    public static DocumentResponse toDocumentResponse(List<StockMove> moves) {
        if (moves == null || moves.isEmpty()) {
            return null;
        }

        // All rows share the same document-level fields
        StockMove first = moves.get(0);

        DocumentResponse.DocumentResponseBuilder builder = DocumentResponse.builder()
                .documentId(first.getDocumentId())
                .reference(first.getReference())
                .type(first.getType().name())
                .status(first.getStatus().name())
                .partnerName(first.getPartnerName())
                .reason(first.getReason())
                .scheduledDate(first.getScheduledDate())
                .userId(first.getUser().getId())
                .userName(first.getUser().getName())
                .createdAt(first.getCreatedAt())
                .updatedAt(first.getUpdatedAt());

        if (first.getValidatedBy() != null) {
            builder.validatedById(first.getValidatedBy().getId())
                   .validatedByName(first.getValidatedBy().getName());
        }

        if (first.getSourceLocation() != null) {
            Location src = first.getSourceLocation();
            builder.sourceLocationId(src.getId())
                   .sourceLocationName(src.getName())
                   .sourceLocationCode(src.getCode())
                   .sourceWarehouseId(src.getWarehouse().getId())
                   .sourceWarehouseName(src.getWarehouse().getName());
        }

        if (first.getDestinationLocation() != null) {
            Location dest = first.getDestinationLocation();
            builder.destinationLocationId(dest.getId())
                   .destinationLocationName(dest.getName())
                   .destinationLocationCode(dest.getCode())
                   .destinationWarehouseId(dest.getWarehouse().getId())
                   .destinationWarehouseName(dest.getWarehouse().getName());
        }

        List<MoveLineResponse> lines = moves.stream()
                .map(InventoryMapper::toMoveLineResponse)
                .collect(Collectors.toList());
        builder.lines(lines);

        return builder.build();
    }

    public static MoveLineResponse toMoveLineResponse(StockMove move) {
        Product p = move.getProduct();
        return MoveLineResponse.builder()
                .id(move.getId())
                .productId(p.getId())
                .productName(p.getName())
                .sku(p.getSku())
                .unitOfMeasure(p.getUnitOfMeasure())
                .quantity(move.getQuantity())
                .resultingQuantity(move.getResultingQuantity())
                .build();
    }

    // ---- Stock Status Computation ----

    public static String computeStockStatus(int quantityOnHand, int reorderLevel) {
        if (quantityOnHand == 0) {
            return "OUT_OF_STOCK";
        } else if (quantityOnHand <= reorderLevel) {
            return "LOW_STOCK";
        } else {
            return "HEALTHY";
        }
    }
}
