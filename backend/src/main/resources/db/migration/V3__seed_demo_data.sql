-- =====================================================
-- V3: Seed Demo Data
-- =====================================================
-- NOTE: User seeding is handled by DataInitializer.java
-- to ensure BCrypt hashes are correctly generated at runtime.

-- =====================================================
-- 1. Categories
-- =====================================================
INSERT INTO categories (name, description, active) VALUES
    ('Raw Materials', 'Base materials used in production', TRUE),
    ('Components', 'Parts and components for assembly', TRUE),
    ('Finished Goods', 'Completed products ready for delivery', TRUE),
    ('Packaging', 'Packaging materials and supplies', TRUE);

-- =====================================================
-- 2. Warehouses
-- =====================================================
INSERT INTO warehouses (name, code, address, active) VALUES
    ('Main Warehouse', 'WH', '123 Industrial Avenue, City Center', TRUE),
    ('Warehouse 2', 'WH2', '456 Distribution Road, East District', TRUE);

-- =====================================================
-- 3. Locations (hierarchical)
-- =====================================================
-- Main Warehouse locations
INSERT INTO locations (name, code, warehouse_id, parent_location_id, active) VALUES
    ('Rack A', 'WH-RA', 1, NULL, TRUE),
    ('Rack B', 'WH-RB', 1, NULL, TRUE),
    ('Production Area', 'WH-PA', 1, NULL, TRUE);

-- Child locations under Production Area (id=3)
INSERT INTO locations (name, code, warehouse_id, parent_location_id, active) VALUES
    ('Rack P1', 'WH-PA-P1', 1, 3, TRUE),
    ('Rack P2', 'WH-PA-P2', 1, 3, TRUE);

-- Warehouse 2 locations
INSERT INTO locations (name, code, warehouse_id, parent_location_id, active) VALUES
    ('Rack C', 'WH2-RC', 2, NULL, TRUE);

-- =====================================================
-- 4. Products (with unitCost, at least one below reorder level)
-- =====================================================
INSERT INTO products (name, sku, category_id, unit_of_measure, unit_cost, reorder_level, active) VALUES
    ('Steel Rod',        'STL-ROD-001',  1, 'pieces', 25.50,  50,  TRUE),
    ('Copper Wire',      'CPR-WIR-001',  1, 'meters', 12.75,  100, TRUE),
    ('Bearings',         'BRG-STD-001',  2, 'pieces', 8.90,   200, TRUE),
    ('Plastic Sheets',   'PLS-SHT-001',  1, 'sheets', 15.00,  30,  TRUE),
    ('Office Chairs',    'OFC-CHR-001',  3, 'pieces', 150.00, 10,  TRUE),
    ('Packaging Boxes',  'PKG-BOX-001',  4, 'pieces', 2.50,   500, TRUE);

-- =====================================================
-- 5. Stock (some below reorder level for low-stock alerts)
-- =====================================================
INSERT INTO stock (product_id, location_id, quantity_on_hand, quantity_reserved, version) VALUES
    (1, 1, 45, 0, 0),    -- Steel Rod in Rack A: 45 (below reorder 50)
    (2, 1, 250, 0, 0),   -- Copper Wire in Rack A: 250
    (3, 2, 150, 20, 0),  -- Bearings in Rack B: 150 (below reorder 200)
    (4, 2, 60, 0, 0),    -- Plastic Sheets in Rack B: 60
    (5, 4, 25, 0, 0),    -- Office Chairs in Rack P1: 25
    (6, 6, 300, 50, 0),  -- Packaging Boxes in Rack C (WH2): 300 (below reorder 500)
    (1, 6, 30, 0, 0),    -- Steel Rod also in Rack C (WH2)
    (2, 4, 100, 0, 0);   -- Copper Wire in Rack P1

-- =====================================================
-- 6. Sequence Counters (pre-seed to match the stock moves below)
-- =====================================================
INSERT INTO sequence_counters (warehouse_id, direction_code, last_value) VALUES
    (1, 'IN', 1),
    (1, 'OUT', 1),
    (1, 'INT', 1);

-- NOTE: StockMove seed data is handled by DataInitializer.java
-- because it requires valid user FK references that are created at runtime.
