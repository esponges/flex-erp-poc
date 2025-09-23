# Inventory Quotations Feature Specification

## Overview
A new feature for the Flex ERP PoC system that allows sales team members to create quotations for existing inventory items.

## Scope
- **Inventory Items**: Only items already in inventory (no custom/special orders)
- **User Access**: Open to any role initially
- **Core Function**: Create, manage, and send quotations to customers

## Core Features

### 1. Quotation Creation
**Item Information Display:**
- Item code/SKU
- Item description
- Unit of measure
- Base/list price
- Category/type
- Supplier information
- Item specifications (dimensions, weight, etc. if applicable)
- **Note**: Stock levels are NOT displayed during quotation creation

**Quotation Details (Placeholder Rules):**
- Customer information
- Quotation validity period
- Delivery terms
- Payment terms
- Sales person details
- Creation date

### 2. Pricing & Margins
**Hybrid Margin System:**
- **Default Margin**: Fixed percentage margin applied to all items in a quotation
- **Per-Item Margin Override**: Users can edit margins for specific SKUs within the quotation
- **Base Price Visibility**: Users can see the base/cost price during quotation creation
- **Customer-Facing Price**: Final quotation PDF shows only the final price after margin application

**Pricing Rules:**
- Margins are applied as percentage markup on base price
- Users can apply additional discounts/markups on top of margins
- No restrictions on discount amounts or margin adjustments
- Users can quote any total amount regardless of current inventory levels
- Support for partial quantities vs available stock

### 3. Inventory Level Handling
- System proceeds normally with quotation creation regardless of stock changes
- If inventory levels change during quotation creation, user receives notification
- No blocking or restrictions based on stock availability

### 4. Quotation Management Actions
- **Create** new quotations
- **Edit** existing quotations
- **Duplicate** quotations
- **Send directly** to customers (no approval workflow required)
- **Convert** to sales orders
- **Track status** (pending/accepted/rejected)

### 5. Output Format
- **PDF generation** from quotation preview/confirmation
- Simple format initially
- Generated on-demand when user requests

### 6. Search & Filtering
- **Primary Filter**: Filter quotations by applied/creation date
- Basic quotation listing view

## Technical Considerations

### Data Model Requirements
```
Quotation:
- ID
- Customer details (placeholder structure)
- Sales person
- Creation date
- Validity period
- Status (pending/accepted/rejected)
- Delivery terms (placeholder)
- Payment terms (placeholder)
- Default margin percentage

Quotation Line Items:
- Item reference
- Quantity quoted
- Base/cost price
- Item-specific margin percentage (overrides default if set)
- Additional discount/markup applied
- Final quoted price (calculated: base price + margin + discount/markup)
- Line total
```

### User Interface Requirements
- Quotation creation form with item search/selection
- Default margin percentage input for the entire quotation
- Per-line item margin override capability
- Base price display (visible to user) vs final quoted price
- Price calculation preview (base + margin + discount = final)
- Real-time inventory level change notifications
- Quotation preview before PDF generation (shows only final prices)
- Simple filtering interface by date
- Action buttons for edit/duplicate/convert/send

### Integration Points
- Inventory management system (for item details)
- Customer management (for customer selection)
- PDF generation service
- Sales order conversion workflow

## Implementation Priority
1. Core quotation creation and management
2. PDF generation
3. Basic filtering
4. Status tracking
5. Sales order conversion
6. Enhanced features (notifications, etc.)

## Future Enhancements (Out of Scope)
- Advanced approval workflows
- Complex pricing rules
- Advanced reporting/analytics
- Email integration
- Quotation templates
- Advanced search and filtering options

## Implementation Plan & Deliverables Checklist

### Phase 1: Core Foundation ✅ = Complete | 🔄 = In Progress | ⏳ = Pending

#### Iteration 1: Database & API Foundation
- [x] ✅ Set up database models for quotations and quotation line items
- [x] ✅ Create quotation creation API endpoints
- [x] ✅ Implement basic CRUD operations for quotations

#### Iteration 2: User Interface Foundation
- [ ] 🔄 Build quotation creation UI form
- [ ] ⏳ Implement item search and selection functionality
- [ ] ⏳ Add margin and pricing calculation logic

#### Iteration 3: Quotation Management
- [ ] ⏳ Create quotation management pages (list, edit, duplicate)
- [ ] ⏳ Implement PDF generation for quotations
- [ ] ⏳ Add inventory level change notifications

#### Iteration 4: Advanced Features
- [ ] ⏳ Create basic filtering by date functionality
- [ ] ⏳ Implement status tracking system
- [ ] ⏳ Build sales order conversion workflow

### Detailed Implementation Steps

#### Step 1: Database Schema Setup
**Files to modify/create:**
- Database migration files
- Model definitions (Quotation, QuotationLineItem)
- Database relationships and constraints

**Deliverables:**
- [x] ✅ Quotation table with all required fields
- [x] ✅ QuotationLineItem table with pricing calculations
- [x] ✅ Foreign key relationships established
- [x] ✅ Database migrations tested

#### Step 2: Backend API Development
**Files to modify/create:**
- API controllers for quotation management
- Service layer for business logic
- Validation schemas
- Integration with inventory system

**Deliverables:**
- [x] ✅ POST /api/quotations (create)
- [x] ✅ GET /api/quotations (list with filtering)
- [x] ✅ GET /api/quotations/:id (retrieve)
- [x] ✅ PUT /api/quotations/:id (update)
- [x] ✅ DELETE /api/quotations/:id (delete)
- [x] ✅ POST /api/quotations/:id/duplicate
- [x] ✅ POST /api/quotations/:id/convert-to-order

#### Step 3: Frontend Development
**Files to modify/create:**
- Quotation creation/edit forms
- Item selection components
- Pricing calculation components
- List/grid views
- PDF preview components

**Deliverables:**
- [ ] ⏳ Quotation creation form with item selection (placeholder created, needs full implementation)
- [ ] ⏳ Real-time price calculation display (logic implemented, needs UI integration)
- [ ] ⏳ Margin override functionality per line item (backend ready, frontend pending)
- [ ] ⏳ Quotation list view with basic filtering (placeholder only, data fetching pending)
- [ ] ⏳ Edit/duplicate/convert action buttons (API endpoints ready, UI pending)

#### Step 4: PDF Generation & Export
**Files to modify/create:**
- PDF template system
- PDF generation service
- Export functionality

**Deliverables:**
- [ ] PDF template for quotations
- [ ] PDF generation endpoint
- [ ] Download/email PDF functionality

#### Step 5: Integration & Testing
**Files to modify/create:**
- Integration tests
- Unit tests
- End-to-end tests

**Deliverables:**
- [ ] All API endpoints tested
- [ ] UI components tested
- [ ] PDF generation tested
- [ ] Integration with inventory system verified

### Progress Tracking
**Last Updated:** September 23, 2025

**Current Phase:** Phase 1 - Core Foundation
**Current Iteration:** Iteration 2 - User Interface Foundation
**Overall Progress:** 35% Complete

**Latest Accomplishments:**
- ✅ Complete database schema with quotations and line items tables
- ✅ Full CRUD API endpoints with proper authentication and permissions
- ✅ Automatic quotation number generation (Q2025-0001 format)
- ✅ Real-time pricing calculations with margin support
- ✅ API tested and working with sample data
- ✅ Basic frontend routing and page structure created
- 🔄 Currently working on: Quotation data fetching and display UI

**Current Gaps:**
- ⏳ Frontend quotation list display (currently placeholder only)
- ⏳ Quotation creation form with actual API integration
- ⏳ Real-time price calculation UI components
- ⏳ Item search and selection interface
- ⏳ Edit/duplicate/convert functionality

### Notes & Decisions Log
- [x] ✅ Technology stack decisions documented (Go backend + React frontend)
- [x] ✅ Database schema finalized (CockroachDB with UUID primary keys)
- [x] ✅ API design patterns established (RESTful with role-based permissions)
- [ ] ⏳ UI/UX mockups approved

### Technical Decisions Made:
- **Database**: Used CockroachDB-compatible SQL with UUID primary keys
- **Quotation Numbers**: Auto-generated in format Q{YEAR}-{0001}
- **Pricing Logic**: Base price from inventory + configurable margins + discounts/markups
- **Permissions**: Integrated with existing role-based system (admin/manager/user/viewer)
- **API Structure**: Following existing patterns with organization-scoped endpoints