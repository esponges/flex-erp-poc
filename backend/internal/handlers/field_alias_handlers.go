package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"

	"flex-erp-poc/internal/models"

	"github.com/gorilla/mux"
)

func (h *Handler) GetFieldAliases(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	orgID, err := strconv.Atoi(vars["orgId"])
	if err != nil {
		http.Error(w, "Invalid organization ID", http.StatusBadRequest)
		return
	}

	// Parse query parameters
	params := models.FieldAliasListParams{}
	
	if tableName := r.URL.Query().Get("table_name"); tableName != "" {
		params.TableName = &tableName
	}
	
	if isHidden := r.URL.Query().Get("is_hidden"); isHidden != "" {
		if hidden, err := strconv.ParseBool(isHidden); err == nil {
			params.IsHidden = &hidden
		}
	}
	
	if limit := r.URL.Query().Get("limit"); limit != "" {
		if l, err := strconv.Atoi(limit); err == nil && l > 0 {
			params.Limit = l
		}
	}
	
	if offset := r.URL.Query().Get("offset"); offset != "" {
		if o, err := strconv.Atoi(offset); err == nil && o >= 0 {
			params.Offset = o
		}
	}

	aliases, err := h.DB.GetFieldAliases(orgID, params)
	if err != nil {
		http.Error(w, "Failed to fetch field aliases", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(aliases)
}

func (h *Handler) CreateFieldAlias(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	orgID, err := strconv.Atoi(vars["orgId"])
	if err != nil {
		http.Error(w, "Invalid organization ID", http.StatusBadRequest)
		return
	}

	var req models.CreateFieldAliasRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate required fields
	if req.TableName == "" {
		http.Error(w, "table_name is required", http.StatusBadRequest)
		return
	}
	if req.FieldName == "" {
		http.Error(w, "field_name is required", http.StatusBadRequest)
		return
	}
	if req.DisplayName == "" {
		http.Error(w, "display_name is required", http.StatusBadRequest)
		return
	}

	// Validate table name is supported
	isValidTable := false
	for _, supportedTable := range models.SupportedTables {
		if req.TableName == supportedTable {
			isValidTable = true
			break
		}
	}
	if !isValidTable {
		http.Error(w, fmt.Sprintf("unsupported table: %s", req.TableName), http.StatusBadRequest)
		return
	}

	alias, err := h.DB.CreateFieldAlias(orgID, req)
	if err != nil {
		if err.Error() == "duplicate key value violates unique constraint" {
			http.Error(w, "field alias already exists for this table and field", http.StatusConflict)
			return
		}
		http.Error(w, "Failed to create field alias", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(alias)
}

func (h *Handler) UpdateFieldAlias(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	orgID, err := strconv.Atoi(vars["orgId"])
	if err != nil {
		http.Error(w, "Invalid organization ID", http.StatusBadRequest)
		return
	}

	aliasID, err := strconv.Atoi(vars["aliasId"])
	if err != nil {
		http.Error(w, "Invalid alias ID", http.StatusBadRequest)
		return
	}

	var req models.UpdateFieldAliasRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	alias, err := h.DB.UpdateFieldAlias(orgID, aliasID, req)
	if err != nil {
		if err.Error() == "field alias not found" {
			http.Error(w, "Field alias not found", http.StatusNotFound)
			return
		}
		http.Error(w, "Failed to update field alias", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(alias)
}

func (h *Handler) DeleteFieldAlias(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	orgID, err := strconv.Atoi(vars["orgId"])
	if err != nil {
		http.Error(w, "Invalid organization ID", http.StatusBadRequest)
		return
	}

	aliasID, err := strconv.Atoi(vars["aliasId"])
	if err != nil {
		http.Error(w, "Invalid alias ID", http.StatusBadRequest)
		return
	}

	err = h.DB.DeleteFieldAlias(orgID, aliasID)
	if err != nil {
		if err.Error() == "field alias not found" {
			http.Error(w, "Field alias not found", http.StatusNotFound)
			return
		}
		http.Error(w, "Failed to delete field alias", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) GetTableFields(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	orgID, err := strconv.Atoi(vars["orgId"])
	if err != nil {
		http.Error(w, "Invalid organization ID", http.StatusBadRequest)
		return
	}

	tableName := vars["tableName"]
	if tableName == "" {
		http.Error(w, "table name is required", http.StatusBadRequest)
		return
	}

	// Validate table name is supported
	isValidTable := false
	for _, supportedTable := range models.SupportedTables {
		if tableName == supportedTable {
			isValidTable = true
			break
		}
	}
	if !isValidTable {
		http.Error(w, fmt.Sprintf("unsupported table: %s", tableName), http.StatusBadRequest)
		return
	}

	tableFields, err := h.DB.GetTableFields(orgID, tableName)
	if err != nil {
		http.Error(w, "Failed to fetch table fields", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(tableFields)
}

func (h *Handler) InitializeTableFields(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	orgID, err := strconv.Atoi(vars["orgId"])
	if err != nil {
		http.Error(w, "Invalid organization ID", http.StatusBadRequest)
		return
	}

	tableName := vars["tableName"]
	if tableName == "" {
		http.Error(w, "table name is required", http.StatusBadRequest)
		return
	}

	// Validate table name is supported
	isValidTable := false
	for _, supportedTable := range models.SupportedTables {
		if tableName == supportedTable {
			isValidTable = true
			break
		}
	}
	if !isValidTable {
		http.Error(w, fmt.Sprintf("unsupported table: %s", tableName), http.StatusBadRequest)
		return
	}

	err = h.DB.InitializeDefaultFieldAliases(orgID, tableName)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to initialize table fields: %s", err.Error()), http.StatusInternalServerError)
		return
	}

	// Return the initialized fields
	tableFields, err := h.DB.GetTableFields(orgID, tableName)
	if err != nil {
		http.Error(w, "Failed to fetch initialized table fields", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(tableFields)
}

func (h *Handler) GetSupportedTables(w http.ResponseWriter, r *http.Request) {
	response := struct {
		Tables []string `json:"tables"`
		Count  int      `json:"count"`
	}{
		Tables: models.SupportedTables,
		Count:  len(models.SupportedTables),
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}