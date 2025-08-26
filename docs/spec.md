# Flex ERP PoC - Technical Specification

## Overview
This is a Proof of Concept for an ERP inventory management system built with:
- **Frontend**: React + TypeScript + Vite + TailwindCSS
- **Backend**: Go + PostgreSQL
- **Architecture**: Monorepo structure

## Features (Implementation Phases)

### Phase 1: Foundation ✅
- [x] Database setup with PostgreSQL
- [x] Basic Go backend with HTTP server
- [x] Mock JWT authentication
- [x] React frontend with routing
- [x] Development environment setup

### Phase 2: Core Entities (SKUs) ✅
- [x] SKU CRUD operations
- [x] SKU management interface  
- [x] Organization scoping
- [x] Search and filtering functionality
- [x] Add/Edit modal forms
- [x] Activate/deactivate SKUs

### Phase 3: Inventory & Calculated Fields
- [x] Inventory tracking
- [x] Weighted cost calculations
- [x] Manual cost adjustments

### Phase 4: Transactions System
- [x] In/Out transactions
- [x] Automatic inventory updates
- [x] Business rule enforcement

### Phase 5: User Management & Permissions ✅
- [x] User CRUD operations
- [x] Role-based access control
- [x] Field-level permissions

### Phase 6: Field Aliases & Customization ✅
- [x] Custom field names
- [x] Organization-specific aliases
- [x] Settings interface

### Phase 7: Change Logging System
- [ ] Audit trail
- [ ] Change history
- [ ] Activity logs

### Phase 8: File Import System
- [ ] CSV/Excel imports
- [ ] Mock AI schema detection
- [ ] Bulk operations

## API Endpoints


### Current Endpoints

#### Authentication
- `POST /auth/login` - Mock login

#### Health
- `GET /health` - Health check

#### SKU Management
- `GET /api/v1/orgs/{orgId}/skus` - List SKUs (with filtering, search, pagination)
- `POST /api/v1/orgs/{orgId}/skus` - Create new SKU
- `GET /api/v1/orgs/{orgId}/skus/{skuId}` - Get SKU by ID
- `PATCH /api/v1/orgs/{orgId}/skus/{skuId}` - Update SKU details
- `PATCH /api/v1/orgs/{orgId}/skus/{skuId}/status` - Activate/deactivate SKU

### Future Endpoints
- Organization-scoped CRUD for inventory, transactions
- User management
- Import/export functionality

## Database Schema

### Core Tables
- `organizations` - Multi-tenant organization data
- `users` - User accounts with roles
- `skus` - Product definitions
- `inventory` - Current stock levels
- `inventory_transactions` - Stock movements
- `change_logs` - Audit trail

## Development

See `setup.md` for development environment setup.

# Detailed Implementation Notes

Poc erp


# AI Team Introduction - Inventory Management PoC
## Step-by-Step Implementation Plan

### Overview
This document provides an incremental implementation plan for the Inventory Management PoC, organized by backend/database and frontend work streams that can progress in parallel.

---

## Phase 1: Foundation & Core Setup

### Database (Phase 1)
**Priority: HIGH | Estimated Time: 1-2 days**

#### Step 1.1: Initial Schema Setup
```sql
-- Create core tables without complex constraints
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
```

**Deliverables:**
- [ ] Database created and connected
- [ ] Basic tables with seed data
- [ ] Connection tested

### Backend (Phase 1)
**Priority: HIGH | Estimated Time: 2-3 days**

#### Step 1.2: Project Setup & Basic API Structure
```go
// Project structure
├── cmd/
│   └── server/
│       └── main.go
├── internal/
│   ├── handlers/
│   ├── models/
│   ├── database/
│   └── middleware/
├── go.mod
└── go.sum
```

**Key Files:**
- Basic HTTP server setup
- Database connection with pgx or similar
- Basic middleware (CORS, logging)
- Health check endpoint

**Deliverables:**
- [ ] Go project initialized
- [ ] Database connection established
- [ ] Basic HTTP server running
- [ ] GET /health endpoint working

#### Step 1.3: Mock Authentication
```go
// Simple mock auth middleware
// POST /auth/login - returns mock JWT
// Middleware validates presence of auth header
```

**Deliverables:**
- [ ] POST /auth/login endpoint
- [ ] Mock JWT generation
- [ ] Auth middleware for protected routes

### Frontend (Phase 1)
**Priority: HIGH | Estimated Time: 2-3 days**

#### Step 1.4: Project Setup
```bash
npm create vite@latest inventory-frontend -- --template react-ts
cd inventory-frontend
npm install @tanstack/react-router @tanstack/react-query
npm install -D tailwindcss postcss autoprefixer
npm install @radix-ui/react-toast @radix-ui/react-dialog
npx shadcn-ui@latest init
```

**Deliverables:**
- [ ] Vite + React + TypeScript setup
- [ ] Tailwind CSS configured
- [ ] shadcn/ui components installed
- [ ] Basic project structure

#### Step 1.5: Basic Authentication & Routing
```tsx
// Routes: /login, /inventory, /users, /settings
// Mock login form
// Protected route wrapper
// Basic sidebar navigation
```

**Deliverables:**
- [ ] Login page with mock form
- [ ] TanStack Router setup
- [ ] Basic sidebar navigation
- [ ] Protected routes working

---

## Phase 2: Core Entities (SKUs)

### Database (Phase 2)
**Priority: HIGH | Estimated Time: 1 day**

#### Step 2.1: SKUs Table
```sql
CREATE TABLE skus (
  id SERIAL PRIMARY KEY,
  organization_id INT NOT NULL REFERENCES organizations(id),
  sku_code VARCHAR(50) NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  supplier VARCHAR(255),
  barcode VARCHAR(50) UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, sku_code)
);

-- Sample data
INSERT INTO skus (organization_id, sku_code, product_name, category) 
VALUES (1, 'TEST001', 'Test Product 1', 'Electronics');
```

**Deliverables:**
- [ ] SKUs table created
- [ ] Constraints added
- [ ] Sample data inserted

### Backend (Phase 2)
**Priority: HIGH | Estimated Time: 2-3 days**

#### Step 2.2: SKU CRUD Operations
```go
// GET /orgs/:orgId/skus?includeDeactivated=false
// POST /orgs/:orgId/skus
// GET /orgs/:orgId/skus/:skuId
// PATCH /orgs/:orgId/skus/:skuId (activate/deactivate only)
```

**Implementation Order:**
1. SKU model struct
2. Database queries (list, create, get, update)
3. HTTP handlers with basic validation
4. Organization-scoped queries

**Deliverables:**
- [ ] SKU model defined
- [ ] All CRUD endpoints working
- [ ] Basic validation (required fields, unique constraints)
- [ ] Organization scoping enforced

### Frontend (Phase 2)
**Priority: HIGH | Estimated Time: 2-3 days**

#### Step 2.3: SKU Management Interface
```tsx
// Basic table with TanStack Table
// Add/Edit modal with form validation
// Simple confirmation dialogs
```

**Implementation Order:**
1. SKU list page with basic table
2. React Query setup for SKU data
3. Add SKU modal form
4. Edit SKU modal (pre-filled)
5. Activate/deactivate functionality

**Deliverables:**
- [ ] SKU list page with basic filtering
- [ ] Add SKU modal form
- [ ] Edit SKU modal
- [ ] Activate/deactivate buttons
- [ ] Basic error handling with toasts

---

## Phase 3: Inventory & Calculated Fields

### Database (Phase 3)
**Priority: HIGH | Estimated Time: 1 day**

#### Step 3.1: Inventory Table
```sql
CREATE TABLE inventory (
  id SERIAL PRIMARY KEY,
  organization_id INT NOT NULL REFERENCES organizations(id),
  sku_id INT NOT NULL REFERENCES skus(id),
  quantity INT NOT NULL DEFAULT 0,
  weighted_cost NUMERIC(12,4) NOT NULL DEFAULT 0.0,
  total_value NUMERIC(14,4) NOT NULL DEFAULT 0.0,
  is_manual_cost BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_cost_nonneg CHECK (weighted_cost >= 0),
  UNIQUE (organization_id, sku_id)
);
```

**Deliverables:**
- [ ] Inventory table created
- [ ] One-to-one relationship with SKUs established
- [ ] Sample inventory data

### Backend (Phase 3)
**Priority: HIGH | Estimated Time: 2 days**

#### Step 3.2: Inventory Endpoints
```go
// GET /orgs/:orgId/inventory (with aggregated data)
// GET /orgs/:orgId/inventory/:skuId
// PATCH /orgs/:orgId/inventory/:skuId (manual cost updates)
```

**Implementation Order:**
1. Inventory model with calculated fields
2. Join queries (SKU + Inventory data)
3. Manual cost update with validation
4. Total value recalculation

**Deliverables:**
- [ ] Inventory listing with SKU details
- [ ] Manual cost update endpoint
- [ ] Proper constraint validation
- [ ] Calculated total_value field

### Frontend (Phase 3)
**Priority: MEDIUM | Estimated Time: 2 days**

#### Step 3.3: Inventory Display
```tsx
// Enhanced table showing SKU + inventory data
// Manual cost editing modal
// Validation for cost constraints
```

**Deliverables:**
- [ ] Inventory page with combined SKU/inventory data
- [ ] TanStack Table with filtering on all columns
- [ ] Manual cost editing modal
- [ ] Client-side sorting and filtering

---

## Phase 4: Transactions System

### Database (Phase 4)
**Priority: HIGH | Estimated Time: 1 day**

#### Step 4.1: Transactions Table
```sql
CREATE TABLE inventory_transactions (
  id SERIAL PRIMARY KEY,
  organization_id INT NOT NULL REFERENCES organizations(id),
  sku_id INT NOT NULL REFERENCES skus(id),
  user_id INT NOT NULL REFERENCES users(id),
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('in','out')),
  quantity INT NOT NULL CHECK (quantity > 0),
  unit_cost NUMERIC(12,4), -- required for 'in', NULL for 'out'
  transaction_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Deliverables:**
- [ ] Transactions table created
- [ ] Proper foreign key relationships
- [ ] Check constraints for business rules

### Backend (Phase 4)
**Priority: HIGH | Estimated Time: 3-4 days**

#### Step 4.2: Transaction Processing
```go
// POST /orgs/:orgId/transactions
// GET /orgs/:orgId/transactions
// Complex business logic for inventory updates
```

**Implementation Order:**
1. Transaction model and validation
2. Weighted average cost calculation logic
3. Inventory update triggers (in SQL transaction)
4. Business rule enforcement (inactive SKUs, negative inventory)
5. Auto-reactivation logic

**Critical Business Logic:**
```go
// For "in" transactions:
// 1. Validate SKU exists and is active (or prompt for reactivation)
// 2. Calculate new weighted average cost
// 3. Update inventory quantity and cost
// 4. Create transaction record
// All in single DB transaction

// For "out" transactions:
// 1. Validate sufficient inventory
// 2. Update inventory quantity (cost unchanged)
// 3. Create transaction record
```

**Deliverables:**
- [ ] Transaction creation endpoint with full business logic
- [ ] Weighted average cost calculation working
- [ ] Inventory auto-updates on transactions
- [ ] SKU reactivation on "in" transactions
- [ ] All operations properly atomic (SQL transactions)

### Frontend (Phase 4)
**Priority: HIGH | Estimated Time: 2-3 days**

#### Step 4.3: Transaction Interface
```tsx
// Transaction form (in/out)
// SKU selection dropdown
// Reactivation confirmation modal
```

**Implementation Order:**
1. Transaction creation form
2. SKU selection with active/inactive indication
3. Reactivation warning modal
4. Transaction history table
5. Real-time inventory updates

**Deliverables:**
- [ ] Add transaction form (in/out)
- [ ] SKU selection dropdown
- [ ] Reactivation confirmation modal
- [ ] Transaction history page
- [ ] Real-time inventory quantity updates

---

## Phase 5: User Management & Permissions

### Database (Phase 5)
**Priority: MEDIUM | Estimated Time: 0.5 days**

#### Step 5.1: User Permissions Table
```sql
CREATE TABLE user_editable_fields (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id),
  field_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, field_name)
);
```

**Deliverables:**
- [ ] User permissions table created
- [ ] Sample permissions data

### Backend (Phase 5)
**Priority: MEDIUM | Estimated Time: 2 days**

#### Step 5.2: User Management API
```go
// GET /orgs/:orgId/users
// POST /orgs/:orgId/users
// PATCH /orgs/:orgId/users/:userId
// GET /orgs/:orgId/users/:userId/editable-fields
// PUT /orgs/:orgId/users/:userId/editable-fields
```

**Deliverables:**
- [ ] User CRUD operations
- [ ] Per-user field permissions
- [ ] Role-based access control middleware

### Frontend (Phase 5)
**Priority: MEDIUM | Estimated Time: 2 days**

#### Step 5.3: User Management Interface
```tsx
// User list/add/edit forms
// Permission assignment interface
// Role selection
```

**Deliverables:**
- [ ] Users page with CRUD operations
- [ ] Role selection and permission assignment
- [ ] Field-level permission configuration

---

## Phase 6: Field Aliases & Customization

### Database (Phase 6)
**Priority: MEDIUM | Estimated Time: 0.5 days**

#### Step 6.1: Aliases Table
```sql
CREATE TABLE field_aliases (
  id SERIAL PRIMARY KEY,
  organization_id INT NOT NULL REFERENCES organizations(id),
  field_name TEXT NOT NULL CHECK (field_name IN ('product_name','sku','quantity','cost')),
  alias TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT alias_format CHECK (alias ~ '^[A-Za-z0-9_-]+$'),
  UNIQUE (organization_id, field_name),
  UNIQUE (organization_id, alias)
);

-- Insert defaults
INSERT INTO field_aliases (organization_id, field_name, alias) VALUES
(1, 'product_name', 'Product Name'),
(1, 'sku', 'SKU'),
(1, 'quantity', 'Quantity'),
(1, 'cost', 'Cost');
```

**Deliverables:**
- [ ] Aliases table with constraints
- [ ] Default aliases seeded

### Backend (Phase 6)
**Priority: MEDIUM | Estimated Time: 1 day**

#### Step 6.2: Aliases API
```go
// GET /orgs/:orgId/aliases
// PUT /orgs/:orgId/aliases
```

**Deliverables:**
- [ ] Alias management endpoints
- [ ] Validation for alias constraints
- [ ] Default alias creation for new orgs

### Frontend (Phase 6)
**Priority: MEDIUM | Estimated Time: 1-2 days**

#### Step 6.3: Settings Page
```tsx
// Alias management form
// Real-time preview of field names
// Validation feedback
```

**Deliverables:**
- [ ] Settings page with alias management
- [ ] Dynamic field name updates throughout app
- [ ] Alias validation and error handling

---

## Phase 7: Change Logging System

### Database (Phase 7)
**Priority: MEDIUM | Estimated Time: 0.5 days**

#### Step 7.1: Change Logs Table
```sql
CREATE TABLE change_logs (
  id SERIAL PRIMARY KEY,
  organization_id INT NOT NULL REFERENCES organizations(id),
  user_id INT NOT NULL REFERENCES users(id),
  entity_type TEXT NOT NULL,
  entity_id INT,
  sku_id INT REFERENCES skus(id),
  change_type TEXT NOT NULL,
  field_name TEXT,
  old_value TEXT,
  new_value TEXT,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_change_logs_org_created ON change_logs(organization_id, created_at DESC);
CREATE INDEX idx_change_logs_sku ON change_logs(sku_id, created_at DESC);
```

**Deliverables:**
- [ ] Change logs table with indexes
- [ ] Optimized for time-based queries

### Backend (Phase 7)
**Priority: MEDIUM | Estimated Time: 2 days**

#### Step 7.2: Logging Integration
```go
// Integrate logging into existing endpoints
// GET /orgs/:orgId/logs?lastDays=30
// GET /orgs/:orgId/skus/:skuId/logs?lastDays=30
```

**Implementation Order:**
1. Logging helper functions
2. Integrate into transaction endpoints
3. Integrate into SKU update endpoints
4. Integrate into alias updates
5. Integrate into manual cost updates

**Deliverables:**
- [ ] All major actions logged
- [ ] Log viewing endpoints
- [ ] 30-day filtering
- [ ] SKU-specific log views

### Frontend (Phase 7)
**Priority: LOW | Estimated Time: 1-2 days**

#### Step 7.3: Log Viewing Interface
```tsx
// Organization-wide logs page
// SKU-specific logs in detail view
// Chronological display
```

**Deliverables:**
- [ ] Organization logs page
- [ ] SKU detail page with logs
- [ ] Chronological log display
- [ ] Basic log filtering (30 days)

---

## Phase 8: File Import System

### Backend (Phase 8)
**Priority: LOW | Estimated Time: 2-3 days**

#### Step 8.1: Import Endpoints (Mock AI)
```go
// POST /orgs/:orgId/imports/initial
// POST /orgs/:orgId/imports/replace
// Mock AI service for schema detection
```

**Implementation Order:**
1. File upload handling
2. Mock AI schema detection (hardcoded mapping)
3. Bulk SKU creation
4. Bulk inventory replacement (in transaction)
5. Change logging for bulk operations

**Deliverables:**
- [ ] File upload endpoints
- [ ] Mock AI schema detection
- [ ] Bulk operations with transaction safety
- [ ] Comprehensive error handling

### Frontend (Phase 8)
**Priority: LOW | Estimated Time: 1-2 days**

#### Step 8.2: File Upload Interface
```tsx
// File drag-and-drop
// Upload progress
// Success/error feedback
```

**Deliverables:**
- [ ] File upload component
- [ ] Progress indicators
- [ ] Upload status feedback
- [ ] Integration with backend endpoints

---

## Phase 9: Polish & Integration

### Backend (Phase 9)
**Priority: LOW | Estimated Time: 1-2 days**

#### Step 9.1: Final Integration & Validation
- [ ] Comprehensive input validation on all endpoints
- [ ] Consistent error response format
- [ ] Performance optimization for list queries
- [ ] API documentation (basic)

### Frontend (Phase 9)
**Priority: LOW | Estimated Time: 2-3 days**

#### Step 9.2: UX Polish
- [ ] Consistent loading states across all pages
- [ ] Comprehensive error handling and user feedback
- [ ] Form validation improvements
- [ ] Mobile responsiveness (basic)
- [ ] Keyboard navigation support

### Testing & Documentation (Phase 9)
**Priority: LOW | Estimated Time: 1-2 days**

#### Step 9.3: Final Testing
- [ ] End-to-end workflow testing
- [ ] Multi-organization data isolation testing
- [ ] Business rule validation testing
- [ ] Basic API documentation
- [ ] Deployment preparation

---

## Implementation Timeline

### Week 1: Foundation
- **Days 1-2:** Database setup + Backend foundation
- **Days 3-4:** Frontend setup + Authentication
- **Day 5:** SKU database + basic API

### Week 2: Core Features  
- **Days 1-2:** SKU frontend + Inventory backend
- **Days 3-4:** Transaction system (backend heavy)
- **Day 5:** Transaction frontend

### Week 3: Management Features
- **Days 1-2:** User management system
- **Days 3-4:** Field aliases system
- **Day 5:** Change logging integration

### Week 4: Advanced Features
- **Days 1-3:** File import system
- **Days 4-5:** Polish and final integration

## Parallel Development Strategy

### Backend Developer Focus:
1. **Week 1:** Database + Auth + SKU API
2. **Week 2:** Inventory + Transaction business logic
3. **Week 3:** User management + Logging system
4. **Week 4:** File imports + Polish

### Frontend Developer Focus:
1. **Week 1:** Project setup + Auth + Basic routing
2. **Week 2:** SKU management + Inventory display
3. **Week 3:** Transaction forms + User management
4. **Week 4:** Settings page + Import interface + Polish

### Key Integration Points:
- **End of Week 1:** Auth + SKU CRUD working end-to-end
- **End of Week 2:** Complete inventory management workflow
- **End of Week 3:** User permissions and logging functional
- **End of Week 4:** Full PoC ready for demo

## Risk Mitigation

### High-Risk Items:
1. **Transaction business logic complexity** - Implement incrementally with extensive testing
2. **Database transaction handling** - Use proper isolation levels and error handling
3. **Real-time UI updates** - Use React Query for optimistic updates and cache invalidation

### Fallback Options:
- If file import is complex, hardcode sample data loading
- If weighted cost calculations are problematic, simplify to last-cost method
- If real-time updates are difficult, add manual refresh buttons

This implementation plan allows for incremental development with working features at each phase, enabling early testing and feedback.

