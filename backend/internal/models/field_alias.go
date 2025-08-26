package models

import "time"

type FieldAlias struct {
	ID             string    `json:"id"`
	OrganizationID string    `json:"organization_id"`
	TableName      string    `json:"table_name"`
	FieldName      string    `json:"field_name"`
	DisplayName    string    `json:"display_name"`
	Description    *string   `json:"description,omitempty"`
	IsHidden       bool      `json:"is_hidden"`
	SortOrder      int       `json:"sort_order"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

type CreateFieldAliasRequest struct {
	TableName   string  `json:"table_name" validate:"required,max=100"`
	FieldName   string  `json:"field_name" validate:"required,max=100"`
	DisplayName string  `json:"display_name" validate:"required,max=255"`
	Description *string `json:"description,omitempty"`
	IsHidden    *bool   `json:"is_hidden,omitempty"`
	SortOrder   *int    `json:"sort_order,omitempty"`
}

type UpdateFieldAliasRequest struct {
	DisplayName *string `json:"display_name,omitempty" validate:"omitempty,max=255"`
	Description *string `json:"description,omitempty"`
	IsHidden    *bool   `json:"is_hidden,omitempty"`
	SortOrder   *int    `json:"sort_order,omitempty"`
}

type FieldAliasListParams struct {
	TableName *string `json:"table_name,omitempty"`
	IsHidden  *bool   `json:"is_hidden,omitempty"`
	Limit     int     `json:"limit,omitempty"`
	Offset    int     `json:"offset,omitempty"`
}

// TableFieldsResponse represents the customizable fields for a table
type TableFieldsResponse struct {
	TableName string                 `json:"table_name"`
	Fields    []*FieldAlias          `json:"fields"`
	Metadata  *TableFieldsMetadata   `json:"metadata,omitempty"`
}

type TableFieldsMetadata struct {
	TotalFields   int    `json:"total_fields"`
	HiddenFields  int    `json:"hidden_fields"`
	CustomAliases int    `json:"custom_aliases"`
	LastUpdated   *time.Time `json:"last_updated,omitempty"`
}

// Supported tables for field aliases
var SupportedTables = []string{
	"skus",
	"inventory", 
	"inventory_transactions",
	"users",
}

// Default field configurations for each table
type DefaultFieldConfig struct {
	FieldName   string `json:"field_name"`
	DisplayName string `json:"display_name"`
	Description string `json:"description"`
	SortOrder   int    `json:"sort_order"`
	IsRequired  bool   `json:"is_required"`
}

var DefaultTableFields = map[string][]DefaultFieldConfig{
	"skus": {
		{FieldName: "sku", DisplayName: "SKU Code", Description: "Unique product identifier", SortOrder: 1, IsRequired: true},
		{FieldName: "name", DisplayName: "Product Name", Description: "Name of the product", SortOrder: 2, IsRequired: true},
		{FieldName: "description", DisplayName: "Description", Description: "Product description", SortOrder: 3, IsRequired: false},
		{FieldName: "category", DisplayName: "Category", Description: "Product category", SortOrder: 4, IsRequired: false},
		{FieldName: "brand", DisplayName: "Brand", Description: "Product brand", SortOrder: 5, IsRequired: false},
		{FieldName: "unit_of_measure", DisplayName: "Unit", Description: "Unit of measurement", SortOrder: 6, IsRequired: false},
		{FieldName: "is_active", DisplayName: "Active", Description: "Whether SKU is active", SortOrder: 7, IsRequired: false},
	},
	"inventory": {
		{FieldName: "quantity", DisplayName: "Stock Level", Description: "Current quantity in stock", SortOrder: 1, IsRequired: true},
		{FieldName: "weighted_cost", DisplayName: "Avg Cost", Description: "Weighted average cost per unit", SortOrder: 2, IsRequired: true},
		{FieldName: "manual_cost", DisplayName: "Manual Cost", Description: "Manually set cost override", SortOrder: 3, IsRequired: false},
	},
	"inventory_transactions": {
		{FieldName: "type", DisplayName: "Type", Description: "Transaction type (IN/OUT)", SortOrder: 1, IsRequired: true},
		{FieldName: "quantity", DisplayName: "Quantity", Description: "Number of units moved", SortOrder: 2, IsRequired: true},
		{FieldName: "unit_cost", DisplayName: "Unit Cost", Description: "Cost per unit", SortOrder: 3, IsRequired: true},
		{FieldName: "notes", DisplayName: "Notes", Description: "Transaction notes", SortOrder: 4, IsRequired: false},
		{FieldName: "created_at", DisplayName: "Date", Description: "Transaction date", SortOrder: 5, IsRequired: true},
	},
	"users": {
		{FieldName: "name", DisplayName: "Full Name", Description: "User's full name", SortOrder: 1, IsRequired: true},
		{FieldName: "email", DisplayName: "Email", Description: "User's email address", SortOrder: 2, IsRequired: true},
		{FieldName: "role", DisplayName: "Role", Description: "User access level", SortOrder: 3, IsRequired: true},
		{FieldName: "is_active", DisplayName: "Status", Description: "Account status", SortOrder: 4, IsRequired: false},
		{FieldName: "last_login_at", DisplayName: "Last Login", Description: "Last login timestamp", SortOrder: 5, IsRequired: false},
	},
}