package com.stocksense.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Unified document + ledger entity (see Section 3A of the architecture spec).
 *
 * One row = one product line of one document.
 * A receipt/delivery/transfer/adjustment with N products creates N rows,
 * all sharing the same documentId and reference.
 *
 * Receipts, Deliveries, Transfers, Adjustments, and the Stock Ledger
 * are five different filtered views over this single table.
 */
@Entity
@Table(name = "stock_moves", indexes = {
        @Index(name = "idx_stock_moves_document_id", columnList = "document_id"),
        @Index(name = "idx_stock_moves_reference", columnList = "reference"),
        @Index(name = "idx_stock_moves_product_id", columnList = "product_id"),
        @Index(name = "idx_stock_moves_type", columnList = "type"),
        @Index(name = "idx_stock_moves_status", columnList = "status"),
        @Index(name = "idx_stock_moves_created_at", columnList = "created_at"),
        @Index(name = "idx_stock_moves_user_id", columnList = "user_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StockMove {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * UUID shared by every line of the same document.
     * Used as the REST path identifier for document-level actions.
     */
    @Column(name = "document_id", nullable = false, updatable = false)
    private UUID documentId;

    /**
     * Human-readable reference number, e.g. "WH/IN/0001".
     * Shared by every line of the same document.
     */
    @Column(name = "reference", nullable = false, length = 50)
    private String reference;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private OperationType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private MoveStatus status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false)
    private Integer quantity;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "source_location_id")
    private Location sourceLocation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "destination_location_id")
    private Location destinationLocation;

    /** Vendor for RECEIPT, customer for DELIVERY. */
    @Column(name = "partner_name", length = 200)
    private String partnerName;

    /** Defaults to the creator; FK to User. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "responsible_id")
    private User responsible;

    /** Required for ADJUSTMENT type. */
    @Column(length = 500)
    private String reason;

    @Column(name = "scheduled_date")
    private LocalDate scheduledDate;

    /** The user who created this move. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /** Set when status transitions to DONE. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "validated_by_id")
    private User validatedBy;

    /**
     * The on-hand quantity after this line was applied.
     * Populated at validate time (DONE transition).
     */
    @Column(name = "resulting_quantity")
    private Integer resultingQuantity;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
