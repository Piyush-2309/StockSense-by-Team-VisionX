package com.stocksense.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * Tracks current stock levels per product per location.
 * Uses optimistic locking via @Version for concurrent updates.
 *
 * Free-to-use quantity is derived: quantityOnHand - quantityReserved
 * (never persisted as a separate column).
 */
@Entity
@Table(name = "stock", uniqueConstraints = {
        @UniqueConstraint(name = "uq_stock_product_location", columnNames = {"product_id", "location_id"})
}, indexes = {
        @Index(name = "idx_stock_product_id", columnList = "product_id"),
        @Index(name = "idx_stock_location_id", columnList = "location_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Stock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "location_id", nullable = false)
    private Location location;

    @Column(name = "quantity_on_hand", nullable = false)
    @Builder.Default
    private Integer quantityOnHand = 0;

    @Column(name = "quantity_reserved", nullable = false)
    @Builder.Default
    private Integer quantityReserved = 0;

    @Version
    private Long version;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
