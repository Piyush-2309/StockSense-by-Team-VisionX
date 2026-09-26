package com.stocksense.dto.inventory;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * A single line within a StockMove document response.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MoveLineResponse {
    private Long id;
    private Long productId;
    private String productName;
    private String sku;
    private String unitOfMeasure;
    private Integer quantity;
    private Integer resultingQuantity;
    private Boolean isShort; // For deliveries — indicates insufficient stock on this line
}
