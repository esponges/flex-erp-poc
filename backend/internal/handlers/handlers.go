package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"flex-erp-poc/internal/database"
	"flex-erp-poc/internal/middleware"

	"github.com/golang-jwt/jwt/v5"
)

type Handler struct {
	DB *database.PostgresService
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type LoginResponse struct {
	Token        string                 `json:"token"`
	User         *database.User         `json:"user"`
	Organization *database.Organization `json:"organization"`
}

type ErrorResponse struct {
	Error string `json:"error"`
}

var jwtSecret = []byte("your-secret-key") // In production, use environment variable

func (h *Handler) HealthCheck(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"status": "ok",
		"time":   time.Now().Format(time.RFC3339),
	})
}

func (h *Handler) Login(w http.ResponseWriter, r *http.Request) {
	var loginReq LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&loginReq); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "Invalid request body"})
		return
	}

	// Mock authentication - in a real app, verify password hash
	if loginReq.Email == "" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "Email is required"})
		return
	}

	// For POC, get the actual user from database or return mock user with correct org ID
	realUser, err := h.DB.GetUserByEmail(loginReq.Email)
	var user *database.User
	var organization *database.Organization

	if err == nil && realUser != nil {
		// Use real user
		user = realUser
	} else {
		// Mock user with actual organization ID from database
		var orgId int
		err = h.DB.DB.QueryRow("SELECT id FROM organizations LIMIT 1").Scan(&orgId)
		if err != nil {
			orgId = 1100401179193344001 // fallback
		}

		user = &database.User{
			ID:             1,
			OrganizationID: orgId,
			Email:          loginReq.Email,
			Name:           "Test User",
			Role:           "admin",
			CreatedAt:      time.Now(),
			UpdatedAt:      time.Now(),
		}
	}

	// Get organization details
	var orgName string
	err = h.DB.DB.QueryRow("SELECT name FROM organizations WHERE id = $1", user.OrganizationID).Scan(&orgName)
	if err != nil {
		orgName = "Test Organization"
	}

	organization = &database.Organization{
		ID:        user.OrganizationID,
		Name:      orgName,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	// Generate JWT token
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id":         user.ID,
		"organization_id": user.OrganizationID,
		"email":           user.Email,
		"role":            user.Role,
		"exp":             time.Now().Add(time.Hour * 24).Unix(),
	})

	tokenString, err := token.SignedString(jwtSecret)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "Failed to generate token"})
		return
	}

	response := LoginResponse{
		Token:        tokenString,
		User:         user,
		Organization: organization,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

func (h *Handler) Me(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(middleware.UserContextKey).(int)
	if !ok {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "User not found in context"})
		return
	}

	organizationID, ok := r.Context().Value(middleware.OrganizationContextKey).(int)
	if !ok {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "Organization not found in context"})
		return
	}

	// Try to get user from database first
	user, err := h.DB.GetUserByID(userID)
	var organization *database.Organization

	if err != nil {
		// If user not found in database, create mock user from JWT claims
		// Extract additional claims from the request context
		claims, ok := r.Context().Value(middleware.ClaimsContextKey).(*middleware.Claims)
		if !ok {
			// Fallback: create mock user with basic info
			user = &database.User{
				ID:             userID,
				OrganizationID: organizationID,
				Email:          "test@example.com", // This should come from JWT
				Name:           "Test User",
				Role:           "admin",
				CreatedAt:      time.Now(),
				UpdatedAt:      time.Now(),
			}
		} else {
			user = &database.User{
				ID:             userID,
				OrganizationID: organizationID,
				Email:          claims.Email,
				Name:           "Test User", // You might want to add name to JWT claims
				Role:           claims.Role,
				CreatedAt:      time.Now(),
				UpdatedAt:      time.Now(),
			}
		}
	}

	// Get organization details
	organization, err = h.DB.GetOrganizationByID(organizationID)
	if err != nil {
		// If organization not found, create mock organization
		var orgName string
		err = h.DB.DB.QueryRow("SELECT name FROM organizations WHERE id = $1", organizationID).Scan(&orgName)
		if err != nil {
			orgName = "Test Organization"
		}

		organization = &database.Organization{
			ID:        organizationID,
			Name:      orgName,
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		}
	}

	response := LoginResponse{
		Token:        "", // Don't return token in /me endpoint
		User:         user,
		Organization: organization,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

func (h *Handler) respondWithError(w http.ResponseWriter, code int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	json.NewEncoder(w).Encode(ErrorResponse{Error: message})
}

func (h *Handler) respondWithJSON(w http.ResponseWriter, code int, payload interface{}) {
	response, _ := json.Marshal(payload)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	w.Write(response)
}
