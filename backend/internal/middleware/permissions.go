package middleware

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"

	"flex-erp-poc/internal/database"
	"flex-erp-poc/internal/models"

	"github.com/golang-jwt/jwt/v5"
	"github.com/gorilla/mux"
)

type PermissionMiddleware struct {
	DB *database.PostgresService
}

type PermissionRequirement struct {
	Resource string
	Action   string
}

type contextKey string

const (
	UserIDKey       contextKey = "user_id"
	UserRoleKey     contextKey = "user_role"
	UserPermissions contextKey = "user_permissions"
)

// NewPermissionMiddleware creates a new permission middleware
func NewPermissionMiddleware(db *database.PostgresService) *PermissionMiddleware {
	return &PermissionMiddleware{DB: db}
}

// RequirePermission is a middleware that checks if the user has the required permission
func (pm *PermissionMiddleware) RequirePermission(resource, action string) mux.MiddlewareFunc {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Get the user information from the JWT token
			tokenString := r.Header.Get("Authorization")
			if tokenString == "" {
				http.Error(w, "Authorization header required", http.StatusUnauthorized)
				return
			}

			// Remove "Bearer " prefix
			if len(tokenString) > 7 && tokenString[:7] == "Bearer " {
				tokenString = tokenString[7:]
			}

			// Parse the JWT token
			token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
				// Make sure the signing method is what we expect
				if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
					return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
				}
				return []byte("your-secret-key"), nil // Same secret as in handlers.go
			})

			if err != nil || !token.Valid {
				http.Error(w, "Invalid token", http.StatusUnauthorized)
				return
			}

			claims, ok := token.Claims.(jwt.MapClaims)
			if !ok {
				http.Error(w, "Invalid token claims", http.StatusUnauthorized)
				return
			}

			userRole, ok := claims["role"].(string)
			if !ok {
				http.Error(w, "Role not found in token", http.StatusUnauthorized)
				return
			}

			// Check if the user's role has the required permission
			if !pm.hasPermission(userRole, resource, action) {
				http.Error(w, "Insufficient permissions", http.StatusForbidden)
				return
			}

			// Add user information to context
			ctx := r.Context()
			if userID, ok := claims["user_id"].(float64); ok {
				ctx = context.WithValue(ctx, UserIDKey, int(userID))
			}
			ctx = context.WithValue(ctx, UserRoleKey, userRole)

			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// RequireRole is a middleware that checks if the user has one of the required roles
func (pm *PermissionMiddleware) RequireRole(allowedRoles ...string) mux.MiddlewareFunc {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Get the user information from the JWT token
			tokenString := r.Header.Get("Authorization")
			if tokenString == "" {
				http.Error(w, "Authorization header required", http.StatusUnauthorized)
				return
			}

			// Remove "Bearer " prefix
			if len(tokenString) > 7 && tokenString[:7] == "Bearer " {
				tokenString = tokenString[7:]
			}

			// Parse the JWT token
			token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
				if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
					return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
				}
				return []byte("your-secret-key"), nil
			})

			if err != nil || !token.Valid {
				http.Error(w, "Invalid token", http.StatusUnauthorized)
				return
			}

			claims, ok := token.Claims.(jwt.MapClaims)
			if !ok {
				http.Error(w, "Invalid token claims", http.StatusUnauthorized)
				return
			}

			userRole, ok := claims["role"].(string)
			if !ok {
				http.Error(w, "Role not found in token", http.StatusUnauthorized)
				return
			}

			// Check if the user has one of the allowed roles
			roleAllowed := false
			for _, role := range allowedRoles {
				if userRole == role {
					roleAllowed = true
					break
				}
			}

			if !roleAllowed {
				http.Error(w, "Insufficient role permissions", http.StatusForbidden)
				return
			}

			// Add user information to context
			ctx := r.Context()
			if userID, ok := claims["user_id"].(float64); ok {
				ctx = context.WithValue(ctx, UserIDKey, int(userID))
			}
			ctx = context.WithValue(ctx, UserRoleKey, userRole)

			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// RequireSelfOrPermission allows access if the user is accessing their own data OR has the required permission
func (pm *PermissionMiddleware) RequireSelfOrPermission(resource, action string) mux.MiddlewareFunc {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Get the user information from the JWT token
			tokenString := r.Header.Get("Authorization")
			if tokenString == "" {
				http.Error(w, "Authorization header required", http.StatusUnauthorized)
				return
			}

			// Remove "Bearer " prefix
			if len(tokenString) > 7 && tokenString[:7] == "Bearer " {
				tokenString = tokenString[7:]
			}

			// Parse the JWT token
			token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
				if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
					return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
				}
				return []byte("your-secret-key"), nil
			})

			if err != nil || !token.Valid {
				http.Error(w, "Invalid token", http.StatusUnauthorized)
				return
			}

			claims, ok := token.Claims.(jwt.MapClaims)
			if !ok {
				http.Error(w, "Invalid token claims", http.StatusUnauthorized)
				return
			}

			userID, hasUserID := claims["user_id"].(float64)
			userRole, hasUserRole := claims["role"].(string)

			if !hasUserID || !hasUserRole {
				http.Error(w, "User information not found in token", http.StatusUnauthorized)
				return
			}

			// Get the target user ID from URL parameters
			vars := mux.Vars(r)
			targetUserIDStr, hasTargetUserID := vars["id"]

			accessGranted := false

			// Check if user is accessing their own data
			if hasTargetUserID {
				targetUserID, err := strconv.Atoi(targetUserIDStr)
				if err == nil && targetUserID == int(userID) {
					accessGranted = true
				}
			}

			// If not accessing own data, check permissions
			if !accessGranted {
				if !pm.hasPermission(userRole, resource, action) {
					http.Error(w, "Insufficient permissions", http.StatusForbidden)
					return
				}
			}

			// Add user information to context
			ctx := r.Context()
			ctx = context.WithValue(ctx, UserIDKey, int(userID))
			ctx = context.WithValue(ctx, UserRoleKey, userRole)

			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// hasPermission checks if a role has a specific permission
func (pm *PermissionMiddleware) hasPermission(roleName, resource, action string) bool {
	role := models.GetRoleByName(roleName)
	if role == nil {
		return false
	}

	return role.HasPermission(resource, action)
}

// GetUserIDFromContext extracts the user ID from the request context
func GetUserIDFromContext(ctx context.Context) (int, bool) {
	userID, ok := ctx.Value(UserIDKey).(int)
	return userID, ok
}

// GetUserRoleFromContext extracts the user role from the request context
func GetUserRoleFromContext(ctx context.Context) (string, bool) {
	role, ok := ctx.Value(UserRoleKey).(string)
	return role, ok
}

// CheckResourceAccess is a helper function to check if a user can access a specific resource
func (pm *PermissionMiddleware) CheckResourceAccess(w http.ResponseWriter, r *http.Request, resource, action string) bool {
	ctx := r.Context()

	userRole, ok := GetUserRoleFromContext(ctx)
	if !ok {
		http.Error(w, "User role not found", http.StatusUnauthorized)
		return false
	}

	if !pm.hasPermission(userRole, resource, action) {
		http.Error(w, "Insufficient permissions", http.StatusForbidden)
		return false
	}

	return true
}

// FilterFields filters response data based on field-level permissions
func (pm *PermissionMiddleware) FilterFields(data interface{}, userRole, resource string) interface{} {
	fieldPermissions := models.GetFieldPermissions(userRole, resource)

	// If no field permissions defined, return data as-is
	if len(fieldPermissions) == 0 {
		return data
	}

	// Convert data to map for field filtering
	dataBytes, err := json.Marshal(data)
	if err != nil {
		return data
	}

	var dataMap map[string]interface{}
	if err := json.Unmarshal(dataBytes, &dataMap); err != nil {
		return data
	}

	// Apply field-level permissions
	filteredData := make(map[string]interface{})

	for field, value := range dataMap {
		permission, exists := fieldPermissions[field]
		if !exists {
			// Check for wildcard permission
			if wildcardPerm, hasWildcard := fieldPermissions["*"]; hasWildcard {
				permission = wildcardPerm
			} else {
				// Default to read if no specific permission
				permission = "read"
			}
		}

		// Only include fields that are not hidden
		if permission != "hidden" {
			filteredData[field] = value
		}
	}

	return filteredData
}
