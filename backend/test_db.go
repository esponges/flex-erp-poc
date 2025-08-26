package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(".env"); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	// Database connection
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("DATABASE_URL not set")
	}

	db, err := sql.Open("postgres", dbURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		log.Fatalf("Failed to ping database: %v", err)
	}

	log.Println("Successfully connected to database")

	// Check organizations
	fmt.Println("Organizations:")
	rows, err := db.Query("SELECT id, name FROM organizations")
	if err != nil {
		log.Printf("Failed to query organizations: %v", err)
	} else {
		defer rows.Close()
		for rows.Next() {
			var id string
			var name string
			rows.Scan(&id, &name)
			fmt.Printf("  %s: %s\n", id, name)
		}
	}

	// Check users
	fmt.Println("Users:")
	rows, err = db.Query("SELECT id, organization_id, email, name, role FROM users")
	if err != nil {
		log.Printf("Failed to query users: %v", err)
	} else {
		defer rows.Close()
		for rows.Next() {
			var id, orgId string
			var email, name, role string
			rows.Scan(&id, &orgId, &email, &name, &role)
			fmt.Printf("  %s: %s (%s) - Org: %s\n", id, email, role, orgId)
		}
	}

	// Check skus
	fmt.Println("SKUs:")
	rows, err = db.Query("SELECT id, organization_id, sku_code, product_name, is_active FROM skus LIMIT 10")
	if err != nil {
		log.Printf("Failed to query skus: %v", err)
	} else {
		defer rows.Close()
		for rows.Next() {
			var id, orgId string
			var skuCode, productName string
			var isActive bool
			rows.Scan(&id, &orgId, &skuCode, &productName, &isActive)
			fmt.Printf("  %s: %s - %s (Org: %s, Active: %t)\n", id, skuCode, productName, orgId, isActive)
		}
	}

	// Get the actual organization ID
	var orgId string
	err = db.QueryRow("SELECT id FROM organizations LIMIT 1").Scan(&orgId)
	if err != nil {
		log.Fatalf("Failed to get organization ID: %v", err)
	}

	log.Printf("Using organization ID: %s", orgId)

	// Insert missing data if needed
	var userCount int
	err = db.QueryRow("SELECT COUNT(*) FROM users WHERE email = 'admin@test.com'").Scan(&userCount)
	if err == nil && userCount == 0 {
		log.Println("Inserting missing user...")
		_, err = db.Exec("INSERT INTO users (organization_id, email, name, role) VALUES ($1, $2, $3, $4)", orgId, "admin@test.com", "Test Admin", "admin")
		if err != nil {
			log.Printf("Failed to insert user: %v", err)
		} else {
			log.Println("User inserted successfully")
		}
	}

	var skuCount int
	err = db.QueryRow("SELECT COUNT(*) FROM skus WHERE organization_id = $1", orgId).Scan(&skuCount)
	if err == nil && skuCount == 0 {
		log.Println("Inserting missing SKUs...")
		_, err = db.Exec(`
			INSERT INTO skus (organization_id, sku_code, product_name, description, category, supplier, is_active) VALUES
			($1, $2, $3, $4, $5, $6, $7),
			($8, $9, $10, $11, $12, $13, $14),
			($15, $16, $17, $18, $19, $20, $21),
			($22, $23, $24, $25, $26, $27, $28),
			($29, $30, $31, $32, $33, $34, $35)
		`, 
			orgId, "ELEC-001", "Wireless Bluetooth Headphones", "High-quality wireless headphones with noise cancellation", "Electronics", "TechCorp", true,
			orgId, "ELEC-002", "USB-C Cable 2M", "Durable USB-C to USB-A cable, 2 meters length", "Electronics", "CableCo", true,
			orgId, "FURN-001", "Office Desk Chair", "Ergonomic office chair with lumbar support", "Furniture", "OfficeMax", true,
			orgId, "STAT-001", "Blue Ballpoint Pen", "Classic blue ink ballpoint pen", "Stationery", "PenCorp", true,
			orgId, "STAT-002", "A4 Copy Paper", "White A4 paper, 500 sheets per ream", "Stationery", "PaperPlus", false,
		)
		if err != nil {
			log.Printf("Failed to insert SKUs: %v", err)
		} else {
			log.Println("SKUs inserted successfully")
		}
	}
}