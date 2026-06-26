-- Migration 048: Create Store Products Table
-- Date: 25 Jun 2026

CREATE TABLE IF NOT EXISTS store_products (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    offer_price DECIMAL(10,2),
    image_url TEXT,
    category VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active', -- active, inactive, deleted
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_store_products_tenant ON store_products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_store_products_status ON store_products(status);

COMMENT ON TABLE store_products IS 'Catálogo de productos para la Tienda Online PWA';
