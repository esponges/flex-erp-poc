-- Phase 3: Inventory table
-- This creates the inventory tracking table with calculated fields

CREATE TABLE inventory (
  id SERIAL PRIMARY KEY,
  organization_id INT NOT NULL REFERENCES organizations(id),
  sku_id INT NOT NULL REFERENCES skus(id),
  quantity INT NOT NULL DEFAULT 0,
  weighted_cost NUMERIC(12,4) NOT NULL DEFAULT 0.0,
  total_value NUMERIC(14,4) NOT NULL DEFAULT 0.0,
  is_manual_cost BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_cost_nonneg CHECK (weighted_cost >= 0),
  CONSTRAINT chk_quantity_nonneg CHECK (quantity >= 0),
  UNIQUE (organization_id, sku_id)
);

-- Create indexes for better performance
CREATE INDEX idx_inventory_organization ON inventory(organization_id);
CREATE INDEX idx_inventory_sku ON inventory(sku_id);
CREATE INDEX idx_inventory_org_sku ON inventory(organization_id, sku_id);

-- Insert sample inventory data for existing SKUs
INSERT INTO inventory (organization_id, sku_id, quantity, weighted_cost, total_value, is_manual_cost)
SELECT 
  s.organization_id,
  s.id,
  CASE 
    WHEN s.sku_code = 'ELEC-001' THEN 25
    WHEN s.sku_code = 'ELEC-002' THEN 150
    WHEN s.sku_code = 'FURN-001' THEN 8
    WHEN s.sku_code = 'STAT-001' THEN 500
    WHEN s.sku_code = 'STAT-002' THEN 0
    ELSE 10
  END as quantity,
  CASE 
    WHEN s.sku_code = 'ELEC-001' THEN 89.99
    WHEN s.sku_code = 'ELEC-002' THEN 12.50
    WHEN s.sku_code = 'FURN-001' THEN 245.00
    WHEN s.sku_code = 'STAT-001' THEN 1.25
    WHEN s.sku_code = 'STAT-002' THEN 15.99
    ELSE 10.00
  END as weighted_cost,
  CASE 
    WHEN s.sku_code = 'ELEC-001' THEN 25 * 89.99
    WHEN s.sku_code = 'ELEC-002' THEN 150 * 12.50
    WHEN s.sku_code = 'FURN-001' THEN 8 * 245.00
    WHEN s.sku_code = 'STAT-001' THEN 500 * 1.25
    WHEN s.sku_code = 'STAT-002' THEN 0
    ELSE 100.00
  END as total_value,
  FALSE as is_manual_cost
FROM skus s 
WHERE s.is_active = TRUE;