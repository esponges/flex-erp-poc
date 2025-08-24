-- Simple fix for role constraint issue
-- This migration safely updates the role constraint

-- Add new columns first (these should work fine)
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

-- Find the current constraint name and drop it
DO $$
DECLARE
    rec RECORD;
BEGIN
    -- Find all check constraints on the users table that mention 'role'
    FOR rec IN 
        SELECT constraint_name 
        FROM information_schema.check_constraints 
        WHERE constraint_name LIKE '%users%' 
        AND check_clause LIKE '%role%'
    LOOP
        EXECUTE format('ALTER TABLE users DROP CONSTRAINT %I', rec.constraint_name);
    END LOOP;
END $$;

-- Add the new constraint
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('super_admin', 'admin', 'manager', 'user', 'viewer'));

-- Create basic indexes
CREATE INDEX IF NOT EXISTS idx_users_organization ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);