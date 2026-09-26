package com.stocksense.dto.inventory;

import jakarta.validation.Valid;
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
public class TransferRequest {

    @NotNull(message = "Source location ID is required")
    private Long sourceLocationId;

    @NotNull(message = "Destination location ID is required")
    private Long destinationLocationId;

    @NotEmpty(message = "At least one item is required")
    @Valid
    private List<MoveLineRequest> items;

    private String notes;
}
