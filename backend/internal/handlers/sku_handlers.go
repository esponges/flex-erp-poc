package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	"flex-erp-poc/internal/middleware"
	"flex-erp-poc/internal/models"

	"github.com/gorilla/mux"
)

func (h *Handler) GetSKUs(w http.ResponseWriter, r *http.Request) {
	orgID, ok := middleware.GetOrganizationIDFromContext(r.Context())
	if !ok {
		h.respondWithError(w, http.StatusUnauthorized, "Organization not found in context")
		return
	}

	// Parse query parameters
	params := models.SKUListParams{
		IncludeDeactivated: r.URL.Query().Get("includeDeactivated") == "true",
		Page:               1,
		Limit:              50,
	}

	if category := r.URL.Query().Get("category"); category != "" {
		params.Category = &category
	}

	if search := r.URL.Query().Get("search"); search != "" {
		params.Search = &search
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

	skus, err := h.DB.GetSKUs(orgID, params)
	if err != nil {
		h.respondWithError(w, http.StatusInternalServerError, "Failed to retrieve SKUs")
		return
	}

	h.respondWithJSON(w, http.StatusOK, map[string]interface{}{
		"skus":   skus,
		"params": params,
	})
}

func (h *Handler) GetSKU(w http.ResponseWriter, r *http.Request) {
	orgID, ok := middleware.GetOrganizationIDFromContext(r.Context())
	if !ok {
		h.respondWithError(w, http.StatusUnauthorized, "Organization not found in context")
		return
	}

	vars := mux.Vars(r)
	skuID, err := strconv.Atoi(vars["skuId"])
	if err != nil {
		h.respondWithError(w, http.StatusBadRequest, "Invalid SKU ID")
		return
	}

	sku, err := h.DB.GetSKUByID(orgID, skuID)
	if err != nil {
		if err == sql.ErrNoRows {
			h.respondWithError(w, http.StatusNotFound, "SKU not found")
			return
		}
		h.respondWithError(w, http.StatusInternalServerError, "Failed to retrieve SKU")
		return
	}

	h.respondWithJSON(w, http.StatusOK, sku)
}

func (h *Handler) CreateSKU(w http.ResponseWriter, r *http.Request) {
	orgID, ok := middleware.GetOrganizationIDFromContext(r.Context())
	if !ok {
		h.respondWithError(w, http.StatusUnauthorized, "Organization not found in context")
		return
	}

	var req models.CreateSKURequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.respondWithError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Basic validation
	if req.SKUCode == "" || req.ProductName == "" {
		h.respondWithError(w, http.StatusBadRequest, "SKU code and product name are required")
		return
	}

	sku, err := h.DB.CreateSKU(orgID, req)
	if err != nil {
		// Check for unique constraint violation
		if strings.Contains(err.Error(), "duplicate key") || strings.Contains(err.Error(), "unique constraint") {
			h.respondWithError(w, http.StatusConflict, "SKU code already exists in this organization")
			return
		}
		h.respondWithError(w, http.StatusInternalServerError, "Failed to create SKU")
		return
	}

	h.respondWithJSON(w, http.StatusCreated, sku)
}

func (h *Handler) UpdateSKU(w http.ResponseWriter, r *http.Request) {
	orgID, ok := middleware.GetOrganizationIDFromContext(r.Context())
	if !ok {
		h.respondWithError(w, http.StatusUnauthorized, "Organization not found in context")
		return
	}

	vars := mux.Vars(r)
	skuID, err := strconv.Atoi(vars["skuId"])
	if err != nil {
		h.respondWithError(w, http.StatusBadRequest, "Invalid SKU ID")
		return
	}

	var req models.UpdateSKURequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.respondWithError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Basic validation
	if req.ProductName == "" {
		h.respondWithError(w, http.StatusBadRequest, "Product name is required")
		return
	}

	sku, err := h.DB.UpdateSKU(orgID, skuID, req)
	if err != nil {
		if err == sql.ErrNoRows {
			h.respondWithError(w, http.StatusNotFound, "SKU not found")
			return
		}
		h.respondWithError(w, http.StatusInternalServerError, "Failed to update SKU")
		return
	}

	h.respondWithJSON(w, http.StatusOK, sku)
}

func (h *Handler) UpdateSKUStatus(w http.ResponseWriter, r *http.Request) {
	orgID, ok := middleware.GetOrganizationIDFromContext(r.Context())
	if !ok {
		h.respondWithError(w, http.StatusUnauthorized, "Organization not found in context")
		return
	}

	vars := mux.Vars(r)
	skuID, err := strconv.Atoi(vars["skuId"])
	if err != nil {
		h.respondWithError(w, http.StatusBadRequest, "Invalid SKU ID")
		return
	}

	var req struct {
		IsActive bool `json:"is_active"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.respondWithError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	sku, err := h.DB.UpdateSKUStatus(orgID, skuID, req.IsActive)
	if err != nil {
		if err == sql.ErrNoRows {
			h.respondWithError(w, http.StatusNotFound, "SKU not found")
			return
		}
		h.respondWithError(w, http.StatusInternalServerError, "Failed to update SKU status")
		return
	}

	h.respondWithJSON(w, http.StatusOK, sku)
}

