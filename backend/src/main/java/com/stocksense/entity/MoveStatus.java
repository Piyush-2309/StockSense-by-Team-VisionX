package com.stocksense.entity;

/**
 * Status lifecycle for a StockMove document.
 *
 * DRAFT    — initial status for receipts, transfers, adjustments.
 * WAITING  — delivery created but products not yet reserved / not available.
 * READY    — delivery with all products available (reserved in Stock).
 * DONE     — validated/completed; stock quantities have been updated.
 * CANCELED — document cancelled; no stock impact.
 */
public enum MoveStatus {
    DRAFT,
    WAITING,
    READY,
    DONE,
    CANCELED
}
