package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"flex-erp-poc/internal/models"

	"github.com/gorilla/mux"
)

func (h *Handler) GetChangeLogs(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	organizationID := vars["orgId"]
	if organizationID == "" {
		http.Error(w, "Invalid organization ID", http.StatusBadRequest)
		return
	}

	// Parse query parameters
	params := models.ChangeLogListParams{}

	if entityType := r.URL.Query().Get("entity_type"); entityType != "" {
		params.EntityType = &entityType
	}

	if entityIDStr := r.URL.Query().Get("entity_id"); entityIDStr != "" {
		params.EntityID = &entityIDStr
	}

	if skuIDStr := r.URL.Query().Get("sku_id"); skuIDStr != "" {
		params.SkuID = &skuIDStr
	}

	if userIDStr := r.URL.Query().Get("user_id"); userIDStr != "" {
		params.UserID = &userIDStr
	}

	if changeType := r.URL.Query().Get("change_type"); changeType != "" {
		params.ChangeType = &changeType
	}

	if lastDaysStr := r.URL.Query().Get("last_days"); lastDaysStr != "" {
		if lastDays, err := strconv.Atoi(lastDaysStr); err == nil && lastDays > 0 {
			params.LastDays = &lastDays
		}
	}

	if dateFromStr := r.URL.Query().Get("date_from"); dateFromStr != "" {
		if dateFrom, err := time.Parse("2006-01-02", dateFromStr); err == nil {
			params.DateFrom = &dateFrom
		}
	}

	if dateToStr := r.URL.Query().Get("date_to"); dateToStr != "" {
		if dateTo, err := time.Parse("2006-01-02", dateToStr); err == nil {
			params.DateTo = &dateTo
		}
	}

	if limit := r.URL.Query().Get("limit"); limit != "" {
		if l, err := strconv.Atoi(limit); err == nil && l > 0 {
			params.Limit = l
		}
	} else {
		params.Limit = 50 // Default limit
	}

	if offset := r.URL.Query().Get("offset"); offset != "" {
		if o, err := strconv.Atoi(offset); err == nil && o >= 0 {
			params.Offset = o
		}
	}

	changeLogs, err := h.DB.GetChangeLogs(organizationID, params)
	if err != nil {
		http.Error(w, "Failed to fetch change logs", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(changeLogs)
}

func (h *Handler) GetSKUChangeLogs(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	orgID := vars["orgId"]
	if orgID == "" {
		http.Error(w, "Invalid organization ID", http.StatusBadRequest)
		return
	}

	skuIDStr := vars["skuId"]
	if skuIDStr == "" {
		http.Error(w, "Invalid SKU ID", http.StatusBadRequest)
		return
	}

	// Parse last_days parameter, default to 30
	lastDays := 30
	if lastDaysStr := r.URL.Query().Get("last_days"); lastDaysStr != "" {
		if days, err := strconv.Atoi(lastDaysStr); err == nil && days > 0 {
			lastDays = days
		}
	}

	changeLogs, err := h.DB.GetSKUChangeLogs(orgID, skuIDStr, lastDays)
	if err != nil {
		http.Error(w, "Failed to fetch SKU change logs", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(changeLogs)
}

func (h *Handler) GetActivitySummary(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	orgID := vars["orgId"]
	if orgID == "" {
		http.Error(w, "Invalid organization ID", http.StatusBadRequest)
		return
	}

	// Parse last_days parameter, default to 30
	lastDays := 30
	if lastDaysStr := r.URL.Query().Get("last_days"); lastDaysStr != "" {
		if days, err := strconv.Atoi(lastDaysStr); err == nil && days > 0 {
			lastDays = days
		}
	}

	summary, err := h.DB.GetActivitySummary(orgID, lastDays)
	if err != nil {
		http.Error(w, "Failed to fetch activity summary", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(summary)
}

func (h *Handler) CreateChangeLog(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	orgID := vars["orgId"]
	if orgID == "" {
		http.Error(w, "Invalid organization ID", http.StatusBadRequest)
		return
	}

	// Get user ID from JWT token (middleware should set this)
	userID, ok := r.Context().Value("user_id").(string)
	if !ok {
		http.Error(w, "User ID not found in context", http.StatusUnauthorized)
		return
	}

	var req models.CreateChangeLogRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate required fields
	if req.EntityType == "" {
		http.Error(w, "entity_type is required", http.StatusBadRequest)
		return
	}
	if req.ChangeType == "" {
		http.Error(w, "change_type is required", http.StatusBadRequest)
		return
	}

	// Validate entity type
	isValidEntityType := false
	for _, supportedType := range models.SupportedEntityTypes {
		if req.EntityType == supportedType {
			isValidEntityType = true
			break
		}
	}
	if !isValidEntityType {
		http.Error(w, "invalid entity_type", http.StatusBadRequest)
		return
	}

	// Validate change type
	isValidChangeType := false
	for _, supportedType := range models.SupportedChangeTypes {
		if req.ChangeType == supportedType {
			isValidChangeType = true
			break
		}
	}
	if !isValidChangeType {
		http.Error(w, "invalid change_type", http.StatusBadRequest)
		return
	}

	changeLog, err := h.DB.CreateChangeLog(orgID, userID, req)
	if err != nil {
		http.Error(w, "Failed to create change log", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(changeLog)
}
