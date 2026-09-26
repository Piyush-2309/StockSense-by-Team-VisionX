package com.stocksense.dto.inventory;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductResponse {
    private Long id;
    private String name;
    private String sku;
    private Long categoryId;
    private String categoryName;
    private String unitOfMeasure;
    private BigDecimal unitCost;
    private Integer reorderLevel;
    private Boolean active;
    private Integer totalStock;
    private String stockStatus;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
