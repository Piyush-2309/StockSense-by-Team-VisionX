package com.stocksense.dto.inventory;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdjustmentLineRequest {

    @NotNull(message = "Product ID is required")
    private Long productId;

    @NotNull(message = "Physical quantity is required")
    @Min(value = 0, message = "Physical quantity must be >= 0")
    private Integer physicalQuantity;
}
