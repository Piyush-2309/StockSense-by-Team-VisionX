package com.stocksense.dto.inventory;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request to directly update stock from the Stock screen (MANAGER only).
 * This internally creates an auto-validated ADJUSTMENT StockMove.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockUpdateRequest {

    @NotNull(message = "New quantity on hand is required")
    @Min(value = 0, message = "Quantity on hand must be >= 0")
    private Integer newQuantityOnHand;

    @NotBlank(message = "Reason is required")
    private String reason;
}
