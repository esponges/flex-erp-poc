package models

import (
	"time"
)

type Inventory struct {
	ID             string  `json:"id" db:"id"`
	OrganizationID string  `json:"organization_id" db:"organization_id"`
	SKUID          string  `json:"sku_id" db:"sku_id"`
	Quantity       int     `json:"quantity" db:"quantity"`
	WeightedCost   float64 `json:"weighted_cost" db:"weighted_cost"`
	TotalValue     float64 `json:"total_value" db:"total_value"`
	IsManualCost   bool    `json:"is_manual_cost" db:"is_manual_cost"`
	CreatedAt      time.Time `json:"created_at" db:"created_at"`
	UpdatedAt      time.Time `json:"updated_at" db:"updated_at"`
}

type InventoryWithSKU struct {
	ID             string  `json:"id"`
	OrganizationID string  `json:"organization_id"`
	SKUID          string  `json:"sku_id"`
	Quantity       int     `json:"quantity"`
	WeightedCost   float64 `json:"weighted_cost"`
	TotalValue     float64 `json:"total_value"`
	IsManualCost   bool    `json:"is_manual_cost"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
	
	// SKU details
	SKUCode     string  `json:"sku_code"`
	ProductName string  `json:"product_name"`
	Description *string `json:"description"`
	Category    *string `json:"category"`
	Supplier    *string `json:"supplier"`
	Barcode     *string `json:"barcode"`
	IsActive    bool    `json:"is_active"`
}

type UpdateManualCostRequest struct {
	WeightedCost float64 `json:"weighted_cost" validate:"required,min=0"`
}

type InventoryListParams struct {
	Category     *string `json:"category"`
	Search       *string `json:"search"`
	Page         int     `json:"page"`
	Limit        int     `json:"limit"`
}