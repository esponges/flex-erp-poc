-- Migration: Create field_aliases table for custom field names
-- This allows organizations to customize field labels/names across the application

CREATE TABLE field_aliases (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    table_name VARCHAR(100) NOT NULL,
    field_name VARCHAR(100) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    is_hidden BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure unique aliases per org/table/field combination
    UNIQUE(organization_id, table_name, field_name)
);

-- Create indexes for better performance
CREATE INDEX idx_field_aliases_org_table ON field_aliases(organization_id, table_name);
CREATE INDEX idx_field_aliases_sort ON field_aliases(organization_id, table_name, sort_order);

-- Insert some default aliases for demonstration
-- These represent common field customizations organizations might want

-- SKU table aliases
INSERT INTO field_aliases (organization_id, table_name, field_name, display_name, description, sort_order) VALUES 
(1, 'skus', 'name', 'Product Name', 'The name of the product or SKU', 1),
(1, 'skus', 'sku', 'SKU Code', 'Unique product identifier', 2),
(1, 'skus', 'description', 'Description', 'Product description and details', 3),
(1, 'skus', 'category', 'Category', 'Product category classification', 4),
(1, 'skus', 'brand', 'Brand', 'Product brand or manufacturer', 5),
(1, 'skus', 'unit_of_measure', 'Unit', 'Unit of measurement (e.g., each, kg, lbs)', 6);

-- Inventory table aliases
INSERT INTO field_aliases (organization_id, table_name, field_name, display_name, description, sort_order) VALUES
(1, 'inventory', 'quantity', 'Stock Level', 'Current quantity in stock', 1),
(1, 'inventory', 'weighted_cost', 'Avg Cost', 'Weighted average cost per unit', 2),
(1, 'inventory', 'manual_cost', 'Manual Cost', 'Manually set cost override', 3);

-- Transaction table aliases  
INSERT INTO field_aliases (organization_id, table_name, field_name, display_name, description, sort_order) VALUES
(1, 'inventory_transactions', 'type', 'Transaction Type', 'IN or OUT transaction', 1),
(1, 'inventory_transactions', 'quantity', 'Quantity', 'Number of units moved', 2),
(1, 'inventory_transactions', 'unit_cost', 'Unit Cost', 'Cost per unit for this transaction', 3),
(1, 'inventory_transactions', 'notes', 'Notes', 'Additional transaction details', 4);

-- User table aliases
INSERT INTO field_aliases (organization_id, table_name, field_name, display_name, description, sort_order) VALUES
(1, 'users', 'name', 'Full Name', 'User full name', 1),
(1, 'users', 'email', 'Email Address', 'User login email', 2),
(1, 'users', 'role', 'Role', 'User access level and permissions', 3),
(1, 'users', 'is_active', 'Status', 'Whether user account is active', 4);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_field_aliases_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_field_aliases_updated_at
    BEFORE UPDATE ON field_aliases
    FOR EACH ROW
    EXECUTE PROCEDURE update_field_aliases_updated_at();