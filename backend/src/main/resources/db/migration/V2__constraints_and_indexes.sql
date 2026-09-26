-- =====================================================
-- V2: Indexes for Performance
-- =====================================================

-- Users
CREATE INDEX idx_users_email ON users(email);

-- Warehouses
CREATE INDEX idx_warehouses_code ON warehouses(code);

-- Locations
CREATE INDEX idx_locations_warehouse_id ON locations(warehouse_id);

-- Products
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_category_id ON products(category_id);

-- Stock
CREATE INDEX idx_stock_product_id ON stock(product_id);
CREATE INDEX idx_stock_location_id ON stock(location_id);

-- StockMove — document_id is the hottest lookup path
CREATE INDEX idx_stock_moves_document_id ON stock_moves(document_id);
CREATE INDEX idx_stock_moves_reference ON stock_moves(reference);
CREATE INDEX idx_stock_moves_product_id ON stock_moves(product_id);
CREATE INDEX idx_stock_moves_type ON stock_moves(type);
CREATE INDEX idx_stock_moves_status ON stock_moves(status);
CREATE INDEX idx_stock_moves_created_at ON stock_moves(created_at);
CREATE INDEX idx_stock_moves_user_id ON stock_moves(user_id);

-- Refresh Tokens
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);

-- OTP Tokens
CREATE INDEX idx_otp_tokens_user_id ON otp_tokens(user_id);
