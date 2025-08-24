-- Enhance users table for Phase 5: User Management & Permissions
-- Add missing columns and update role constraints

-- Add new columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

-- Drop the existing role constraint and add new one with additional roles
-- First find and drop any existing role constraint
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    -- Find any existing role constraint
    SELECT conname INTO constraint_name 
    FROM pg_constraint 
    WHERE conrelid = 'users'::regclass 
    AND pg_get_constraintdef(oid) LIKE '%role%IN%';
    
    -- Drop it if it exists
    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE users DROP CONSTRAINT ' || constraint_name;
    END IF;
END $$;

-- Add new constraint with all required roles
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('super_admin', 'admin', 'manager', 'user', 'viewer'));

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

-- Update the existing admin user record to ensure it has the new fields set
UPDATE users 
SET is_active = TRUE 
WHERE email = 'admin@test.com' OR email = 'test@example.com';

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