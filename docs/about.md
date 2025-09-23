# Flex ERP PoC - Functional Features

## Overview
Flex ERP PoC is an inventory management system designed for multi-tenant organizations with flexible field customization and comprehensive audit capabilities.

## Core Functional Features

### 1. Organization Management
- **Multi-tenant Architecture**: Complete data isolation between organizations
- **Organization-scoped Operations**: All features work within organization boundaries
- **Scalable Design**: Built to handle multiple organizations with independent configurations

### 2. User Management & Access Control
- **Role-based Access Control**: Three user roles (super_admin, admin, user)
- **Field-level Permissions**: Granular control over which fields each user can edit
- **User CRUD Operations**: Complete user lifecycle management within organizations
- **Authentication**: Mock JWT-based authentication system

### 3. SKU (Stock Keeping Unit) Management
- **SKU Lifecycle Management**: Create, read, update, and activate/deactivate SKUs
- **Unique SKU Codes**: Organization-scoped unique SKU identifiers
- **Product Information**: Comprehensive product details including name, description, category, supplier, and barcode
- **Search & Filtering**: Advanced search capabilities across all SKU attributes
- **Bulk Operations**: Support for importing and managing multiple SKUs

### 4. Inventory Tracking
- **Real-time Inventory Levels**: Current stock quantities for all SKUs
- **Weighted Cost Calculations**: Automatic weighted average cost computation
- **Manual Cost Adjustments**: Override automatic calculations when needed
- **Total Value Tracking**: Calculated inventory value (quantity × weighted cost)
- **One-to-one SKU Relationship**: Each SKU has corresponding inventory record

### 5. Transaction System
- **In/Out Transactions**: Record stock movements with complete audit trail
- **Automatic Inventory Updates**: Transactions automatically update inventory levels and costs
- **Business Rule Enforcement**:
  - Prevent negative inventory
  - Validate sufficient stock for outbound transactions
  - Auto-reactivate deactivated SKUs on inbound transactions
- **Weighted Cost Recalculation**: Automatic cost updates based on transaction history
- **Transaction History**: Complete chronological record of all stock movements

### 6. Field Customization & Aliases
- **Custom Field Names**: Organizations can customize display names for core fields
- **Alias Management**: Rename fields like "Product Name", "SKU", "Quantity", "Cost"
- **Real-time Updates**: Field name changes reflect immediately across the application
- **Validation**: Ensure alias uniqueness and format constraints
- **Default Configurations**: Sensible defaults with customization options

### 7. Comprehensive Audit System
- **Change Logging**: Track all modifications to SKUs, inventory, and transactions
- **User Attribution**: Record which user made each change
- **Field-level Tracking**: Capture old and new values for modified fields
- **Reason Codes**: Optional reasoning for changes
- **Time-based Filtering**: View changes within specific time periods (e.g., last 30 days)
- **Entity-specific Logs**: View audit trail for individual SKUs or across organization

### 8. File Import System
- **CSV/Excel Support**: Import data from common spreadsheet formats
- **Mock AI Schema Detection**: Intelligent mapping of file columns to system fields
- **Bulk Operations**:
  - Initial data import for new organizations
  - Replace existing inventory data
- **Validation & Error Handling**: Comprehensive data validation during import
- **Transaction Safety**: All bulk operations are atomic (all-or-nothing)

### 9. Advanced Search & Filtering
- **Multi-field Search**: Search across SKU codes, product names, descriptions, categories
- **Column-based Filtering**: Filter inventory and transaction views by any column
- **Pagination**: Handle large datasets efficiently
- **Sorting**: Sort by any column (name, quantity, cost, date, etc.)
- **Include/Exclude Inactive**: Toggle visibility of deactivated SKUs

### 10. Business Intelligence Features
- **Inventory Valuation**: Real-time total inventory value calculations
- **Cost Analysis**: Track cost changes over time through weighted averages
- **Transaction Analytics**: View stock movement patterns and trends
- **Activity Monitoring**: Organization-wide activity logs and user actions

## Technical Capabilities

### Data Integrity
- **ACID Transactions**: All critical operations maintain data consistency
- **Constraint Enforcement**: Database-level validation of business rules
- **Referential Integrity**: Proper foreign key relationships across all entities

### Performance Features
- **Optimized Queries**: Efficient database operations with proper indexing
- **Pagination**: Handle large datasets without performance degradation
- **Real-time Updates**: Immediate reflection of changes across the application

### User Experience
- **Responsive Design**: Works on desktop and mobile devices
- **Loading States**: Clear feedback during data operations
- **Error Handling**: Comprehensive error messages and validation feedback
- **Form Validation**: Real-time form validation with helpful error messages

### Security Features
- **Data Isolation**: Complete separation between organizations
- **Access Control**: Role and field-level permission enforcement
- **Audit Trail**: Complete record of all system activities
- **Input Validation**: Comprehensive validation to prevent invalid data entry

## Workflow Examples

### Adding New Inventory
1. Create or import SKUs with product information
2. Configure field aliases if needed
3. Set up user permissions for inventory management
4. Record initial stock through "in" transactions
5. Monitor inventory levels and costs in real-time

### Processing Stock Movements
1. Create "in" transactions for received goods (automatically updates weighted costs)
2. Create "out" transactions for sales/usage (validates sufficient stock)
3. Review transaction history and audit logs
4. Monitor inventory value changes

### Managing Users & Permissions
1. Create users with appropriate roles
2. Configure field-level edit permissions
3. Track user activities through audit logs
4. Adjust permissions as organizational needs change

This system provides a complete foundation for inventory management with the flexibility to adapt to different organizational needs through customizable fields, comprehensive audit capabilities, and robust business rule enforcement.