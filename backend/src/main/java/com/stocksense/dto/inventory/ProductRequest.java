package com.stocksense.dto.inventory;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductRequest {

    @NotBlank(message = "Product name is required")
    private String name;

    @NotBlank(message = "SKU is required")
    private String sku;

    @NotNull(message = "Category ID is required")
    private Long categoryId;

    @NotBlank(message = "Unit of measure is required")
    private String unitOfMeasure;

    @DecimalMin(value = "0.0", message = "Unit cost must be >= 0")
    private BigDecimal unitCost;

    @Min(value = 0, message = "Reorder level must be >= 0")
    @Builder.Default
    private Integer reorderLevel = 0;
}
