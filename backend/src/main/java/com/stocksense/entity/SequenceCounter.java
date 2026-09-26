package com.stocksense.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * Tracks per-(warehouse, directionCode) counters for reference number generation.
 * Uses row-level locking (SELECT ... FOR UPDATE) to prevent duplicate references
 * under concurrent access.
 */
@Entity
@Table(name = "sequence_counters", uniqueConstraints = {
        @UniqueConstraint(name = "uq_sequence_counter", columnNames = {"warehouse_id", "direction_code"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SequenceCounter {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "warehouse_id", nullable = false)
    private Long warehouseId;

    @Column(name = "direction_code", nullable = false, length = 10)
    private String directionCode;

    @Column(name = "last_value", nullable = false)
    @Builder.Default
    private Long lastValue = 0L;
}
