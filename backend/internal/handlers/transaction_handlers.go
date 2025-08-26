package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"flex-erp-poc/internal/middleware"
	"flex-erp-poc/internal/models"
)

func (h *Handler) GetTransactions(w http.ResponseWriter, r *http.Request) {
	organizationID, ok := middleware.GetOrganizationIDFromContext(r.Context())
	if !ok {
		h.respondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	params := models.TransactionListParams{
		Page:  1,
		Limit: 50,
	}

	// Parse query parameters
	query := r.URL.Query()
	if transactionType := query.Get("transaction_type"); transactionType != "" {
		params.TransactionType = &transactionType
	}
	if skuIDStr := query.Get("sku_id"); skuIDStr != "" {
		params.SKUID = &skuIDStr
	}
	if category := query.Get("category"); category != "" {
		params.Category = &category
	}
	if search := query.Get("search"); search != "" {
		params.Search = &search
	}
	if pageStr := query.Get("page"); pageStr != "" {
		if page, err := strconv.Atoi(pageStr); err == nil && page > 0 {
			params.Page = page
		}
	}
	if limitStr := query.Get("limit"); limitStr != "" {
		if limit, err := strconv.Atoi(limitStr); err == nil && limit > 0 {
			params.Limit = limit
		}
	}
	if startDate := query.Get("start_date"); startDate != "" {
		params.StartDate = &startDate
	}
	if endDate := query.Get("end_date"); endDate != "" {
		params.EndDate = &endDate
	}

	transactions, err := h.DB.GetTransactionsWithDetails(organizationID, params)
	if err != nil {
		h.respondWithError(w, http.StatusInternalServerError, "Failed to fetch transactions")
		return
	}

	h.respondWithJSON(w, http.StatusOK, transactions)
}

func (h *Handler) CreateTransaction(w http.ResponseWriter, r *http.Request) {
	organizationID, ok := middleware.GetOrganizationIDFromContext(r.Context())
	if !ok {
		h.respondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		h.respondWithError(w, http.StatusUnauthorized, "User not found in context")
		return
	}

	var req models.CreateTransactionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.respondWithError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Basic validation
	if req.SKUID == "" {
		h.respondWithError(w, http.StatusBadRequest, "Invalid SKU ID")
		return
	}
	if req.TransactionType != "in" && req.TransactionType != "out" {
		h.respondWithError(w, http.StatusBadRequest, "Transaction type must be 'in' or 'out'")
		return
	}
	if req.Quantity <= 0 {
		h.respondWithError(w, http.StatusBadRequest, "Quantity must be positive")
		return
	}
	if req.UnitCost < 0 {
		h.respondWithError(w, http.StatusBadRequest, "Unit cost must be non-negative")
		return
	}

	transaction, err := h.DB.CreateTransaction(organizationID, userID, req)
	if err != nil {
		if err.Error() == "insufficient inventory: no inventory record found" ||
			err.Error()[:21] == "insufficient inventory" {
			h.respondWithError(w, http.StatusBadRequest, err.Error())
		} else {
			h.respondWithError(w, http.StatusInternalServerError, "Failed to create transaction")
		}
		return
	}

	// Log the transaction creation
	logReq := models.NewTransactionChangeLog(organizationID, userID, transaction.ID, req.SKUID)
	reason := fmt.Sprintf("%s transaction - %d units", strings.ToUpper(req.TransactionType), req.Quantity)
	if req.Notes != nil {
		reason = fmt.Sprintf("%s: %s", reason, *req.Notes)
	}
	logReq.Reason = &reason
	h.DB.LogChange(organizationID, userID, *logReq)

	h.respondWithJSON(w, http.StatusCreated, transaction)
}

func (h *Handler) GetTransactionSummary(w http.ResponseWriter, r *http.Request) {
	organizationID, ok := middleware.GetOrganizationIDFromContext(r.Context())
	if !ok {
		h.respondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	params := models.TransactionListParams{}

	// Parse query parameters for filtering
	query := r.URL.Query()
	if skuIDStr := query.Get("sku_id"); skuIDStr != "" {
		params.SKUID = &skuIDStr
	}
	if category := query.Get("category"); category != "" {
		params.Category = &category
	}
	if startDate := query.Get("start_date"); startDate != "" {
		params.StartDate = &startDate
	}
	if endDate := query.Get("end_date"); endDate != "" {
		params.EndDate = &endDate
	}

	summary, err := h.DB.GetTransactionSummary(organizationID, params)
	if err != nil {
		h.respondWithError(w, http.StatusInternalServerError, "Failed to fetch transaction summary")
		return
	}

	h.respondWithJSON(w, http.StatusOK, summary)
}
