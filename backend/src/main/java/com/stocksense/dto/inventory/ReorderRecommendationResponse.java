package com.stocksense.dto.inventory;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReorderRecommendationResponse {
    private Long productId;
    private String productName;
    private String sku;
    private String categoryName;
    private String warehouseName;
    private String locationName;
    private Integer currentStock;
    private Integer minStock;
    private Integer targetStock;
    private Integer recommendedQty;
    private String status;
}
