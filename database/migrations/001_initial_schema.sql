-- Initial schema for flex-erp-poc
-- Phase 1: Foundation tables

CREATE TABLE organizations (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  organization_id INT NOT NULL REFERENCES organizations(id),
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('super_admin','admin','user')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert seed data for testing
INSERT INTO organizations (name) VALUES ('Test Organization');
INSERT INTO users (organization_id, email, name, role) 
VALUES (1, 'admin@test.com', 'Test Admin', 'admin');