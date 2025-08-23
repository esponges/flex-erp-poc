package models

import "time"

type Transaction struct {
	ID              int       `json:"id"`
	OrganizationID  int       `json:"organization_id"`
	SKUID           int       `json:"sku_id"`
	TransactionType string    `json:"transaction_type"` // "in" or "out"
	Quantity        int       `json:"quantity"`
	UnitCost        float64   `json:"unit_cost"`
	TotalCost       float64   `json:"total_cost"`
	ReferenceNumber *string   `json:"reference_number,omitempty"`
	Notes           *string   `json:"notes,omitempty"`
	CreatedBy       int       `json:"created_by"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

// TransactionWithSKU includes SKU details for transaction listings
type TransactionWithSKU struct {
	ID              int       `json:"id"`
	OrganizationID  int       `json:"organization_id"`
	SKUID           int       `json:"sku_id"`
	TransactionType string    `json:"transaction_type"`
	Quantity        int       `json:"quantity"`
	UnitCost        float64   `json:"unit_cost"`
	TotalCost       float64   `json:"total_cost"`
	ReferenceNumber *string   `json:"reference_number,omitempty"`
	Notes           *string   `json:"notes,omitempty"`
	CreatedBy       int       `json:"created_by"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
	// SKU details
	SKUCode     string  `json:"sku_code"`
	ProductName string  `json:"product_name"`
	Description *string `json:"description,omitempty"`
	Category    *string `json:"category,omitempty"`
	// User details
	CreatedByName string `json:"created_by_name"`
}

// Request/Response types
type CreateTransactionRequest struct {
	SKUID           int     `json:"sku_id" validate:"required,min=1"`
	TransactionType string  `json:"transaction_type" validate:"required,oneof=in out"`
	Quantity        int     `json:"quantity" validate:"required,min=1"`
	UnitCost        float64 `json:"unit_cost" validate:"required,min=0"`
	ReferenceNumber *string `json:"reference_number,omitempty"`
	Notes           *string `json:"notes,omitempty"`
}

type TransactionListParams struct {
	TransactionType *string `json:"transaction_type,omitempty"`
	SKUID           *int    `json:"sku_id,omitempty"`
	Category        *string `json:"category,omitempty"`
	Search          *string `json:"search,omitempty"`
	Page            int     `json:"page"`
	Limit           int     `json:"limit"`
	StartDate       *string `json:"start_date,omitempty"`
	EndDate         *string `json:"end_date,omitempty"`
}

// BusinessRules defines inventory business rules
type BusinessRules struct {
	AllowNegativeInventory bool `json:"allow_negative_inventory"`
	RequireReferenceNumber bool `json:"require_reference_number"`
	MaxTransactionQuantity int  `json:"max_transaction_quantity"`
}

// TransactionSummary for reporting
type TransactionSummary struct {
	TransactionType   string  `json:"transaction_type"`
	TotalTransactions int     `json:"total_transactions"`
	TotalQuantity     int     `json:"total_quantity"`
	TotalValue        float64 `json:"total_value"`
}