package models

import (
	"encoding/json"
	"time"
)

type ChangeLog struct {
	ID             int             `json:"id"`
	OrganizationID string          `json:"organization_id"`
	UserID         string          `json:"user_id"`
	EntityType     string          `json:"entity_type"`
	EntityID       *string         `json:"entity_id,omitempty"`
	SkuID          *string         `json:"sku_id,omitempty"`
	ChangeType     string          `json:"change_type"`
	FieldName      *string         `json:"field_name,omitempty"`
	OldValue       *string         `json:"old_value,omitempty"`
	NewValue       *string         `json:"new_value,omitempty"`
	Reason         *string         `json:"reason,omitempty"`
	Metadata       json.RawMessage `json:"metadata,omitempty"`
	CreatedAt      time.Time       `json:"created_at"`
	
	// Related data for display
	UserName         *string `json:"user_name,omitempty"`
	SkuCode          *string `json:"sku_code,omitempty"`
	SkuName          *string `json:"sku_name,omitempty"`
}

type CreateChangeLogRequest struct {
	EntityType string          `json:"entity_type" validate:"required,oneof=sku inventory transaction user field_alias"`
	EntityID   *string         `json:"entity_id,omitempty"`
	SkuID      *string         `json:"sku_id,omitempty"`
	ChangeType string          `json:"change_type" validate:"required,oneof=create update delete activate deactivate manual_cost_update"`
	FieldName  *string         `json:"field_name,omitempty"`
	OldValue   *string         `json:"old_value,omitempty"`
	NewValue   *string         `json:"new_value,omitempty"`
	Reason     *string         `json:"reason,omitempty"`
	Metadata   json.RawMessage `json:"metadata,omitempty"`
}

type ChangeLogListParams struct {
	EntityType  *string    `json:"entity_type,omitempty"`
	EntityID    *string    `json:"entity_id,omitempty"`
	SkuID       *string    `json:"sku_id,omitempty"`
	UserID      *string    `json:"user_id,omitempty"`
	ChangeType  *string    `json:"change_type,omitempty"`
	LastDays    *int       `json:"last_days,omitempty"` // Filter to last N days
	DateFrom    *time.Time `json:"date_from,omitempty"`
	DateTo      *time.Time `json:"date_to,omitempty"`
	Limit       int        `json:"limit,omitempty"`
	Offset      int        `json:"offset,omitempty"`
}

// Activity Summary for dashboard
type ActivitySummary struct {
	TotalChanges     int                    `json:"total_changes"`
	RecentChanges    int                    `json:"recent_changes"` // Last 24h
	TopUsers         []UserActivitySummary  `json:"top_users"`
	ChangesByType    map[string]int         `json:"changes_by_type"`
	RecentActivity   []*ChangeLog           `json:"recent_activity"`
}

type UserActivitySummary struct {
	UserID    string `json:"user_id"`
	UserName  string `json:"user_name"`
	Changes   int    `json:"changes"`
}

// Supported entity types
var SupportedEntityTypes = []string{
	"sku",
	"inventory", 
	"transaction",
	"user",
	"field_alias",
}

// Supported change types
var SupportedChangeTypes = []string{
	"create",
	"update", 
	"delete",
	"activate",
	"deactivate",
	"manual_cost_update",
}

// Helper function to create a change log entry
func NewChangeLog(orgID, userID string, entityType string, changeType string) *CreateChangeLogRequest {
	return &CreateChangeLogRequest{
		EntityType: entityType,
		ChangeType: changeType,
	}
}

// Helper methods for common change log scenarios
func NewSKUChangeLog(orgID, userID, skuID string, changeType string) *CreateChangeLogRequest {
	log := NewChangeLog(orgID, userID, "sku", changeType)
	log.SkuID = &skuID
	log.EntityID = &skuID
	return log
}

func NewInventoryChangeLog(orgID, userID, skuID string, changeType string) *CreateChangeLogRequest {
	log := NewChangeLog(orgID, userID, "inventory", changeType)
	log.SkuID = &skuID
	return log
}

func NewTransactionChangeLog(orgID, userID, transactionID, skuID string) *CreateChangeLogRequest {
	log := NewChangeLog(orgID, userID, "transaction", "create")
	log.EntityID = &transactionID
	log.SkuID = &skuID
	return log
}

func NewUserChangeLog(orgID, userID, targetUserID string, changeType string) *CreateChangeLogRequest {
	log := NewChangeLog(orgID, userID, "user", changeType)
	log.EntityID = &targetUserID
	return log
}