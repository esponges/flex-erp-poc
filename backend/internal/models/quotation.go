package models

import (
	"time"
)

// Quotation represents a sales quotation
type Quotation struct {
	ID             string    `json:"id" db:"id"`
	OrganizationID string    `json:"organization_id" db:"organization_id"`
	QuotationNumber string   `json:"quotation_number" db:"quotation_number"`

	// Customer information (placeholder structure as per spec)
	CustomerName    string  `json:"customer_name" db:"customer_name"`
	CustomerEmail   *string `json:"customer_email" db:"customer_email"`
	CustomerPhone   *string `json:"customer_phone" db:"customer_phone"`
	CustomerAddress *string `json:"customer_address" db:"customer_address"`

	// Sales person and dates
	SalesPersonID       *string   `json:"sales_person_id" db:"sales_person_id"`
	CreationDate        time.Time `json:"creation_date" db:"creation_date"`
	ValidityPeriodDays  int       `json:"validity_period_days" db:"validity_period_days"`
	ValidUntil          time.Time `json:"valid_until" db:"valid_until"`

	// Terms (placeholders as per spec)
	DeliveryTerms *string `json:"delivery_terms" db:"delivery_terms"`
	PaymentTerms  *string `json:"payment_terms" db:"payment_terms"`

	// Pricing and status
	DefaultMarginPercentage float64 `json:"default_margin_percentage" db:"default_margin_percentage"`
	Subtotal                float64 `json:"subtotal" db:"subtotal"`
	TotalAmount             float64 `json:"total_amount" db:"total_amount"`
	Status                  string  `json:"status" db:"status"`

	// Metadata
	Notes     *string   `json:"notes" db:"notes"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`

	// Associated data (not in DB, populated via joins)
	LineItems      []QuotationLineItem `json:"line_items,omitempty"`
	SalesPersonName *string            `json:"sales_person_name,omitempty"`
}

// QuotationLineItem represents a line item in a quotation
type QuotationLineItem struct {
	ID          string `json:"id" db:"id"`
	QuotationID string `json:"quotation_id" db:"quotation_id"`
	SKUID       string `json:"sku_id" db:"sku_id"`

	// Quantity and pricing
	Quantity  float64 `json:"quantity" db:"quantity"`
	BasePrice float64 `json:"base_price" db:"base_price"`

	// Margin calculations
	ItemMarginPercentage      *float64 `json:"item_margin_percentage" db:"item_margin_percentage"`
	EffectiveMarginPercentage float64  `json:"effective_margin_percentage" db:"effective_margin_percentage"`

	// Additional discounts/markups
	AdditionalDiscountAmount float64 `json:"additional_discount_amount" db:"additional_discount_amount"`
	AdditionalMarkupAmount   float64 `json:"additional_markup_amount" db:"additional_markup_amount"`

	// Final pricing (calculated)
	UnitPriceAfterMargin float64 `json:"unit_price_after_margin" db:"unit_price_after_margin"`
	FinalUnitPrice       float64 `json:"final_unit_price" db:"final_unit_price"`
	LineTotal            float64 `json:"line_total" db:"line_total"`

	// Metadata
	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`

	// Associated data (not in DB, populated via joins)
	SKU *SKU `json:"sku,omitempty"`
}

// Request/Response types for quotation management

type CreateQuotationRequest struct {
	CustomerName        string  `json:"customer_name" validate:"required,max=255"`
	CustomerEmail       *string `json:"customer_email" validate:"omitempty,email,max=255"`
	CustomerPhone       *string `json:"customer_phone" validate:"omitempty,max=50"`
	CustomerAddress     *string `json:"customer_address"`
	ValidityPeriodDays  int     `json:"validity_period_days" validate:"min=1,max=365"`
	DeliveryTerms       *string `json:"delivery_terms"`
	PaymentTerms        *string `json:"payment_terms"`
	DefaultMarginPercentage float64 `json:"default_margin_percentage" validate:"min=-100,max=1000"`
	Notes               *string `json:"notes"`
	LineItems           []CreateQuotationLineItemRequest `json:"line_items" validate:"required,min=1,dive"`
}

type CreateQuotationLineItemRequest struct {
	SKUID                     string   `json:"sku_id" validate:"required"`
	Quantity                  float64  `json:"quantity" validate:"required,gt=0"`
	ItemMarginPercentage      *float64 `json:"item_margin_percentage" validate:"omitempty,min=-100,max=1000"`
	AdditionalDiscountAmount  float64  `json:"additional_discount_amount" validate:"min=0"`
	AdditionalMarkupAmount    float64  `json:"additional_markup_amount" validate:"min=0"`
}

type UpdateQuotationRequest struct {
	CustomerName        string  `json:"customer_name" validate:"required,max=255"`
	CustomerEmail       *string `json:"customer_email" validate:"omitempty,email,max=255"`
	CustomerPhone       *string `json:"customer_phone" validate:"omitempty,max=50"`
	CustomerAddress     *string `json:"customer_address"`
	ValidityPeriodDays  int     `json:"validity_period_days" validate:"min=1,max=365"`
	DeliveryTerms       *string `json:"delivery_terms"`
	PaymentTerms        *string `json:"payment_terms"`
	DefaultMarginPercentage float64 `json:"default_margin_percentage" validate:"min=-100,max=1000"`
	Status              *string `json:"status" validate:"omitempty,oneof=pending accepted rejected expired"`
	Notes               *string `json:"notes"`
	LineItems           []UpdateQuotationLineItemRequest `json:"line_items" validate:"required,min=1,dive"`
}

type UpdateQuotationLineItemRequest struct {
	ID                       *string  `json:"id"` // If provided, updates existing; if nil, creates new
	SKUID                    string   `json:"sku_id" validate:"required"`
	Quantity                 float64  `json:"quantity" validate:"required,gt=0"`
	ItemMarginPercentage     *float64 `json:"item_margin_percentage" validate:"omitempty,min=-100,max=1000"`
	AdditionalDiscountAmount float64  `json:"additional_discount_amount" validate:"min=0"`
	AdditionalMarkupAmount   float64  `json:"additional_markup_amount" validate:"min=0"`
}

type QuotationListParams struct {
	Status        *string    `json:"status"`
	SalesPersonID *string    `json:"sales_person_id"`
	CustomerName  *string    `json:"customer_name"`
	DateFrom      *time.Time `json:"date_from"`
	DateTo        *time.Time `json:"date_to"`
	Search        *string    `json:"search"`
	Page          int        `json:"page"`
	Limit         int        `json:"limit"`
}

// QuotationSummary for list views with basic info
type QuotationSummary struct {
	ID              string    `json:"id" db:"id"`
	QuotationNumber string    `json:"quotation_number" db:"quotation_number"`
	CustomerName    string    `json:"customer_name" db:"customer_name"`
	TotalAmount     float64   `json:"total_amount" db:"total_amount"`
	Status          string    `json:"status" db:"status"`
	CreationDate    time.Time `json:"creation_date" db:"creation_date"`
	ValidUntil      time.Time `json:"valid_until" db:"valid_until"`
	SalesPersonName *string   `json:"sales_person_name,omitempty" db:"sales_person_name"`
	LineItemCount   int       `json:"line_item_count" db:"line_item_count"`
}

// PDF generation related types
type QuotationPDFData struct {
	Quotation       Quotation `json:"quotation"`
	OrganizationName string   `json:"organization_name"`
	// Additional fields for PDF template
}

// Sales order conversion types
type ConvertToSalesOrderRequest struct {
	// Fields specific to sales order conversion
	// Placeholder for future implementation
}

// Pricing calculation helpers
func (qli *QuotationLineItem) CalculatePricing(defaultMargin float64) {
	// Determine effective margin
	if qli.ItemMarginPercentage != nil {
		qli.EffectiveMarginPercentage = *qli.ItemMarginPercentage
	} else {
		qli.EffectiveMarginPercentage = defaultMargin
	}

	// Calculate unit price after margin
	qli.UnitPriceAfterMargin = qli.BasePrice + (qli.BasePrice * qli.EffectiveMarginPercentage / 100)

	// Apply additional discount/markup
	qli.FinalUnitPrice = qli.UnitPriceAfterMargin + qli.AdditionalMarkupAmount - qli.AdditionalDiscountAmount

	// Ensure final price is not negative
	if qli.FinalUnitPrice < 0 {
		qli.FinalUnitPrice = 0
	}

	// Calculate line total
	qli.LineTotal = qli.FinalUnitPrice * qli.Quantity
}

// Validation helpers
func (q *Quotation) IsExpired() bool {
	return time.Now().After(q.ValidUntil)
}

func (q *Quotation) CanEdit() bool {
	return q.Status == "pending" && !q.IsExpired()
}

func (q *Quotation) CanConvertToOrder() bool {
	return q.Status == "accepted" || q.Status == "pending"
}