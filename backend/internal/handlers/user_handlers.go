package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"flex-erp-poc/internal/middleware"
	"flex-erp-poc/internal/models"

	"github.com/gorilla/mux"
)

// GET /api/users
func (h *Handler) GetUsers(w http.ResponseWriter, r *http.Request) {
	orgID, ok := middleware.GetOrganizationIDFromContext(r.Context())
	if !ok {
		h.respondWithError(w, http.StatusUnauthorized, "Organization context not found")
		return
	}

	// Parse query parameters for filtering
	params := models.UserListParams{
		Page:  1,
		Limit: 50,
	}

	if pageStr := r.URL.Query().Get("page"); pageStr != "" {
		if page, err := strconv.Atoi(pageStr); err == nil && page > 0 {
			params.Page = page
		}
	}

	if limitStr := r.URL.Query().Get("limit"); limitStr != "" {
		if limit, err := strconv.Atoi(limitStr); err == nil && limit > 0 && limit <= 100 {
			params.Limit = limit
		}
	}

	if role := r.URL.Query().Get("role"); role != "" {
		params.Role = &role
	}

	if isActiveStr := r.URL.Query().Get("is_active"); isActiveStr != "" {
		if isActive, err := strconv.ParseBool(isActiveStr); err == nil {
			params.IsActive = &isActive
		}
	}

	if search := r.URL.Query().Get("search"); search != "" {
		params.Search = &search
	}

	users, err := h.DB.GetUsersWithDetails(orgID, params)
	if err != nil {
		h.respondWithError(w, http.StatusInternalServerError, "Failed to fetch users")
		return
	}

	response := map[string]interface{}{
		"users": users,
		"pagination": map[string]interface{}{
			"page":  params.Page,
			"limit": params.Limit,
			"total": len(users),
		},
	}

	h.respondWithJSON(w, http.StatusOK, response)
}

// POST /api/users
func (h *Handler) CreateUser(w http.ResponseWriter, r *http.Request) {
	orgID, ok := middleware.GetOrganizationIDFromContext(r.Context())
	if !ok {
		h.respondWithError(w, http.StatusUnauthorized, "Organization context not found")
		return
	}

	var req models.CreateUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.respondWithError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Basic validation
	if req.Email == "" || req.Name == "" || req.Role == "" {
		h.respondWithError(w, http.StatusBadRequest, "Email, name, and role are required")
		return
	}

	// Validate role
	validRoles := []string{"admin", "manager", "user", "viewer"}
	roleValid := false
	for _, validRole := range validRoles {
		if req.Role == validRole {
			roleValid = true
			break
		}
	}
	if !roleValid {
		h.respondWithError(w, http.StatusBadRequest, "Invalid role. Must be one of: admin, manager, user, viewer")
		return
	}

	user, err := h.DB.CreateUser(orgID, req)
	if err != nil {
		if err.Error() == "user with this email already exists" {
			h.respondWithError(w, http.StatusConflict, err.Error())
			return
		}
		h.respondWithError(w, http.StatusInternalServerError, "Failed to create user")
		return
	}

	h.respondWithJSON(w, http.StatusCreated, user)
}

// PUT /api/users/{id}
func (h *Handler) UpdateUser(w http.ResponseWriter, r *http.Request) {
	orgID, ok := middleware.GetOrganizationIDFromContext(r.Context())
	if !ok {
		h.respondWithError(w, http.StatusUnauthorized, "Organization context not found")
		return
	}

	vars := mux.Vars(r)
	userID, err := strconv.Atoi(vars["id"])
	if err != nil {
		h.respondWithError(w, http.StatusBadRequest, "Invalid user ID")
		return
	}

	var req models.UpdateUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.respondWithError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Basic validation
	if req.Name == "" || req.Role == "" {
		h.respondWithError(w, http.StatusBadRequest, "Name and role are required")
		return
	}

	// Validate role
	validRoles := []string{"admin", "manager", "user", "viewer"}
	roleValid := false
	for _, validRole := range validRoles {
		if req.Role == validRole {
			roleValid = true
			break
		}
	}
	if !roleValid {
		h.respondWithError(w, http.StatusBadRequest, "Invalid role. Must be one of: admin, manager, user, viewer")
		return
	}

	user, err := h.DB.UpdateUser(orgID, userID, req)
	if err != nil {
		if err.Error() == "user not found or not authorized" {
			h.respondWithError(w, http.StatusNotFound, err.Error())
			return
		}
		h.respondWithError(w, http.StatusInternalServerError, "Failed to update user")
		return
	}

	h.respondWithJSON(w, http.StatusOK, user)
}

// DELETE /api/users/{id}
func (h *Handler) DeleteUser(w http.ResponseWriter, r *http.Request) {
	orgID, ok := middleware.GetOrganizationIDFromContext(r.Context())
	if !ok {
		h.respondWithError(w, http.StatusUnauthorized, "Organization context not found")
		return
	}

	vars := mux.Vars(r)
	userID, err := strconv.Atoi(vars["id"])
	if err != nil {
		h.respondWithError(w, http.StatusBadRequest, "Invalid user ID")
		return
	}

	err = h.DB.DeleteUser(orgID, userID)
	if err != nil {
		if err.Error() == "user not found or not authorized" {
			h.respondWithError(w, http.StatusNotFound, err.Error())
			return
		}
		h.respondWithError(w, http.StatusInternalServerError, "Failed to delete user")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// GET /api/users/roles
func (h *Handler) GetUserRoles(w http.ResponseWriter, r *http.Request) {
	roles := models.DefaultRoles

	h.respondWithJSON(w, http.StatusOK, map[string]interface{}{
		"roles": roles,
	})
}

// GET /api/users/{id}/permissions
func (h *Handler) GetUserPermissions(w http.ResponseWriter, r *http.Request) {
	orgID, ok := middleware.GetOrganizationIDFromContext(r.Context())
	if !ok {
		h.respondWithError(w, http.StatusUnauthorized, "Organization context not found")
		return
	}

	vars := mux.Vars(r)
	userID, err := strconv.Atoi(vars["id"])
	if err != nil {
		h.respondWithError(w, http.StatusBadRequest, "Invalid user ID")
		return
	}

	// Get user to determine their role
	users, err := h.DB.GetUsersWithDetails(orgID, models.UserListParams{Page: 1, Limit: 100})
	if err != nil {
		h.respondWithError(w, http.StatusInternalServerError, "Failed to fetch user")
		return
	}

	var user *models.UserWithDetails
	for _, u := range users {
		if u.ID == userID {
			user = u
			break
		}
	}

	if user == nil {
		h.respondWithError(w, http.StatusNotFound, "User not found")
		return
	}

	// Get role permissions
	role := models.GetRoleByName(user.Role)
	if role == nil {
		h.respondWithError(w, http.StatusInternalServerError, "Invalid user role")
		return
	}

	// Get field permissions
	fieldPermissions := models.DefaultFieldPermissions[user.Role]

	response := map[string]interface{}{
		"user_id":           userID,
		"role":              role,
		"field_permissions": fieldPermissions,
	}

	h.respondWithJSON(w, http.StatusOK, response)
}

// POST /api/users/{id}/check-permission
func (h *Handler) CheckUserPermission(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	userID, err := strconv.Atoi(vars["id"])
	if err != nil {
		h.respondWithError(w, http.StatusBadRequest, "Invalid user ID")
		return
	}

	var req struct {
		Resource string `json:"resource"`
		Action   string `json:"action"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.respondWithError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	hasPermission, err := h.DB.CheckUserPermission(userID, req.Resource, req.Action)
	if err != nil {
		h.respondWithError(w, http.StatusInternalServerError, "Failed to check permission")
		return
	}

	response := map[string]interface{}{
		"has_permission": hasPermission,
		"resource":       req.Resource,
		"action":         req.Action,
	}

	h.respondWithJSON(w, http.StatusOK, response)
}
