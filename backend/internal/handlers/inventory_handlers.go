package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"flex-erp-poc/internal/middleware"
	"flex-erp-poc/internal/models"

	"github.com/gorilla/mux"
)

func (h *Handler) GetInventory(w http.ResponseWriter, r *http.Request) {
	organizationID := getOrganizationIDFromContext(r)
	if organizationID == 0 {
		h.respondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	params := models.InventoryListParams{
		Page:  1,
		Limit: 50,
	}

	// Parse query parameters
	query := r.URL.Query()
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

	inventory, err := h.DB.GetInventoryWithSKUs(organizationID, params)
	if err != nil {
		h.respondWithError(w, http.StatusInternalServerError, "Failed to fetch inventory")
		return
	}

	h.respondWithJSON(w, http.StatusOK, inventory)
}

func (h *Handler) GetInventoryBySKU(w http.ResponseWriter, r *http.Request) {
	organizationID := getOrganizationIDFromContext(r)
	if organizationID == 0 {
		h.respondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	vars := mux.Vars(r)
	skuIDStr := vars["skuId"]
	skuID, err := strconv.Atoi(skuIDStr)
	if err != nil {
		h.respondWithError(w, http.StatusBadRequest, "Invalid SKU ID")
		return
	}

	inventory, err := h.DB.GetInventoryBySKUID(organizationID, skuID)
	if err != nil {
		h.respondWithError(w, http.StatusNotFound, "Inventory not found")
		return
	}

	h.respondWithJSON(w, http.StatusOK, inventory)
}

func (h *Handler) UpdateManualCost(w http.ResponseWriter, r *http.Request) {
	organizationID := getOrganizationIDFromContext(r)
	if organizationID == 0 {
		h.respondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	vars := mux.Vars(r)
	skuIDStr := vars["skuId"]
	skuID, err := strconv.Atoi(skuIDStr)
	if err != nil {
		h.respondWithError(w, http.StatusBadRequest, "Invalid SKU ID")
		return
	}

	var req models.UpdateManualCostRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.respondWithError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Basic validation
	if req.WeightedCost < 0 {
		h.respondWithError(w, http.StatusBadRequest, "Weighted cost must be non-negative")
		return
	}

	inventory, err := h.DB.UpdateManualCost(organizationID, skuID, req)
	if err != nil {
		h.respondWithError(w, http.StatusInternalServerError, "Failed to update manual cost")
		return
	}

	h.respondWithJSON(w, http.StatusOK, inventory)
}

func (h *Handler) CreateInventory(w http.ResponseWriter, r *http.Request) {
	organizationID := getOrganizationIDFromContext(r)
	if organizationID == 0 {
		h.respondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	var req struct {
		SKUID        int     `json:"sku_id"`
		Quantity     int     `json:"quantity"`
		WeightedCost float64 `json:"weighted_cost"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.respondWithError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Basic validation
	if req.SKUID <= 0 {
		h.respondWithError(w, http.StatusBadRequest, "Invalid SKU ID")
		return
	}
	if req.Quantity < 0 {
		h.respondWithError(w, http.StatusBadRequest, "Quantity must be non-negative")
		return
	}
	if req.WeightedCost < 0 {
		h.respondWithError(w, http.StatusBadRequest, "Weighted cost must be non-negative")
		return
	}

	inventory, err := h.DB.CreateInventoryForSKU(organizationID, req.SKUID, req.Quantity, req.WeightedCost)
	if err != nil {
		h.respondWithError(w, http.StatusInternalServerError, "Failed to create inventory")
		return
	}

	h.respondWithJSON(w, http.StatusCreated, inventory)
}

func getOrganizationIDFromContext(r *http.Request) int {
	orgID, ok := middleware.GetOrganizationIDFromContext(r.Context())
	if !ok {
		return 0
	}
	return orgID
}