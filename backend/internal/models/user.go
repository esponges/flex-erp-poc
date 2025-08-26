package models

import "time"

// Enhanced User model for user management
type UserWithDetails struct {
	ID             string    `json:"id"`
	OrganizationID string    `json:"organization_id"`
	Email          string    `json:"email"`
	Name           string    `json:"name"`
	Role           string    `json:"role"`
	IsActive       bool      `json:"is_active"`
	LastLoginAt    *time.Time `json:"last_login_at,omitempty"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
	// Organization details
	OrganizationName string `json:"organization_name"`
}

// Request/Response types for user management
type CreateUserRequest struct {
	Email string `json:"email" validate:"required,email"`
	Name  string `json:"name" validate:"required,min=1,max=100"`
	Role  string `json:"role" validate:"required,oneof=admin manager user viewer"`
}

type UpdateUserRequest struct {
	Name     string `json:"name" validate:"required,min=1,max=100"`
	Role     string `json:"role" validate:"required,oneof=admin manager user viewer"`
	IsActive *bool  `json:"is_active,omitempty"`
}

type UserListParams struct {
	Role       *string `json:"role,omitempty"`
	IsActive   *bool   `json:"is_active,omitempty"`
	Search     *string `json:"search,omitempty"`
	Page       int     `json:"page"`
	Limit      int     `json:"limit"`
}

// Role-based permissions
type UserRole struct {
	Name        string       `json:"name"`
	Description string       `json:"description"`
	Permissions []Permission `json:"permissions"`
}

type Permission struct {
	Resource string   `json:"resource"` // "skus", "inventory", "transactions", "users"
	Actions  []string `json:"actions"`  // "read", "create", "update", "delete"
}

// Field-level permissions
type FieldPermission struct {
	Resource string                 `json:"resource"`
	Fields   map[string]string     `json:"fields"` // field_name -> permission_level ("read", "write", "hidden")
}

// Predefined roles and their permissions
var DefaultRoles = []UserRole{
	{
		Name:        "admin",
		Description: "Full system access",
		Permissions: []Permission{
			{Resource: "skus", Actions: []string{"read", "create", "update", "delete"}},
			{Resource: "inventory", Actions: []string{"read", "create", "update", "delete"}},
			{Resource: "transactions", Actions: []string{"read", "create", "update", "delete"}},
			{Resource: "users", Actions: []string{"read", "create", "update", "delete"}},
			{Resource: "settings", Actions: []string{"read", "update"}},
			{Resource: "logs", Actions: []string{"read", "create"}},
		},
	},
	{
		Name:        "manager",
		Description: "Management access with limited user control",
		Permissions: []Permission{
			{Resource: "skus", Actions: []string{"read", "create", "update"}},
			{Resource: "inventory", Actions: []string{"read", "create", "update"}},
			{Resource: "transactions", Actions: []string{"read", "create", "update"}},
			{Resource: "users", Actions: []string{"read"}},
			{Resource: "settings", Actions: []string{"read", "update"}},
			{Resource: "logs", Actions: []string{"read"}},
		},
	},
	{
		Name:        "user",
		Description: "Standard user access",
		Permissions: []Permission{
			{Resource: "skus", Actions: []string{"read", "create", "update"}},
			{Resource: "inventory", Actions: []string{"read", "update"}},
			{Resource: "transactions", Actions: []string{"read", "create"}},
			{Resource: "logs", Actions: []string{"read"}},
		},
	},
	{
		Name:        "viewer",
		Description: "Read-only access",
		Permissions: []Permission{
			{Resource: "skus", Actions: []string{"read"}},
			{Resource: "inventory", Actions: []string{"read"}},
			{Resource: "transactions", Actions: []string{"read"}},
			{Resource: "logs", Actions: []string{"read"}},
		},
	},
}

// Default field permissions by role
var DefaultFieldPermissions = map[string][]FieldPermission{
	"admin": {
		{Resource: "skus", Fields: map[string]string{"*": "write"}},
		{Resource: "inventory", Fields: map[string]string{"*": "write"}},
		{Resource: "transactions", Fields: map[string]string{"*": "write"}},
		{Resource: "users", Fields: map[string]string{"*": "write"}},
	},
	"manager": {
		{Resource: "skus", Fields: map[string]string{"*": "write"}},
		{Resource: "inventory", Fields: map[string]string{"*": "write", "is_manual_cost": "read"}},
		{Resource: "transactions", Fields: map[string]string{"*": "write"}},
		{Resource: "users", Fields: map[string]string{"*": "read"}},
	},
	"user": {
		{Resource: "skus", Fields: map[string]string{"*": "write", "created_at": "read", "updated_at": "read"}},
		{Resource: "inventory", Fields: map[string]string{"*": "read", "quantity": "write"}},
		{Resource: "transactions", Fields: map[string]string{"*": "write", "created_by": "read"}},
		{Resource: "users", Fields: map[string]string{"*": "hidden"}},
	},
	"viewer": {
		{Resource: "skus", Fields: map[string]string{"*": "read"}},
		{Resource: "inventory", Fields: map[string]string{"*": "read"}},
		{Resource: "transactions", Fields: map[string]string{"*": "read"}},
		{Resource: "users", Fields: map[string]string{"*": "hidden"}},
	},
}

// Helper functions for permission checks
func (ur *UserRole) HasPermission(resource, action string) bool {
	for _, perm := range ur.Permissions {
		if perm.Resource == resource {
			for _, allowedAction := range perm.Actions {
				if allowedAction == action {
					return true
				}
			}
		}
	}
	return false
}

func GetRoleByName(roleName string) *UserRole {
	for _, role := range DefaultRoles {
		if role.Name == roleName {
			return &role
		}
	}
	return nil
}

func GetFieldPermissions(roleName, resource string) map[string]string {
	if permissions, exists := DefaultFieldPermissions[roleName]; exists {
		for _, fieldPerm := range permissions {
			if fieldPerm.Resource == resource {
				return fieldPerm.Fields
			}
		}
	}
	return map[string]string{}
}