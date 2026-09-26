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
public class DeliveryRequest {

    private String customer;

    @NotNull(message = "Source location ID is required")
    private Long sourceLocationId;

    private LocalDate scheduledDate;

    @NotEmpty(message = "At least one item is required")
    @Valid
    private List<MoveLineRequest> items;

    private String notes;
}
