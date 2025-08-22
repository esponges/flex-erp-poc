-- Phase 2: SKUs table
-- This creates the core SKU (Stock Keeping Unit) table for product management

CREATE TABLE skus (
  id SERIAL PRIMARY KEY,
  organization_id INT NOT NULL REFERENCES organizations(id),
  sku_code VARCHAR(50) NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  supplier VARCHAR(255),
  barcode VARCHAR(50) UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT skus_org_sku_unique UNIQUE (organization_id, sku_code)
);

-- Create indexes for better performance
CREATE INDEX idx_skus_organization ON skus(organization_id);
CREATE INDEX idx_skus_active ON skus(organization_id, is_active);
CREATE INDEX idx_skus_category ON skus(organization_id, category);
CREATE INDEX idx_skus_code ON skus(sku_code);

-- Insert sample data for testing
INSERT INTO skus (organization_id, sku_code, product_name, description, category, supplier, is_active) VALUES
(1, 'ELEC-001', 'Wireless Bluetooth Headphones', 'High-quality wireless headphones with noise cancellation', 'Electronics', 'TechCorp', TRUE),
(1, 'ELEC-002', 'USB-C Cable 2M', 'Durable USB-C to USB-A cable, 2 meters length', 'Electronics', 'CableCo', TRUE),
(1, 'FURN-001', 'Office Desk Chair', 'Ergonomic office chair with lumbar support', 'Furniture', 'OfficeMax', TRUE),
(1, 'STAT-001', 'Blue Ballpoint Pen', 'Classic blue ink ballpoint pen', 'Stationery', 'PenCorp', TRUE),
(1, 'STAT-002', 'A4 Copy Paper', 'White A4 paper, 500 sheets per ream', 'Stationery', 'PaperPlus', FALSE);