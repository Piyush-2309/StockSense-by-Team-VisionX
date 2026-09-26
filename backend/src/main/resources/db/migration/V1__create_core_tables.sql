-- =====================================================
-- V1: Core Tables for StockSense
-- =====================================================

-- Users
CREATE TABLE users (
    id              BIGSERIAL PRIMARY KEY,
    name            VARCHAR(100)  NOT NULL,
    email           VARCHAR(255)  NOT NULL UNIQUE,
    password_hash   VARCHAR(255)  NOT NULL,
    role            VARCHAR(20)   NOT NULL CHECK (role IN ('MANAGER', 'STAFF')),
    active          BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP     NOT NULL DEFAULT NOW()
);

-- Warehouses
CREATE TABLE warehouses (
    id              BIGSERIAL PRIMARY KEY,
    name            VARCHAR(100)  NOT NULL,
    code            VARCHAR(20)   NOT NULL UNIQUE,
    address         VARCHAR(500),
    active          BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP     NOT NULL DEFAULT NOW()
);

-- Locations (hierarchical: warehouse → location → child location)
CREATE TABLE locations (
    id                  BIGSERIAL PRIMARY KEY,
    name                VARCHAR(100) NOT NULL,
    code                VARCHAR(50)  NOT NULL,
    warehouse_id        BIGINT       NOT NULL REFERENCES warehouses(id),
    parent_location_id  BIGINT       REFERENCES locations(id),
    active              BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- Categories
CREATE TABLE categories (
    id              BIGSERIAL PRIMARY KEY,
    name            VARCHAR(100)  NOT NULL UNIQUE,
    description     VARCHAR(500),
    active          BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP     NOT NULL DEFAULT NOW()
);

-- Products
CREATE TABLE products (
    id              BIGSERIAL       PRIMARY KEY,
    name            VARCHAR(200)    NOT NULL,
    sku             VARCHAR(50)     NOT NULL UNIQUE,
    category_id     BIGINT          NOT NULL REFERENCES categories(id),
    unit_of_measure VARCHAR(30)     NOT NULL,
    unit_cost       NUMERIC(12, 2),
    reorder_level   INT             NOT NULL DEFAULT 0 CHECK (reorder_level >= 0),
    active          BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP       NOT NULL DEFAULT NOW()
);

-- Stock (current inventory per product per location)
CREATE TABLE stock (
    id                  BIGSERIAL PRIMARY KEY,
    product_id          BIGINT    NOT NULL REFERENCES products(id),
    location_id         BIGINT    NOT NULL REFERENCES locations(id),
    quantity_on_hand    INT       NOT NULL DEFAULT 0,
    quantity_reserved   INT       NOT NULL DEFAULT 0,
    version             BIGINT    NOT NULL DEFAULT 0,
    updated_at          TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_stock_product_location UNIQUE (product_id, location_id)
);

-- StockMove — unified document + ledger (Section 3A)
CREATE TABLE stock_moves (
    id                      BIGSERIAL PRIMARY KEY,
    document_id             UUID         NOT NULL,
    reference               VARCHAR(50)  NOT NULL,
    type                    VARCHAR(20)  NOT NULL CHECK (type IN ('RECEIPT', 'DELIVERY', 'INTERNAL', 'ADJUSTMENT')),
    status                  VARCHAR(20)  NOT NULL CHECK (status IN ('DRAFT', 'WAITING', 'READY', 'DONE', 'CANCELED')),
    product_id              BIGINT       NOT NULL REFERENCES products(id),
    quantity                INT          NOT NULL,
    source_location_id      BIGINT       REFERENCES locations(id),
    destination_location_id BIGINT       REFERENCES locations(id),
    partner_name            VARCHAR(200),
    responsible_id          BIGINT       REFERENCES users(id),
    reason                  VARCHAR(500),
    scheduled_date          DATE,
    user_id                 BIGINT       NOT NULL REFERENCES users(id),
    validated_by_id         BIGINT       REFERENCES users(id),
    resulting_quantity      INT,
    created_at              TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- Refresh Tokens
CREATE TABLE refresh_tokens (
    id          BIGSERIAL PRIMARY KEY,
    token       VARCHAR(500)  NOT NULL UNIQUE,
    user_id     BIGINT        NOT NULL REFERENCES users(id),
    expires_at  TIMESTAMP     NOT NULL,
    revoked     BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP     NOT NULL DEFAULT NOW()
);

-- OTP Tokens
CREATE TABLE otp_tokens (
    id              BIGSERIAL PRIMARY KEY,
    otp_hash        VARCHAR(255) NOT NULL,
    user_id         BIGINT       NOT NULL REFERENCES users(id),
    expires_at      TIMESTAMP    NOT NULL,
    attempt_count   INT          NOT NULL DEFAULT 0,
    used            BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- Sequence Counters (for reference number generation)
CREATE TABLE sequence_counters (
    id              BIGSERIAL PRIMARY KEY,
    warehouse_id    BIGINT      NOT NULL,
    direction_code  VARCHAR(10) NOT NULL,
    last_value      BIGINT      NOT NULL DEFAULT 0,
    CONSTRAINT uq_sequence_counter UNIQUE (warehouse_id, direction_code)
);
