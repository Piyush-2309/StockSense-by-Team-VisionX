package com.stocksense.dto.inventory;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Stock response DTO — returns denormalized product/location/warehouse info
 * so the frontend doesn't have to reconstruct relationships.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockResponse {
    private Long id;
    private Long productId;
    private String productName;
    private String sku;
    private Long locationId;
    private String locationName;
    private String locationCode;
    private Long warehouseId;
    private String warehouseName;
    private String warehouseCode;
    private Integer quantityOnHand;
    private Integer quantityReserved;
    private Integer quantityFree;
    private String unitOfMeasure;
    private BigDecimal unitCost;
    private Integer reorderLevel;
    private String status; // HEALTHY, LOW_STOCK, OUT_OF_STOCK
    private LocalDateTime updatedAt;
}
