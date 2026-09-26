package com.stocksense.dto.inventory;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WarehouseResponse {
    private Long id;
    private String name;
    private String code;
    private String address;
    private Boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
