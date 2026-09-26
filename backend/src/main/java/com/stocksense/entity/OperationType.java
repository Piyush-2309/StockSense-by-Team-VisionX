package com.stocksense.entity;

/**
 * Type of stock movement / operation.
 * Maps to the direction code used in reference generation:
 *   RECEIPT  → IN
 *   DELIVERY → OUT
 *   INTERNAL → INT
 *   ADJUSTMENT → ADJ
 */
public enum OperationType {
    RECEIPT,
    DELIVERY,
    INTERNAL,
    ADJUSTMENT
}
