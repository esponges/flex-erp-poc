-- Create transactions table for inventory in/out operations
CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  organization_id INT NOT NULL REFERENCES organizations(id),
  sku_id INT NOT NULL REFERENCES skus(id),
  transaction_type VARCHAR(10) NOT NULL CHECK (transaction_type IN ('in', 'out')),
  quantity INT NOT NULL CHECK (quantity > 0),
  unit_cost NUMERIC(12,4) NOT NULL DEFAULT 0.0 CHECK (unit_cost >= 0),
  total_cost NUMERIC(14,4) NOT NULL DEFAULT 0.0 CHECK (total_cost >= 0),
  reference_number VARCHAR(100),
  notes TEXT,
  created_by INT NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX idx_transactions_organization ON transactions(organization_id);
CREATE INDEX idx_transactions_sku ON transactions(sku_id);
CREATE INDEX idx_transactions_type ON transactions(transaction_type);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
CREATE INDEX idx_transactions_org_sku ON transactions(organization_id, sku_id);
CREATE INDEX idx_transactions_org_type ON transactions(organization_id, transaction_type);

-- Insert sample transaction data
INSERT INTO transactions (organization_id, sku_id, transaction_type, quantity, unit_cost, total_cost, reference_number, notes, created_by)
SELECT 
  s.organization_id,
  s.id,
  'in' as transaction_type,
  CASE 
    WHEN s.sku_code = 'ELEC-001' THEN 25
    WHEN s.sku_code = 'ELEC-002' THEN 150
    WHEN s.sku_code = 'FURN-001' THEN 8
    WHEN s.sku_code = 'STAT-001' THEN 500
    WHEN s.sku_code = 'STAT-002' THEN 50
    ELSE 10
  END as quantity,
  CASE 
    WHEN s.sku_code = 'ELEC-001' THEN 89.99
    WHEN s.sku_code = 'ELEC-002' THEN 12.50
    WHEN s.sku_code = 'FURN-001' THEN 245.00
    WHEN s.sku_code = 'STAT-001' THEN 1.25
    WHEN s.sku_code = 'STAT-002' THEN 15.99
    ELSE 10.00
  END as unit_cost,
  CASE 
    WHEN s.sku_code = 'ELEC-001' THEN 25 * 89.99
    WHEN s.sku_code = 'ELEC-002' THEN 150 * 12.50
    WHEN s.sku_code = 'FURN-001' THEN 8 * 245.00
    WHEN s.sku_code = 'STAT-001' THEN 500 * 1.25
    WHEN s.sku_code = 'STAT-002' THEN 50 * 15.99
    ELSE 100.00
  END as total_cost,
  CASE 
    WHEN s.sku_code = 'ELEC-001' THEN 'PO-2024-001'
    WHEN s.sku_code = 'ELEC-002' THEN 'PO-2024-002'
    WHEN s.sku_code = 'FURN-001' THEN 'PO-2024-003'
    WHEN s.sku_code = 'STAT-001' THEN 'PO-2024-004'
    WHEN s.sku_code = 'STAT-002' THEN 'PO-2024-005'
    ELSE 'PO-2024-000'
  END as reference_number,
  CASE 
    WHEN s.sku_code = 'ELEC-001' THEN 'Initial stock - premium headphones'
    WHEN s.sku_code = 'ELEC-002' THEN 'Bulk order - USB cables'
    WHEN s.sku_code = 'FURN-001' THEN 'Office furniture delivery'
    WHEN s.sku_code = 'STAT-001' THEN 'Stationery supply restock'
    WHEN s.sku_code = 'STAT-002' THEN 'Red pen markers'
    ELSE 'Initial inventory'
  END as notes,
  u.id as created_by
FROM skus s
JOIN users u ON s.organization_id = u.organization_id
WHERE s.is_active = TRUE
AND u.role = 'admin'
LIMIT 5;

-- Add some sample outbound transactions
INSERT INTO transactions (organization_id, sku_id, transaction_type, quantity, unit_cost, total_cost, reference_number, notes, created_by)
SELECT 
  s.organization_id,
  s.id,
  'out' as transaction_type,
  CASE 
    WHEN s.sku_code = 'STAT-002' THEN 50  -- All red pens sold out
    WHEN s.sku_code = 'STAT-001' THEN 25  -- Some blue pens sold
    ELSE 2
  END as quantity,
  CASE 
    WHEN s.sku_code = 'ELEC-001' THEN 89.99
    WHEN s.sku_code = 'ELEC-002' THEN 12.50
    WHEN s.sku_code = 'FURN-001' THEN 245.00
    WHEN s.sku_code = 'STAT-001' THEN 1.25
    WHEN s.sku_code = 'STAT-002' THEN 15.99
    ELSE 10.00
  END as unit_cost,
  CASE 
    WHEN s.sku_code = 'ELEC-001' THEN 2 * 89.99
    WHEN s.sku_code = 'ELEC-002' THEN 2 * 12.50
    WHEN s.sku_code = 'FURN-001' THEN 2 * 245.00
    WHEN s.sku_code = 'STAT-001' THEN 25 * 1.25
    WHEN s.sku_code = 'STAT-002' THEN 50 * 15.99
    ELSE 20.00
  END as total_cost,
  CASE 
    WHEN s.sku_code = 'ELEC-001' THEN 'SO-2024-001'
    WHEN s.sku_code = 'ELEC-002' THEN 'SO-2024-002'
    WHEN s.sku_code = 'FURN-001' THEN 'SO-2024-003'
    WHEN s.sku_code = 'STAT-001' THEN 'SO-2024-004'
    WHEN s.sku_code = 'STAT-002' THEN 'SO-2024-005'
    ELSE 'SO-2024-000'
  END as reference_number,
  CASE 
    WHEN s.sku_code = 'ELEC-001' THEN 'Customer order - 2 headphones'
    WHEN s.sku_code = 'ELEC-002' THEN 'Internal use - 2 cables'
    WHEN s.sku_code = 'FURN-001' THEN 'Office relocation - 2 chairs'
    WHEN s.sku_code = 'STAT-001' THEN 'Office supplies order'
    WHEN s.sku_code = 'STAT-002' THEN 'Complete inventory sold'
    ELSE 'Sample outbound transaction'
  END as notes,
  u.id as created_by
FROM skus s
JOIN users u ON s.organization_id = u.organization_id
WHERE s.is_active = TRUE
AND u.role = 'admin'
LIMIT 5;