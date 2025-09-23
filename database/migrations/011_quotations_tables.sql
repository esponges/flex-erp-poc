-- Phase 11: Quotations and Quotation Line Items tables
-- Creates tables for managing sales quotations

-- Main quotations table
CREATE TABLE quotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  quotation_number VARCHAR(50) NOT NULL,

  -- Customer information (placeholder structure as per spec)
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255),
  customer_phone VARCHAR(50),
  customer_address TEXT,

  -- Sales person and dates
  sales_person_id UUID REFERENCES users(id),
  creation_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  validity_period_days INT NOT NULL DEFAULT 30,
  valid_until TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '30 days'),

  -- Terms (placeholders as per spec)
  delivery_terms TEXT,
  payment_terms TEXT,

  -- Pricing and status
  default_margin_percentage NUMERIC(5,2) NOT NULL DEFAULT 0.0,
  subtotal NUMERIC(14,4) NOT NULL DEFAULT 0.0,
  total_amount NUMERIC(14,4) NOT NULL DEFAULT 0.0,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),

  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Ensure unique quotation numbers per organization
  CONSTRAINT quotations_org_number_unique UNIQUE (organization_id, quotation_number)
);

-- Quotation line items table
CREATE TABLE quotation_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
  sku_id UUID NOT NULL REFERENCES skus(id),

  -- Quantity and pricing
  quantity NUMERIC(12,4) NOT NULL,
  base_price NUMERIC(12,4) NOT NULL, -- Cost price from inventory

  -- Margin calculations
  item_margin_percentage NUMERIC(5,2), -- Overrides default if set
  effective_margin_percentage NUMERIC(5,2) NOT NULL, -- Calculated field: item_margin OR default_margin

  -- Additional discounts/markups
  additional_discount_amount NUMERIC(12,4) NOT NULL DEFAULT 0.0,
  additional_markup_amount NUMERIC(12,4) NOT NULL DEFAULT 0.0,

  -- Final pricing (calculated)
  unit_price_after_margin NUMERIC(12,4) NOT NULL, -- base_price + (base_price * margin%)
  final_unit_price NUMERIC(12,4) NOT NULL, -- unit_price_after_margin + markup - discount
  line_total NUMERIC(14,4) NOT NULL, -- final_unit_price * quantity

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Constraints
  CONSTRAINT chk_quantity_positive CHECK (quantity > 0),
  CONSTRAINT chk_base_price_nonneg CHECK (base_price >= 0),
  CONSTRAINT chk_margin_range CHECK (effective_margin_percentage >= -100 AND effective_margin_percentage <= 1000),
  CONSTRAINT chk_line_total_nonneg CHECK (line_total >= 0)
);

-- Create indexes for better performance
CREATE INDEX idx_quotations_organization ON quotations(organization_id);
CREATE INDEX idx_quotations_status ON quotations(organization_id, status);
CREATE INDEX idx_quotations_sales_person ON quotations(sales_person_id);
CREATE INDEX idx_quotations_creation_date ON quotations(organization_id, creation_date);
CREATE INDEX idx_quotations_valid_until ON quotations(organization_id, valid_until);

CREATE INDEX idx_quotation_line_items_quotation ON quotation_line_items(quotation_id);
CREATE INDEX idx_quotation_line_items_sku ON quotation_line_items(sku_id);

-- Function to auto-generate quotation numbers
CREATE OR REPLACE FUNCTION generate_quotation_number(org_id UUID)
RETURNS VARCHAR(50) AS $$
DECLARE
  next_number INT;
  year_str VARCHAR(4);
BEGIN
  year_str := EXTRACT(YEAR FROM now())::VARCHAR;

  SELECT COALESCE(MAX(
    CAST(SUBSTRING(quotation_number FROM '[0-9]+$') AS INT)
  ), 0) + 1
  INTO next_number
  FROM quotations
  WHERE organization_id = org_id
    AND quotation_number LIKE 'Q' || year_str || '-%';

  RETURN 'Q' || year_str || '-' || LPAD(next_number::VARCHAR, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-populate quotation numbers
CREATE OR REPLACE FUNCTION set_quotation_number()
RETURNS TRIGGER AS $$
BEGIN
  IF (NEW).quotation_number IS NULL OR (NEW).quotation_number = '' THEN
    (NEW).quotation_number := generate_quotation_number((NEW).organization_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_quotation_number
  BEFORE INSERT ON quotations
  FOR EACH ROW EXECUTE FUNCTION set_quotation_number();

-- Trigger to update quotation totals when line items change
CREATE OR REPLACE FUNCTION update_quotation_totals()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE quotations
  SET
    subtotal = (
      SELECT COALESCE(SUM(line_total), 0)
      FROM quotation_line_items
      WHERE quotation_id = COALESCE((NEW).quotation_id, (OLD).quotation_id)
    ),
    total_amount = (
      SELECT COALESCE(SUM(line_total), 0)
      FROM quotation_line_items
      WHERE quotation_id = COALESCE((NEW).quotation_id, (OLD).quotation_id)
    ),
    updated_at = now()
  WHERE id = COALESCE((NEW).quotation_id, (OLD).quotation_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_quotation_totals_insert
  AFTER INSERT ON quotation_line_items
  FOR EACH ROW EXECUTE FUNCTION update_quotation_totals();

CREATE TRIGGER trigger_update_quotation_totals_update
  AFTER UPDATE ON quotation_line_items
  FOR EACH ROW EXECUTE FUNCTION update_quotation_totals();

CREATE TRIGGER trigger_update_quotation_totals_delete
  AFTER DELETE ON quotation_line_items
  FOR EACH ROW EXECUTE FUNCTION update_quotation_totals();