package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"flex-erp-poc/internal/middleware"
	"flex-erp-poc/internal/models"

	"github.com/gorilla/mux"
)

// GetQuotations retrieves quotations for an organization with filtering
func (h *Handler) GetQuotations(w http.ResponseWriter, r *http.Request) {
	orgID, ok := middleware.GetOrganizationIDFromContext(r.Context())
	if !ok {
		h.respondWithError(w, http.StatusUnauthorized, "Organization not found in context")
		return
	}

	// Parse query parameters
	params := models.QuotationListParams{
		Page:  1,
		Limit: 50,
	}

	if status := r.URL.Query().Get("status"); status != "" {
		params.Status = &status
	}

	if salesPersonID := r.URL.Query().Get("sales_person_id"); salesPersonID != "" {
		params.SalesPersonID = &salesPersonID
	}

	if customerName := r.URL.Query().Get("customer_name"); customerName != "" {
		params.CustomerName = &customerName
	}

	if search := r.URL.Query().Get("search"); search != "" {
		params.Search = &search
	}

	if dateFrom := r.URL.Query().Get("date_from"); dateFrom != "" {
		if t, err := time.Parse("2006-01-02", dateFrom); err == nil {
			params.DateFrom = &t
		}
	}

	if dateTo := r.URL.Query().Get("date_to"); dateTo != "" {
		if t, err := time.Parse("2006-01-02", dateTo); err == nil {
			params.DateTo = &t
		}
	}

	if page := r.URL.Query().Get("page"); page != "" {
		if p, err := strconv.Atoi(page); err == nil && p > 0 {
			params.Page = p
		}
	}

	if limit := r.URL.Query().Get("limit"); limit != "" {
		if l, err := strconv.Atoi(limit); err == nil && l > 0 && l <= 100 {
			params.Limit = l
		}
	}

	quotations, err := h.DB.GetQuotations(orgID, params)
	if err != nil {
		h.respondWithError(w, http.StatusInternalServerError, "Failed to retrieve quotations")
		return
	}

	h.respondWithJSON(w, http.StatusOK, quotations)
}

// GetQuotation retrieves a single quotation by ID
func (h *Handler) GetQuotation(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	quotationID := vars["quotationId"]

	orgID, ok := middleware.GetOrganizationIDFromContext(r.Context())
	if !ok {
		h.respondWithError(w, http.StatusUnauthorized, "Organization not found in context")
		return
	}

	quotation, err := h.DB.GetQuotationByID(orgID, quotationID)
	if err != nil {
		h.respondWithError(w, http.StatusNotFound, "Quotation not found")
		return
	}

	h.respondWithJSON(w, http.StatusOK, quotation)
}

// CreateQuotation creates a new quotation
func (h *Handler) CreateQuotation(w http.ResponseWriter, r *http.Request) {
	orgID, ok := middleware.GetOrganizationIDFromContext(r.Context())
	if !ok {
		h.respondWithError(w, http.StatusUnauthorized, "Organization not found in context")
		return
	}

	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		h.respondWithError(w, http.StatusUnauthorized, "User not found in context")
		return
	}

	var req models.CreateQuotationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.respondWithError(w, http.StatusBadRequest, "Invalid JSON payload")
		return
	}

	// Validate request
	if err := h.validateCreateQuotationRequest(req); err != nil {
		h.respondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	quotation, err := h.DB.CreateQuotation(orgID, userID, req)
	if err != nil {
		h.respondWithError(w, http.StatusInternalServerError, "Failed to create quotation")
		return
	}

	h.respondWithJSON(w, http.StatusCreated, quotation)
}

// UpdateQuotation updates an existing quotation
func (h *Handler) UpdateQuotation(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	quotationID := vars["quotationId"]

	orgID, ok := middleware.GetOrganizationIDFromContext(r.Context())
	if !ok {
		h.respondWithError(w, http.StatusUnauthorized, "Organization not found in context")
		return
	}

	var req models.UpdateQuotationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.respondWithError(w, http.StatusBadRequest, "Invalid JSON payload")
		return
	}

	// Validate request
	if err := h.validateUpdateQuotationRequest(req); err != nil {
		h.respondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	quotation, err := h.DB.UpdateQuotation(orgID, quotationID, req)
	if err != nil {
		h.respondWithError(w, http.StatusInternalServerError, "Failed to update quotation")
		return
	}

	h.respondWithJSON(w, http.StatusOK, quotation)
}

// DeleteQuotation deletes a quotation
func (h *Handler) DeleteQuotation(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	quotationID := vars["quotationId"]

	orgID, ok := middleware.GetOrganizationIDFromContext(r.Context())
	if !ok {
		h.respondWithError(w, http.StatusUnauthorized, "Organization not found in context")
		return
	}

	err := h.DB.DeleteQuotation(orgID, quotationID)
	if err != nil {
		h.respondWithError(w, http.StatusInternalServerError, "Failed to delete quotation")
		return
	}

	h.respondWithJSON(w, http.StatusOK, map[string]string{"message": "Quotation deleted successfully"})
}

// DuplicateQuotation creates a copy of an existing quotation
func (h *Handler) DuplicateQuotation(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	quotationID := vars["quotationId"]

	orgID, ok := middleware.GetOrganizationIDFromContext(r.Context())
	if !ok {
		h.respondWithError(w, http.StatusUnauthorized, "Organization not found in context")
		return
	}

	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		h.respondWithError(w, http.StatusUnauthorized, "User not found in context")
		return
	}

	quotation, err := h.DB.DuplicateQuotation(orgID, quotationID, userID)
	if err != nil {
		h.respondWithError(w, http.StatusInternalServerError, "Failed to duplicate quotation")
		return
	}

	h.respondWithJSON(w, http.StatusCreated, quotation)
}

// ConvertQuotationToOrder converts a quotation to a sales order
func (h *Handler) ConvertQuotationToOrder(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	quotationID := vars["quotationId"]

	_, ok := middleware.GetOrganizationIDFromContext(r.Context())
	if !ok {
		h.respondWithError(w, http.StatusUnauthorized, "Organization not found in context")
		return
	}

	var req models.ConvertToSalesOrderRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.respondWithError(w, http.StatusBadRequest, "Invalid JSON payload")
		return
	}

	// For now, return a placeholder response
	// This will be implemented when sales order functionality is added
	h.respondWithJSON(w, http.StatusNotImplemented, map[string]string{
		"message": "Sales order conversion not yet implemented",
		"quotation_id": quotationID,
	})
}

// UpdateQuotationStatus updates the status of a quotation
func (h *Handler) UpdateQuotationStatus(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	quotationID := vars["quotationId"]

	orgID, ok := middleware.GetOrganizationIDFromContext(r.Context())
	if !ok {
		h.respondWithError(w, http.StatusUnauthorized, "Organization not found in context")
		return
	}

	var req struct {
		Status string `json:"status"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.respondWithError(w, http.StatusBadRequest, "Invalid JSON payload")
		return
	}

	// Validate status
	validStatuses := []string{"pending", "accepted", "rejected", "expired"}
	isValid := false
	for _, status := range validStatuses {
		if req.Status == status {
			isValid = true
			break
		}
	}
	if !isValid {
		h.respondWithError(w, http.StatusBadRequest, "Invalid status")
		return
	}

	err := h.DB.UpdateQuotationStatus(orgID, quotationID, req.Status)
	if err != nil {
		h.respondWithError(w, http.StatusInternalServerError, "Failed to update quotation status")
		return
	}

	h.respondWithJSON(w, http.StatusOK, map[string]string{"message": "Quotation status updated successfully"})
}

// GenerateQuotationPDF generates a PDF for the quotation
func (h *Handler) GenerateQuotationPDF(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	quotationID := vars["quotationId"]

	_, ok := middleware.GetOrganizationIDFromContext(r.Context())
	if !ok {
		h.respondWithError(w, http.StatusUnauthorized, "Organization not found in context")
		return
	}

	// For now, return a placeholder response
	// This will be implemented when PDF generation functionality is added
	h.respondWithJSON(w, http.StatusNotImplemented, map[string]string{
		"message": "PDF generation not yet implemented",
		"quotation_id": quotationID,
	})
}

// Helper functions for validation

func (h *Handler) validateCreateQuotationRequest(req models.CreateQuotationRequest) error {
	if req.CustomerName == "" {
		return fmt.Errorf("customer name is required")
	}
	if len(req.LineItems) == 0 {
		return fmt.Errorf("at least one line item is required")
	}
	if req.ValidityPeriodDays <= 0 {
		return fmt.Errorf("validity period must be positive")
	}
	for i, item := range req.LineItems {
		if item.SKUID == "" {
			return fmt.Errorf("line item %d: SKU ID is required", i+1)
		}
		if item.Quantity <= 0 {
			return fmt.Errorf("line item %d: quantity must be positive", i+1)
		}
	}
	return nil
}

func (h *Handler) validateUpdateQuotationRequest(req models.UpdateQuotationRequest) error {
	if req.CustomerName == "" {
		return fmt.Errorf("customer name is required")
	}
	if len(req.LineItems) == 0 {
		return fmt.Errorf("at least one line item is required")
	}
	if req.ValidityPeriodDays <= 0 {
		return fmt.Errorf("validity period must be positive")
	}
	for i, item := range req.LineItems {
		if item.SKUID == "" {
			return fmt.Errorf("line item %d: SKU ID is required", i+1)
		}
		if item.Quantity <= 0 {
			return fmt.Errorf("line item %d: quantity must be positive", i+1)
		}
	}
	return nil
}