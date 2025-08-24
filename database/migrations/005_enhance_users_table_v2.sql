-- Enhance users table for Phase 5: User Management & Permissions
-- Simplified version that avoids constraint conflicts

-- Add new columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

-- Create a new users table with the correct constraints
CREATE TABLE IF NOT EXISTS users_temp (
  id SERIAL PRIMARY KEY,
  organization_id INT NOT NULL REFERENCES organizations(id),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'manager', 'user', 'viewer')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Copy existing data to temp table, converting any incompatible roles
INSERT INTO users_temp (id, organization_id, email, name, role, is_active, created_at, updated_at)
SELECT 
  id, 
  organization_id, 
  email, 
  name, 
  CASE 
    WHEN role NOT IN ('super_admin', 'admin', 'manager', 'user', 'viewer') 
    THEN 'user' 
    ELSE role 
  END as role,
  COALESCE(is_active, TRUE) as is_active,
  created_at, 
  updated_at
FROM users
ON CONFLICT (email) DO NOTHING;

-- Drop the old table and rename temp table
DROP TABLE users CASCADE;
ALTER TABLE users_temp RENAME TO users;

-- Recreate any foreign key constraints that were dropped
-- (Add any foreign key constraints that reference users table here if needed)

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_organization ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);

-- Insert additional test users with different roles for testing
INSERT INTO users (organization_id, email, name, role, is_active) 
VALUES 
  (
    (SELECT id FROM organizations WHERE name = 'Test Organization' LIMIT 1),
    'manager@test.com', 
    'Test Manager', 
    'manager',
    TRUE
  ),
  (
    (SELECT id FROM organizations WHERE name = 'Test Organization' LIMIT 1),
    'user@test.com', 
    'Test User', 
    'user',
    TRUE
  ),
  (
    (SELECT id FROM organizations WHERE name = 'Test Organization' LIMIT 1),
    'viewer@test.com', 
    'Test Viewer', 
    'viewer',
    TRUE
  ),
  (
    (SELECT id FROM organizations WHERE name = 'Test Organization' LIMIT 1),
    'inactive@test.com', 
    'Inactive User', 
    'user',
    FALSE
  )
ON CONFLICT (email) DO NOTHING;

-- Create a table for storing custom field permissions (optional, for future extensibility)
CREATE TABLE IF NOT EXISTS user_field_permissions (
  id SERIAL PRIMARY KEY,
  organization_id INT NOT NULL REFERENCES organizations(id),
  role TEXT NOT NULL,
  resource TEXT NOT NULL, -- 'skus', 'inventory', 'transactions', 'users'
  field_name TEXT NOT NULL,
  permission_level TEXT NOT NULL CHECK (permission_level IN ('read', 'write', 'hidden')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, role, resource, field_name)
);

-- Create indexes for the field permissions table
CREATE INDEX IF NOT EXISTS idx_user_field_permissions_org_role ON user_field_permissions(organization_id, role);
CREATE INDEX IF NOT EXISTS idx_user_field_permissions_resource ON user_field_permissions(resource);