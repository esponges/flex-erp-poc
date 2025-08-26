-- Migration: Create change_logs table for audit trail (UUID version)
-- This tracks all changes made to entities across the system

CREATE TABLE change_logs (
    id SERIAL PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('sku', 'inventory', 'transaction', 'user', 'field_alias')),
    entity_id UUID,
    sku_id UUID REFERENCES skus(id) ON DELETE SET NULL,
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
('4e3b885f-46b4-4ccd-af45-a3291d46b9ec', '9785a882-fd9a-4698-bf6d-91b050abdcac', 'sku', '550e8400-e29b-41d4-a716-446655440000', 'create', NULL, NULL, NULL, 'Initial SKU creation'),
('4e3b885f-46b4-4ccd-af45-a3291d46b9ec', '9785a882-fd9a-4698-bf6d-91b050abdcac', 'inventory', '550e8400-e29b-41d4-a716-446655440000', 'manual_cost_update', 'weighted_cost', '0.00', '15.50', 'Manual cost adjustment for better accuracy'),
('4e3b885f-46b4-4ccd-af45-a3291d46b9ec', '9785a882-fd9a-4698-bf6d-91b050abdcac', 'transaction', '550e8400-e29b-41d4-a716-446655440001', 'create', NULL, NULL, NULL, 'Stock intake - 100 units'),
('4e3b885f-46b4-4ccd-af45-a3291d46b9ec', '9785a882-fd9a-4698-bf6d-91b050abdcac', 'user', '9785a882-fd9a-4698-bf6d-91b050abdcac', 'create', NULL, NULL, NULL, 'New user account created'),
('4e3b885f-46b4-4ccd-af45-a3291d46b9ec', '9785a882-fd9a-4698-bf6d-91b050abdcac', 'sku', '550e8400-e29b-41d4-a716-446655440000', 'update', 'description', 'Old description', 'Updated product description', 'Product information update');