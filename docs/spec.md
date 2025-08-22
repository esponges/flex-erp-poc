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

### Phase 2: Core Entities (SKUs)
- [ ] SKU CRUD operations
- [ ] SKU management interface
- [ ] Organization scoping

### Phase 3: Inventory & Calculated Fields
- [ ] Inventory tracking
- [ ] Weighted cost calculations
- [ ] Manual cost adjustments

### Phase 4: Transactions System
- [ ] In/Out transactions
- [ ] Automatic inventory updates
- [ ] Business rule enforcement

### Phase 5: User Management & Permissions
- [ ] User CRUD operations
- [ ] Role-based access control
- [ ] Field-level permissions

### Phase 6: Field Aliases & Customization
- [ ] Custom field names
- [ ] Organization-specific aliases
- [ ] Settings interface

### Phase 7: Change Logging System
- [ ] Audit trail
- [ ] Change history
- [ ] Activity logs

### Phase 8: File Import System
- [ ] CSV/Excel imports
- [ ] Mock AI schema detection
- [ ] Bulk operations

## API Endpoints

### Authentication
- `POST /auth/login` - Mock login

### Health
- `GET /health` - Health check

### Future Endpoints
- Organization-scoped CRUD for SKUs, inventory, transactions
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