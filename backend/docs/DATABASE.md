# StockSense — Database Design

## Entity-Relationship Overview

```
User ──< StockMove (as user / responsible / validatedBy)
Category ──< Product ──< Stock
                     └──< StockMove
Warehouse ──< Location ──< Stock
                       └──< StockMove (as sourceLocation / destinationLocation)
Location ──< Location (self-referential hierarchy: parent → children)
```

## Tables

### users
| Column        | Type           | Constraints        |
|---------------|----------------|--------------------|
| id            | BIGSERIAL      | PK                 |
| name          | VARCHAR(100)   | NOT NULL           |
| email         | VARCHAR(255)   | NOT NULL, UNIQUE   |
| password_hash | VARCHAR(255)   | NOT NULL           |
| role          | VARCHAR(20)    | NOT NULL, CHECK    |
| active        | BOOLEAN        | NOT NULL, DEFAULT TRUE |
| created_at    | TIMESTAMP      | NOT NULL           |
| updated_at    | TIMESTAMP      | NOT NULL           |

Roles: `MANAGER`, `STAFF`

### warehouses
| Column     | Type          | Constraints        |
|------------|---------------|--------------------|
| id         | BIGSERIAL     | PK                 |
| name       | VARCHAR(100)  | NOT NULL           |
| code       | VARCHAR(20)   | NOT NULL, UNIQUE   |
| address    | VARCHAR(500)  |                    |
| active     | BOOLEAN       | NOT NULL, DEFAULT TRUE |
| created_at | TIMESTAMP     | NOT NULL           |
| updated_at | TIMESTAMP     | NOT NULL           |

### locations
| Column             | Type          | Constraints                    |
|--------------------|---------------|--------------------------------|
| id                 | BIGSERIAL     | PK                             |
| name               | VARCHAR(100)  | NOT NULL                       |
| code               | VARCHAR(50)   | NOT NULL                       |
| warehouse_id       | BIGINT        | NOT NULL, FK → warehouses(id)  |
| parent_location_id | BIGINT        | FK → locations(id), NULLABLE   |
| active             | BOOLEAN       | NOT NULL, DEFAULT TRUE         |
| created_at         | TIMESTAMP     | NOT NULL                       |
| updated_at         | TIMESTAMP     | NOT NULL                       |

Supports hierarchical nesting: Warehouse → Location → child Location.

### categories
| Column      | Type          | Constraints        |
|-------------|---------------|--------------------|
| id          | BIGSERIAL     | PK                 |
| name        | VARCHAR(100)  | NOT NULL, UNIQUE   |
| description | VARCHAR(500)  |                    |
| active      | BOOLEAN       | NOT NULL, DEFAULT TRUE |
| created_at  | TIMESTAMP     | NOT NULL           |
| updated_at  | TIMESTAMP     | NOT NULL           |

### products
| Column          | Type           | Constraints                    |
|-----------------|----------------|--------------------------------|
| id              | BIGSERIAL      | PK                             |
| name            | VARCHAR(200)   | NOT NULL                       |
| sku             | VARCHAR(50)    | NOT NULL, UNIQUE               |
| category_id     | BIGINT         | NOT NULL, FK → categories(id)  |
| unit_of_measure | VARCHAR(30)    | NOT NULL                       |
| unit_cost       | NUMERIC(12,2)  |                                |
| reorder_level   | INT            | NOT NULL, DEFAULT 0, CHECK ≥ 0 |
| active          | BOOLEAN        | NOT NULL, DEFAULT TRUE         |
| created_at      | TIMESTAMP      | NOT NULL                       |
| updated_at      | TIMESTAMP      | NOT NULL                       |

### stock
| Column            | Type      | Constraints                                 |
|-------------------|-----------|---------------------------------------------|
| id                | BIGSERIAL | PK                                          |
| product_id        | BIGINT    | NOT NULL, FK → products(id)                 |
| location_id       | BIGINT    | NOT NULL, FK → locations(id)                |
| quantity_on_hand  | INT       | NOT NULL, DEFAULT 0                         |
| quantity_reserved | INT       | NOT NULL, DEFAULT 0                         |
| version           | BIGINT    | NOT NULL, DEFAULT 0 (optimistic locking)    |
| updated_at        | TIMESTAMP | NOT NULL                                    |

**UNIQUE constraint:** `(product_id, location_id)`

**Free-to-use** is a derived value: `quantity_on_hand - quantity_reserved` (computed in service/DTO layer, never persisted).

### stock_moves (unified document + ledger — see Section 3A)
| Column                  | Type          | Constraints                      |
|-------------------------|---------------|----------------------------------|
| id                      | BIGSERIAL     | PK (row-level)                   |
| document_id             | UUID          | NOT NULL (shared by all lines)   |
| reference               | VARCHAR(50)   | NOT NULL (human-readable number) |
| type                    | VARCHAR(20)   | NOT NULL, CHECK                  |
| status                  | VARCHAR(20)   | NOT NULL, CHECK                  |
| product_id              | BIGINT        | NOT NULL, FK → products(id)      |
| quantity                | INT           | NOT NULL                         |
| source_location_id      | BIGINT        | FK → locations(id), NULLABLE     |
| destination_location_id | BIGINT        | FK → locations(id), NULLABLE     |
| partner_name            | VARCHAR(200)  | NULLABLE                         |
| responsible_id          | BIGINT        | FK → users(id), NULLABLE         |
| reason                  | VARCHAR(500)  | NULLABLE, required for ADJUSTMENT|
| scheduled_date          | DATE          | NULLABLE                         |
| user_id                 | BIGINT        | NOT NULL, FK → users(id)         |
| validated_by_id         | BIGINT        | FK → users(id), NULLABLE         |
| resulting_quantity      | INT           | NULLABLE                         |
| created_at              | TIMESTAMP     | NOT NULL                         |
| updated_at              | TIMESTAMP     | NOT NULL                         |

**Types:** `RECEIPT`, `DELIVERY`, `INTERNAL`, `ADJUSTMENT`
**Statuses:** `DRAFT`, `WAITING`, `READY`, `DONE`, `CANCELED`

### sequence_counters
| Column         | Type       | Constraints                               |
|----------------|------------|-------------------------------------------|
| id             | BIGSERIAL  | PK                                        |
| warehouse_id   | BIGINT     | NOT NULL                                  |
| direction_code | VARCHAR(10)| NOT NULL                                  |
| last_value     | BIGINT     | NOT NULL, DEFAULT 0                       |

**UNIQUE constraint:** `(warehouse_id, direction_code)`

## Section 3A: StockMove / documentId Design

### Key Concept

There is **exactly one table**: `stock_moves`. It IS the document, and it IS the ledger — never two different things.

- **One row = one product line** of one document
- A receipt/delivery/transfer/adjustment with 3 products creates **3 StockMove rows** in a single transaction
- All rows created together share one `document_id` (UUID) and one `reference` (human-readable, e.g. `WH/IN/0001`)
- **DRAFT/WAITING/READY** statuses do NOT touch the `stock` table
- Only **DONE** status transition updates `stock.quantity_on_hand`
- All document-level actions address by `document_id`, not by individual row `id`

### Filtered Views

| API View          | Filter                         |
|-------------------|--------------------------------|
| Receipts          | `type = 'RECEIPT'`             |
| Deliveries        | `type = 'DELIVERY'`           |
| Transfers         | `type = 'INTERNAL'`           |
| Adjustments       | `type = 'ADJUSTMENT'`         |
| Stock Ledger      | All types, typically `status = 'DONE'` |

### Reference Number Format

Format: `{warehouse.code}/{directionCode}/{sequence}`
Example: `WH/IN/0001`, `WH2/OUT/0012`

Direction code mapping:
- RECEIPT → IN
- DELIVERY → OUT
- INTERNAL → INT
- ADJUSTMENT → ADJ

## Indexes

See `V2__constraints_and_indexes.sql` for all indexes. Key ones:
- `stock_moves.document_id` — hottest lookup path
- `stock(product_id, location_id)` — unique constraint
- `users.email`, `products.sku` — unique lookups

## Environment Variables

| Variable       | Default                                  | Description              |
|----------------|------------------------------------------|--------------------------|
| DB_URL         | jdbc:postgresql://localhost:5432/stocksense | Database URL          |
| DB_USERNAME    | stocksense                               | Database username        |
| DB_PASSWORD    | stocksense                               | Database password        |
| SERVER_PORT    | 8080                                     | Server port              |
