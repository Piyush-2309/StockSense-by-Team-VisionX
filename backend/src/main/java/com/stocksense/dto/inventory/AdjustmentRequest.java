package com.stocksense.dto.inventory;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdjustmentRequest {

    @NotNull(message = "Location ID is required")
    private Long locationId;

    @NotBlank(message = "Reason is required")
    private String reason;

    private String notes;

    @NotEmpty(message = "At least one item is required")
    @Valid
    private List<AdjustmentLineRequest> items;
}
