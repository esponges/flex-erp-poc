-- Migration to properly replace bigint IDs with UUIDs and remove unnecessary uuid_id columns
-- This script will:
-- 1. Replace the old bigint id columns with UUIDs from uuid_id columns
-- 2. Remove the unnecessary uuid_id columns
-- 3. Ensure all foreign key relationships are properly updated

-- Step 1: Drop foreign key constraints that will be recreated
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_organization_id_fkey;
ALTER TABLE skus DROP CONSTRAINT IF EXISTS skus_organization_id_fkey;
ALTER TABLE inventory DROP CONSTRAINT IF EXISTS inventory_organization_id_fkey;
ALTER TABLE inventory DROP CONSTRAINT IF EXISTS inventory_sku_id_fkey;
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_organization_id_fkey;
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_sku_id_fkey;
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_created_by_fkey;
ALTER TABLE field_aliases DROP CONSTRAINT IF EXISTS field_aliases_organization_id_fkey;

-- Step 2: Drop indexes that reference old ID columns
DROP INDEX IF EXISTS idx_inventory_organization;
DROP INDEX IF EXISTS idx_inventory_sku;
DROP INDEX IF EXISTS idx_inventory_org_sku;
DROP INDEX IF EXISTS idx_transactions_organization;
DROP INDEX IF EXISTS idx_transactions_sku;
DROP INDEX IF EXISTS idx_transactions_created_by;

-- Step 3: Update organizations table
-- Replace id with uuid_id and drop uuid_id column
ALTER TABLE organizations DROP COLUMN id;
ALTER TABLE organizations RENAME COLUMN uuid_id TO id;
ALTER TABLE organizations ADD PRIMARY KEY (id);

-- Step 4: Update users table
-- Replace id with uuid_id and drop uuid_id column
ALTER TABLE users DROP COLUMN id;
ALTER TABLE users RENAME COLUMN uuid_id TO id;
ALTER TABLE users ADD PRIMARY KEY (id);

-- Step 5: Update skus table
-- Replace id with uuid_id and drop uuid_id column
ALTER TABLE skus DROP COLUMN id;
ALTER TABLE skus RENAME COLUMN uuid_id TO id;
ALTER TABLE skus ADD PRIMARY KEY (id);

-- Step 6: Update inventory table
-- Replace id with uuid_id and drop uuid_id column
ALTER TABLE inventory DROP COLUMN id;
ALTER TABLE inventory RENAME COLUMN uuid_id TO id;
ALTER TABLE inventory ADD PRIMARY KEY (id);

-- Step 7: Update transactions table
-- Replace id with uuid_id and drop uuid_id column
ALTER TABLE transactions DROP COLUMN id;
ALTER TABLE transactions RENAME COLUMN uuid_id TO id;
ALTER TABLE transactions ADD PRIMARY KEY (id);

-- Step 8: Update field_aliases table
-- Replace id with uuid_id and drop uuid_id column
ALTER TABLE field_aliases DROP COLUMN id;
ALTER TABLE field_aliases RENAME COLUMN uuid_id TO id;
ALTER TABLE field_aliases ADD PRIMARY KEY (id);

-- Step 9: Recreate foreign key constraints
ALTER TABLE users 
    ADD CONSTRAINT users_organization_id_fkey 
    FOREIGN KEY (organization_id) REFERENCES organizations(id);

ALTER TABLE skus 
    ADD CONSTRAINT skus_organization_id_fkey 
    FOREIGN KEY (organization_id) REFERENCES organizations(id);

ALTER TABLE inventory 
    ADD CONSTRAINT inventory_organization_id_fkey 
    FOREIGN KEY (organization_id) REFERENCES organizations(id);

ALTER TABLE inventory 
    ADD CONSTRAINT inventory_sku_id_fkey 
    FOREIGN KEY (sku_id) REFERENCES skus(id);

ALTER TABLE transactions 
    ADD CONSTRAINT transactions_organization_id_fkey 
    FOREIGN KEY (organization_id) REFERENCES organizations(id);

ALTER TABLE transactions 
    ADD CONSTRAINT transactions_sku_id_fkey 
    FOREIGN KEY (sku_id) REFERENCES skus(id);

ALTER TABLE transactions 
    ADD CONSTRAINT transactions_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES users(id);

ALTER TABLE field_aliases 
    ADD CONSTRAINT field_aliases_organization_id_fkey 
    FOREIGN KEY (organization_id) REFERENCES organizations(id);

-- Step 10: Recreate indexes with new UUID columns
CREATE INDEX idx_inventory_organization ON inventory(organization_id);
CREATE INDEX idx_inventory_sku ON inventory(sku_id);
CREATE INDEX idx_inventory_org_sku ON inventory(organization_id, sku_id);
CREATE INDEX idx_transactions_organization ON transactions(organization_id);
CREATE INDEX idx_transactions_sku ON transactions(sku_id);
CREATE INDEX idx_transactions_created_by ON transactions(created_by);

-- Step 11: Update unique constraints
ALTER TABLE inventory DROP CONSTRAINT IF EXISTS inventory_organization_id_sku_id_key;
ALTER TABLE inventory ADD CONSTRAINT inventory_organization_id_sku_id_key UNIQUE (organization_id, sku_id);

ALTER TABLE skus DROP CONSTRAINT IF EXISTS skus_organization_id_sku_code_key;
ALTER TABLE skus ADD CONSTRAINT skus_organization_id_sku_code_key UNIQUE (organization_id, sku_code);

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key;
ALTER TABLE users ADD CONSTRAINT users_email_key UNIQUE (email);