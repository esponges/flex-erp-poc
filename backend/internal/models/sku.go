package models

import (
	"time"
)

type SKU struct {
	ID             int       `json:"id" db:"id"`
	OrganizationID int       `json:"organization_id" db:"organization_id"`
	SKUCode        string    `json:"sku_code" db:"sku_code"`
	ProductName    string    `json:"product_name" db:"product_name"`
	Description    *string   `json:"description" db:"description"`
	Category       *string   `json:"category" db:"category"`
	Supplier       *string   `json:"supplier" db:"supplier"`
	Barcode        *string   `json:"barcode" db:"barcode"`
	IsActive       bool      `json:"is_active" db:"is_active"`
	CreatedAt      time.Time `json:"created_at" db:"created_at"`
	UpdatedAt      time.Time `json:"updated_at" db:"updated_at"`
}

type CreateSKURequest struct {
	SKUCode     string  `json:"sku_code" validate:"required,max=50"`
	ProductName string  `json:"product_name" validate:"required,max=255"`
	Description *string `json:"description"`
	Category    *string `json:"category" validate:"omitempty,max=100"`
	Supplier    *string `json:"supplier" validate:"omitempty,max=255"`
	Barcode     *string `json:"barcode" validate:"omitempty,max=50"`
}

type UpdateSKURequest struct {
	ProductName string  `json:"product_name" validate:"required,max=255"`
	Description *string `json:"description"`
	Category    *string `json:"category" validate:"omitempty,max=100"`
	Supplier    *string `json:"supplier" validate:"omitempty,max=255"`
	Barcode     *string `json:"barcode" validate:"omitempty,max=50"`
}

type SKUListParams struct {
	IncludeDeactivated bool    `json:"include_deactivated"`
	Category           *string `json:"category"`
	Search             *string `json:"search"`
	Page               int     `json:"page"`
	Limit              int     `json:"limit"`
}