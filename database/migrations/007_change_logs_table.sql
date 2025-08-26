-- Migration: Create change_logs table for audit trail
-- This tracks all changes made to entities across the system

CREATE TABLE change_logs (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('sku', 'inventory', 'transaction', 'user', 'field_alias')),
    entity_id INTEGER,
    sku_id INTEGER REFERENCES skus(id) ON DELETE SET NULL,
    change_type VARCHAR(20) NOT NULL CHECK (change_type IN ('create', 'update', 'delete', 'activate', 'deactivate', 'manual_cost_update')),
    field_name VARCHAR(100),
    old_value TEXT,
    new_value TEXT,
    reason TEXT,
    metadata JSONB, -- For storing additional context like transaction amounts, bulk operation IDs, etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for optimal query performance
CREATE INDEX idx_change_logs_org_created ON change_logs(organization_id, created_at DESC);
CREATE INDEX idx_change_logs_sku ON change_logs(sku_id, created_at DESC);
CREATE INDEX idx_change_logs_user ON change_logs(user_id, created_at DESC);
CREATE INDEX idx_change_logs_entity ON change_logs(entity_type, entity_id, created_at DESC);
CREATE INDEX idx_change_logs_change_type ON change_logs(change_type, created_at DESC);

-- Create a composite index for common queries (org + date range)
CREATE INDEX idx_change_logs_org_date_type ON change_logs(organization_id, created_at DESC, change_type);

-- Insert some sample change log data for demonstration
INSERT INTO change_logs (organization_id, user_id, entity_type, entity_id, change_type, field_name, old_value, new_value, reason) VALUES
(1, 1, 'sku', 1, 'create', NULL, NULL, NULL, 'Initial SKU creation'),
(1, 1, 'inventory', 1, 'manual_cost_update', 'weighted_cost', '0.00', '15.50', 'Manual cost adjustment for better accuracy'),
(1, 1, 'transaction', 1, 'create', NULL, NULL, NULL, 'Stock intake - 100 units'),
(1, 1, 'user', 2, 'create', NULL, NULL, NULL, 'New user account created'),
(1, 1, 'sku', 1, 'update', 'description', 'Old description', 'Updated product description', 'Product information update');