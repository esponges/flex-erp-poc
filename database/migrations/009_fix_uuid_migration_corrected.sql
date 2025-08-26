-- Corrected migration to properly replace bigint IDs with UUIDs
-- This approach drops and recreates tables with proper UUID structure

-- Step 1: Create temporary tables with correct UUID structure

-- Organizations table
CREATE TABLE organizations_new (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Copy data from old table using uuid_id values
INSERT INTO organizations_new (id, name, created_at, updated_at)
SELECT uuid_id, name, created_at, updated_at FROM organizations;

-- Users table
CREATE TABLE users_new (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member',
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    FOREIGN KEY (organization_id) REFERENCES organizations_new(id)
);

-- Copy data from old table using uuid_id values
INSERT INTO users_new (id, organization_id, email, name, role, is_active, last_login_at, created_at, updated_at)
SELECT uuid_id, organization_id, email, name, role, is_active, last_login_at, created_at, updated_at FROM users;

-- SKUs table
CREATE TABLE skus_new (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    sku_code VARCHAR(100) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    supplier VARCHAR(255),
    barcode VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (organization_id, sku_code),
    FOREIGN KEY (organization_id) REFERENCES organizations_new(id)
);

-- Copy data from old table using uuid_id values
INSERT INTO skus_new (id, organization_id, sku_code, product_name, description, category, supplier, barcode, is_active, created_at, updated_at)
SELECT uuid_id, organization_id, sku_code, product_name, description, category, supplier, barcode, is_active, created_at, updated_at FROM skus;

-- Inventory table
CREATE TABLE inventory_new (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    sku_id UUID NOT NULL,
    quantity INT NOT NULL DEFAULT 0,
    weighted_cost NUMERIC(12,4) NOT NULL DEFAULT 0.0,
    total_value NUMERIC(14,4) NOT NULL DEFAULT 0.0,
    is_manual_cost BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_cost_nonneg CHECK (weighted_cost >= 0),
    CONSTRAINT chk_quantity_nonneg CHECK (quantity >= 0),
    UNIQUE (organization_id, sku_id),
    FOREIGN KEY (organization_id) REFERENCES organizations_new(id),
    FOREIGN KEY (sku_id) REFERENCES skus_new(id)
);

-- Copy data from old table using uuid_id values
INSERT INTO inventory_new (id, organization_id, sku_id, quantity, weighted_cost, total_value, is_manual_cost, created_at, updated_at)
SELECT uuid_id, organization_id, sku_id, quantity, weighted_cost, total_value, is_manual_cost, created_at, updated_at FROM inventory;

-- Transactions table
CREATE TABLE transactions_new (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    sku_id UUID NOT NULL,
    transaction_type VARCHAR(10) NOT NULL CHECK (transaction_type IN ('in', 'out')),
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_cost NUMERIC(12,4) NOT NULL DEFAULT 0.0,
    total_cost NUMERIC(14,4) NOT NULL DEFAULT 0.0,
    reference_number VARCHAR(255),
    notes TEXT,
    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    FOREIGN KEY (organization_id) REFERENCES organizations_new(id),
    FOREIGN KEY (sku_id) REFERENCES skus_new(id),
    FOREIGN KEY (created_by) REFERENCES users_new(id)
);

-- Copy data from old table using uuid_id values
INSERT INTO transactions_new (id, organization_id, sku_id, transaction_type, quantity, unit_cost, total_cost, reference_number, notes, created_by, created_at, updated_at)
SELECT uuid_id, organization_id, sku_id, transaction_type, quantity, unit_cost, total_cost, reference_number, notes, created_by, created_at, updated_at FROM transactions;

-- Field aliases table
CREATE TABLE field_aliases_new (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    field_name VARCHAR(100) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    is_hidden BOOLEAN NOT NULL DEFAULT false,
    sort_order BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now(),
    FOREIGN KEY (organization_id) REFERENCES organizations_new(id)
);

-- Copy data from old table using uuid_id values
INSERT INTO field_aliases_new (id, organization_id, table_name, field_name, display_name, description, is_hidden, sort_order, created_at, updated_at)
SELECT uuid_id, organization_id, table_name, field_name, display_name, description, is_hidden, sort_order, created_at, updated_at FROM field_aliases;

-- Step 2: Drop old tables and rename new ones
DROP TABLE field_aliases;
ALTER TABLE field_aliases_new RENAME TO field_aliases;

DROP TABLE transactions;
ALTER TABLE transactions_new RENAME TO transactions;

DROP TABLE inventory;
ALTER TABLE inventory_new RENAME TO inventory;

DROP TABLE skus;
ALTER TABLE skus_new RENAME TO skus;

DROP TABLE users;
ALTER TABLE users_new RENAME TO users;

DROP TABLE organizations;
ALTER TABLE organizations_new RENAME TO organizations;

-- Step 3: Create indexes for better performance
CREATE INDEX idx_inventory_organization ON inventory(organization_id);
CREATE INDEX idx_inventory_sku ON inventory(sku_id);
CREATE INDEX idx_inventory_org_sku ON inventory(organization_id, sku_id);
CREATE INDEX idx_transactions_organization ON transactions(organization_id);
CREATE INDEX idx_transactions_sku ON transactions(sku_id);
CREATE INDEX idx_transactions_created_by ON transactions(created_by);
CREATE INDEX idx_users_organization ON users(organization_id);
CREATE INDEX idx_skus_organization ON skus(organization_id);
CREATE INDEX idx_field_aliases_organization ON field_aliases(organization_id);