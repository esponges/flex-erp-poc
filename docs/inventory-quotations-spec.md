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

### 2. Pricing & Quantities
- Users can apply pricing adjustments (discounts/markups)
- No restrictions on discount amounts
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

Quotation Line Items:
- Item reference
- Quantity quoted
- Unit price
- Discount/markup applied
- Line total
```

### User Interface Requirements
- Quotation creation form with item search/selection
- Real-time inventory level change notifications
- Quotation preview before PDF generation
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