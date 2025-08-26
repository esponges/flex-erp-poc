package utils

import (
	"fmt"
	"regexp"
)

// IsValidUUID checks if a string is a valid UUID v4 format
func IsValidUUID(uuid string) bool {
	if uuid == "" {
		return false
	}
	
	// UUID v4 regex pattern
	uuidPattern := `^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$`
	matched, err := regexp.MatchString(uuidPattern, uuid)
	if err != nil {
		return false
	}
	
	return matched
}

// ValidateUUID returns the UUID if valid, or an error message if invalid
func ValidateUUID(uuid, fieldName string) (string, error) {
	if !IsValidUUID(uuid) {
		return "", fmt.Errorf("invalid %s: must be a valid UUID", fieldName)
	}
	return uuid, nil
}