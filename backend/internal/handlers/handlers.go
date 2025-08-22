package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"flex-erp-poc/internal/database"

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
	Token        string             `json:"token"`
	User         *database.User     `json:"user"`
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

	// For POC, accept any email and return mock user
	user := &database.User{
		ID:             1,
		OrganizationID: 1,
		Email:          loginReq.Email,
		Name:           "Test User",
		Role:           "admin",
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}

	organization := &database.Organization{
		ID:        1,
		Name:      "Test Organization",
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