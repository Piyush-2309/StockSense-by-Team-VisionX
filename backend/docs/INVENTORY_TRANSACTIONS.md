# StockSense — Inventory Transactions Design

## Overview

This document describes the shared conventions for how inventory transactions
(receipts, deliveries, transfers, adjustments) interact with the `stock` and
`stock_moves` tables. **Both backend developers must agree on this before
writing transaction code.**

---

## StockMove Lifecycle (Section 3A)

```
                  ┌──────────┐
     Receipts ──▶ │  DRAFT   │──── validate ──▶ DONE (stock updated)
     Transfers ─▶ │          │──── cancel ────▶ CANCELED
     Adjustments▶ └──────────┘

                  ┌──────────┐    check     ┌──────────┐
     Deliveries ▶ │ WAITING  │───────────▶  │  READY   │── validate ──▶ DONE
                  │          │              │(reserved) │── cancel ────▶ CANCELED
                  └──────────┘              └──────────┘
                       │                         │
                       └──── cancel ─────────────┘──▶ CANCELED
```

### Status Meanings

| Status   | Stock Impact | Description                                  |
|----------|-------------|----------------------------------------------|
| DRAFT    | None        | Document created, no stock changes            |
| WAITING  | None        | Delivery created, stock not yet available     |
| READY    | Reserved    | Delivery stock reserved (`quantity_reserved`) |
| DONE     | Applied     | Stock quantities updated (`quantity_on_hand`) |
| CANCELED | Reversed    | Any reservations released, no net effect      |

---

## quantityReserved Convention

**Decision: Reserve at READY status for deliveries.**

When a delivery transitions from WAITING → READY:
- `stock.quantity_reserved` is **incremented** by the delivery line quantity
- This ensures the "Free to Use" value (`quantity_on_hand - quantity_reserved`)
  accurately reflects what's actually available

When a delivery transitions from READY → DONE:
- `stock.quantity_on_hand` is **decremented** by the delivery line quantity
- `stock.quantity_reserved` is **decremented** by the delivery line quantity

When a delivery transitions from READY → CANCELED:
- `stock.quantity_reserved` is **decremented** (reservation released)
- `stock.quantity_on_hand` is **NOT changed**

When a delivery transitions from WAITING → CANCELED:
- No stock changes (nothing was reserved)

### Free-to-Use Calculation

```
free_to_use = quantity_on_hand - quantity_reserved
```

This is **derived in the DTO/service layer**, never persisted.

---

## Stock Update Rules by Operation Type

### RECEIPT (DRAFT → DONE)
- `destination_location` required, `source_location` null
- On DONE: **increment** `stock.quantity_on_hand` at destination location
- `resulting_quantity` = new on-hand after increment

### DELIVERY (WAITING/READY → DONE)
- `source_location` required, `destination_location` null
- On READY: **increment** `stock.quantity_reserved` at source location
- On DONE: **decrement** `stock.quantity_on_hand` and `stock.quantity_reserved`
- `resulting_quantity` = new on-hand after decrement

### INTERNAL TRANSFER (DRAFT → DONE)
- Both `source_location` and `destination_location` required
- On DONE: **decrement** on-hand at source, **increment** on-hand at destination
- `resulting_quantity` = new on-hand at destination

### ADJUSTMENT (DRAFT → DONE)
- `destination_location` required (the location being adjusted)
- `reason` required
- Quantity can be positive (add stock) or negative (remove stock)
- On DONE: **add** quantity to `stock.quantity_on_hand` (signed)
- `resulting_quantity` = new on-hand after adjustment

---

## Locking Strategy

### Stock Table
Use `StockRepository.findByProductIdAndLocationIdForUpdate()` for ALL stock
mutations. This acquires a `PESSIMISTIC_WRITE` lock ensuring no concurrent
transaction can read-and-modify the same stock row.

### Sequence Counters
Use `SequenceCounterRepository.findByWarehouseIdAndDirectionCodeForUpdate()`
for reference number generation. Same pessimistic locking pattern.

### Optimistic Locking
`Stock.version` provides a secondary safety net via `@Version`. If two
transactions somehow bypass the pessimistic lock, the second commit will fail
with `OptimisticLockException`.

---

## Document-Level Operations

All document-level actions operate on **every StockMove row sharing the same
`documentId`** in a single transaction:

| Action          | Applies To       | Effect                                    |
|-----------------|------------------|-------------------------------------------|
| validate (DONE) | All lines        | Update stock, set validatedBy, resultingQty|
| cancel          | All lines        | Release reservations, set CANCELED        |
| mark-ready      | Delivery lines   | Reserve stock, set READY                  |
| check-availability | Delivery lines | Check free-to-use ≥ quantity per line     |

---

## Reference Number Generation

Backend Dev 2 calls `ReferenceGeneratorService.generate(type, warehouse)` once
per document creation, then copies the returned reference + a fresh `UUID` to
every `StockMove` row in that document.

**Do NOT create a second numbering scheme.**

Format: `{warehouse.code}/{direction}/{sequence}`
Example: `WH/IN/0001`, `WH2/OUT/0012`
