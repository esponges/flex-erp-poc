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
