-- Phase 7: Migrate from BigInt IDs to UUIDs
-- This migration converts all entity IDs from SERIAL/BIGINT to UUID for better JavaScript compatibility

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Step 1: Add UUID columns to all tables
ALTER TABLE organizations ADD COLUMN uuid_id UUID DEFAULT uuid_generate_v4();
ALTER TABLE users ADD COLUMN uuid_id UUID DEFAULT uuid_generate_v4();
ALTER TABLE skus ADD COLUMN uuid_id UUID DEFAULT uuid_generate_v4();
ALTER TABLE inventory ADD COLUMN uuid_id UUID DEFAULT uuid_generate_v4();
ALTER TABLE transactions ADD COLUMN uuid_id UUID DEFAULT uuid_generate_v4();
ALTER TABLE field_aliases ADD COLUMN uuid_id UUID DEFAULT uuid_generate_v4();

-- Add UUID foreign key columns
ALTER TABLE users ADD COLUMN uuid_organization_id UUID;
ALTER TABLE skus ADD COLUMN uuid_organization_id UUID;
ALTER TABLE inventory ADD COLUMN uuid_organization_id UUID;
ALTER TABLE inventory ADD COLUMN uuid_sku_id UUID;
ALTER TABLE transactions ADD COLUMN uuid_organization_id UUID;
ALTER TABLE transactions ADD COLUMN uuid_sku_id UUID;
ALTER TABLE transactions ADD COLUMN uuid_created_by UUID;
ALTER TABLE field_aliases ADD COLUMN uuid_organization_id UUID;

-- Step 2: Generate UUIDs for existing records and populate foreign keys
UPDATE organizations SET uuid_id = uuid_generate_v4() WHERE uuid_id IS NULL;
UPDATE users SET uuid_id = uuid_generate_v4() WHERE uuid_id IS NULL;
UPDATE skus SET uuid_id = uuid_generate_v4() WHERE uuid_id IS NULL;
UPDATE inventory SET uuid_id = uuid_generate_v4() WHERE uuid_id IS NULL;
UPDATE transactions SET uuid_id = uuid_generate_v4() WHERE uuid_id IS NULL;
UPDATE field_aliases SET uuid_id = uuid_generate_v4() WHERE uuid_id IS NULL;

-- Step 3: Populate UUID foreign keys using joins
UPDATE users SET uuid_organization_id = o.uuid_id 
FROM organizations o WHERE users.organization_id = o.id;

UPDATE skus SET uuid_organization_id = o.uuid_id 
FROM organizations o WHERE skus.organization_id = o.id;

UPDATE inventory SET uuid_organization_id = o.uuid_id 
FROM organizations o WHERE inventory.organization_id = o.id;

UPDATE inventory SET uuid_sku_id = s.uuid_id 
FROM skus s WHERE inventory.sku_id = s.id;

UPDATE transactions SET uuid_organization_id = o.uuid_id 
FROM organizations o WHERE transactions.organization_id = o.id;

UPDATE transactions SET uuid_sku_id = s.uuid_id 
FROM skus s WHERE transactions.sku_id = s.id;

UPDATE transactions SET uuid_created_by = u.uuid_id 
FROM users u WHERE transactions.created_by = u.id;

UPDATE field_aliases SET uuid_organization_id = o.uuid_id 
FROM organizations o WHERE field_aliases.organization_id = o.id;

-- Step 4: Drop old foreign key constraints
ALTER TABLE users DROP CONSTRAINT users_organization_id_fkey;
ALTER TABLE skus DROP CONSTRAINT skus_organization_id_fkey;
ALTER TABLE inventory DROP CONSTRAINT inventory_organization_id_fkey;
ALTER TABLE inventory DROP CONSTRAINT inventory_sku_id_fkey;
ALTER TABLE transactions DROP CONSTRAINT transactions_organization_id_fkey;
ALTER TABLE transactions DROP CONSTRAINT transactions_sku_id_fkey;
ALTER TABLE transactions DROP CONSTRAINT transactions_created_by_fkey;
ALTER TABLE field_aliases DROP CONSTRAINT field_aliases_organization_id_fkey;

-- Step 5: Drop old integer columns
ALTER TABLE users DROP COLUMN organization_id;
ALTER TABLE skus DROP COLUMN organization_id;
ALTER TABLE inventory DROP COLUMN organization_id;
ALTER TABLE inventory DROP COLUMN sku_id;
ALTER TABLE transactions DROP COLUMN organization_id;
ALTER TABLE transactions DROP COLUMN sku_id;
ALTER TABLE transactions DROP COLUMN created_by;
ALTER TABLE field_aliases DROP COLUMN organization_id;

-- Step 6: Rename UUID columns to replace old ones
ALTER TABLE organizations DROP COLUMN id;
ALTER TABLE organizations RENAME COLUMN uuid_id TO id;

ALTER TABLE users DROP COLUMN id;
ALTER TABLE users RENAME COLUMN uuid_id TO id;
ALTER TABLE users RENAME COLUMN uuid_organization_id TO organization_id;

ALTER TABLE skus DROP COLUMN id;
ALTER TABLE skus RENAME COLUMN uuid_id TO id;
ALTER TABLE skus RENAME COLUMN uuid_organization_id TO organization_id;

ALTER TABLE inventory DROP COLUMN id;
ALTER TABLE inventory RENAME COLUMN uuid_id TO id;
ALTER TABLE inventory RENAME COLUMN uuid_organization_id TO organization_id;
ALTER TABLE inventory RENAME COLUMN uuid_sku_id TO sku_id;

ALTER TABLE transactions DROP COLUMN id;
ALTER TABLE transactions RENAME COLUMN uuid_id TO id;
ALTER TABLE transactions RENAME COLUMN uuid_organization_id TO organization_id;
ALTER TABLE transactions RENAME COLUMN uuid_sku_id TO sku_id;
ALTER TABLE transactions RENAME COLUMN uuid_created_by TO created_by;

ALTER TABLE field_aliases DROP COLUMN id;
ALTER TABLE field_aliases RENAME COLUMN uuid_id TO id;
ALTER TABLE field_aliases RENAME COLUMN uuid_organization_id TO organization_id;

-- Step 7: Add primary key constraints
ALTER TABLE organizations ADD PRIMARY KEY (id);
ALTER TABLE users ADD PRIMARY KEY (id);
ALTER TABLE skus ADD PRIMARY KEY (id);
ALTER TABLE inventory ADD PRIMARY KEY (id);
ALTER TABLE transactions ADD PRIMARY KEY (id);
ALTER TABLE field_aliases ADD PRIMARY KEY (id);

-- Step 8: Add foreign key constraints
ALTER TABLE users ADD CONSTRAINT users_organization_id_fkey 
    FOREIGN KEY (organization_id) REFERENCES organizations(id);

ALTER TABLE skus ADD CONSTRAINT skus_organization_id_fkey 
    FOREIGN KEY (organization_id) REFERENCES organizations(id);

ALTER TABLE inventory ADD CONSTRAINT inventory_organization_id_fkey 
    FOREIGN KEY (organization_id) REFERENCES organizations(id);

ALTER TABLE inventory ADD CONSTRAINT inventory_sku_id_fkey 
    FOREIGN KEY (sku_id) REFERENCES skus(id);

ALTER TABLE transactions ADD CONSTRAINT transactions_organization_id_fkey 
    FOREIGN KEY (organization_id) REFERENCES organizations(id);

ALTER TABLE transactions ADD CONSTRAINT transactions_sku_id_fkey 
    FOREIGN KEY (sku_id) REFERENCES skus(id);

ALTER TABLE transactions ADD CONSTRAINT transactions_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES users(id);

ALTER TABLE field_aliases ADD CONSTRAINT field_aliases_organization_id_fkey 
    FOREIGN KEY (organization_id) REFERENCES organizations(id);

-- Step 9: Add unique constraints
ALTER TABLE inventory ADD CONSTRAINT inventory_organization_id_sku_id_unique 
    UNIQUE (organization_id, sku_id);

-- Step 10: Recreate indexes
CREATE INDEX idx_users_organization ON users(organization_id);
CREATE INDEX idx_skus_organization ON skus(organization_id);
CREATE INDEX idx_inventory_organization ON inventory(organization_id);
CREATE INDEX idx_inventory_sku ON inventory(sku_id);
CREATE INDEX idx_inventory_org_sku ON inventory(organization_id, sku_id);
CREATE INDEX idx_transactions_organization ON transactions(organization_id);
CREATE INDEX idx_transactions_sku ON transactions(sku_id);
CREATE INDEX idx_transactions_created_by ON transactions(created_by);
CREATE INDEX idx_field_aliases_organization ON field_aliases(organization_id);

-- Step 11: Update any check constraints
ALTER TABLE inventory DROP CONSTRAINT chk_cost_nonneg;
ALTER TABLE inventory DROP CONSTRAINT chk_quantity_nonneg;
ALTER TABLE inventory ADD CONSTRAINT chk_cost_nonneg CHECK (weighted_cost >= 0);
ALTER TABLE inventory ADD CONSTRAINT chk_quantity_nonneg CHECK (quantity >= 0);