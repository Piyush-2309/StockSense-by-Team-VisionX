package com.stocksense.dto.inventory;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LocationRequest {

    @NotBlank(message = "Location name is required")
    private String name;

    @NotBlank(message = "Location code is required")
    private String code;

    @NotNull(message = "Warehouse ID is required")
    private Long warehouseId;

    private Long parentLocationId;
}
