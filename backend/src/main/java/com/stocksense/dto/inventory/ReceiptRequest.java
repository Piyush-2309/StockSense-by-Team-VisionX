package com.stocksense.dto.inventory;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReceiptRequest {

    private String supplier;

    @NotNull(message = "Destination location ID is required")
    private Long destinationLocationId;

    private LocalDate scheduledDate;

    @NotEmpty(message = "At least one item is required")
    @Valid
    private List<MoveLineRequest> items;

    private String notes;
}
