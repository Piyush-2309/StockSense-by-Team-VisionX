# Inventory Transactions — Concurrency & Safety Design

## Concurrency Strategy

StockSense uses a **hybrid locking strategy** to prevent concurrent modification conflicts:

### Optimistic Locking (`Stock.version`)

The `Stock` entity has a `@Version` field that Hibernate automatically increments on each update. If two transactions read the same stock row, modify it, and try to commit, the second one will fail with an `OptimisticLockException` — which we catch and map to a **409 CONCURRENT_MODIFICATION** response:

```json
{
  "success": false,
  "code": "CONCURRENT_MODIFICATION",
  "message": "This record was modified by another request. Please retry.",
  "path": "/api/v1/deliveries/{documentId}/validate",
  "timestamp": "..."
}
```

### Pessimistic Write Locks (for stock mutations)

For all stock-changing operations (receipt validate, delivery validate, transfer validate, adjustment validate), we use `StockRepository.findByProductIdAndLocationIdForUpdate()` which acquires a **`SELECT ... FOR UPDATE`** row-level lock. This serializes concurrent writes to the same product-location stock row:

```text
Transaction A: SELECT s FROM Stock WHERE product=1 AND location=1 FOR UPDATE → locks row
Transaction B: SELECT s FROM Stock WHERE product=1 AND location=1 FOR UPDATE → BLOCKS until A commits
```

This prevents the "double spend" problem described in Section 8:
- Stock = 10
- Request A wants 8, Request B wants 7
- Both cannot see 10 and succeed independently
- Only one succeeds; the other sees the updated quantity and fails with INSUFFICIENT_STOCK

### Why Both?

- **Pessimistic locks** (FOR UPDATE) are the primary defense — they serialize concurrent stock mutations
- **Optimistic locking** (@Version) is the safety net — it catches any case we might have missed, e.g. bulk updates that bypass the FOR UPDATE query

## Transaction Boundaries

Every stock-changing operation follows this flow:

```text
BEGIN TRANSACTION
  → Validate document status (must be READY/DRAFT depending on type)
  → Validate all product/location references
  → For each line:
      → Read & lock current stock (FOR UPDATE)
      → Validate quantity constraints (e.g., sufficient stock for deliveries)
      → Modify stock (increase/decrease/adjust)
      → Update StockMove row (status=DONE, resultingQuantity, validatedBy)
  → COMMIT
  (or ROLLBACK on any failure — no partial state)
```

### Atomicity Guarantee

If *any* line in a multi-line document fails validation (e.g., line 3 of 5 has insufficient stock), the **entire transaction rolls back**. No lines are partially validated. The stock and StockMove rows remain unchanged.

## Idempotency / Duplicate Protection

A `DONE` document cannot be re-validated. Calling `PATCH .../validate` on an already-completed document returns:

```json
{
  "success": false,
  "code": "INVALID_STATE_TRANSITION",
  "message": "Document is already validated (DONE). Cannot modify a completed document."
}
```

This is enforced server-side regardless of frontend button state.

## State Transition Table

| Type       | Valid Transitions                                 | Cancel From              |
|------------|---------------------------------------------------|--------------------------|
| RECEIPT    | DRAFT → READY → DONE                             | DRAFT, READY → CANCELED  |
| DELIVERY   | DRAFT → WAITING ↔ READY → DONE                  | DRAFT, WAITING, READY    |
| INTERNAL   | DRAFT → DONE                                      | DRAFT → CANCELED         |
| ADJUSTMENT | DRAFT → DONE (MANAGER only)                      | DRAFT → CANCELED         |

**Always invalid:** DONE → anything, CANCELED → anything.

## Negative Stock Policy

`quantityOnHand >= 0` is enforced at the service layer. Any delivery or adjustment that would push stock negative is rejected with **409 INSUFFICIENT_STOCK**.
