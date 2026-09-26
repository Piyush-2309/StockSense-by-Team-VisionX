package com.stocksense.dto.inventory;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Document-level response for receipts, deliveries, transfers, adjustments, and ledger entries.
 * Groups all StockMove rows sharing the same documentId into a single response with nested lines.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentResponse {
    private UUID documentId;
    private String reference;
    private String type;
    private String status;
    private String partnerName;
    private String reason;
    private String notes;
    private LocalDate scheduledDate;

    // Source/destination location info
    private Long sourceLocationId;
    private String sourceLocationName;
    private String sourceLocationCode;
    private Long sourceWarehouseId;
    private String sourceWarehouseName;

    private Long destinationLocationId;
    private String destinationLocationName;
    private String destinationLocationCode;
    private Long destinationWarehouseId;
    private String destinationWarehouseName;

    // User info
    private Long userId;
    private String userName;
    private Long validatedById;
    private String validatedByName;

    private List<MoveLineResponse> lines;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
