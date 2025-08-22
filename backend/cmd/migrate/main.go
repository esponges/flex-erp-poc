package main

import (
	"database/sql"
	"log"

	_ "github.com/lib/pq"
)

func main() {
	// Database connection
	dbURL := "postgresql://fernando:jGi1y04FPRcC6KWTl1MeNA@naive-swimmer-2463.g8z.gcp-us-east1.cockroachlabs.cloud:26257/flex-erp-poc?sslmode=verify-full"

	db, err := sql.Open("postgres", dbURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		log.Fatalf("Failed to ping database: %v", err)
	}

	log.Println("Successfully connected to database")

	// Check if organization exists
	var orgCount int
	err = db.QueryRow("SELECT COUNT(*) FROM organizations WHERE id = 1").Scan(&orgCount)
	if err != nil {
		log.Fatalf("Failed to check organizations: %v", err)
	}

	if orgCount == 0 {
		log.Println("Inserting organization seed data...")
		_, err = db.Exec("INSERT INTO organizations (name) VALUES ('Test Organization')")
		if err != nil {
			log.Fatalf("Failed to insert organization: %v", err)
		}
		log.Println("Organization created successfully")
	} else {
		log.Println("Organization already exists")
	}

	// Check if user exists
	var userCount int
	err = db.QueryRow("SELECT COUNT(*) FROM users WHERE email = 'admin@test.com'").Scan(&userCount)
	if err != nil {
		log.Fatalf("Failed to check users: %v", err)
	}

	if userCount == 0 {
		log.Println("Inserting user seed data...")
		_, err = db.Exec("INSERT INTO users (organization_id, email, name, role) VALUES (1, 'admin@test.com', 'Test Admin', 'admin')")
		if err != nil {
			log.Fatalf("Failed to insert user: %v", err)
		}
		log.Println("User created successfully")
	} else {
		log.Println("User already exists")
	}

	// Check if SKUs exist
	var skuCount int
	err = db.QueryRow("SELECT COUNT(*) FROM skus WHERE organization_id = 1").Scan(&skuCount)
	if err != nil {
		log.Fatalf("Failed to check SKUs: %v", err)
	}

	if skuCount == 0 {
		log.Println("Inserting SKU seed data...")
		_, err = db.Exec(`
			INSERT INTO skus (organization_id, sku_code, product_name, description, category, supplier, is_active) VALUES
			(1, 'ELEC-001', 'Wireless Bluetooth Headphones', 'High-quality wireless headphones with noise cancellation', 'Electronics', 'TechCorp', TRUE),
			(1, 'ELEC-002', 'USB-C Cable 2M', 'Durable USB-C to USB-A cable, 2 meters length', 'Electronics', 'CableCo', TRUE),
			(1, 'FURN-001', 'Office Desk Chair', 'Ergonomic office chair with lumbar support', 'Furniture', 'OfficeMax', TRUE),
			(1, 'STAT-001', 'Blue Ballpoint Pen', 'Classic blue ink ballpoint pen', 'Stationery', 'PenCorp', TRUE),
			(1, 'STAT-002', 'A4 Copy Paper', 'White A4 paper, 500 sheets per ream', 'Stationery', 'PaperPlus', FALSE)
		`)
		if err != nil {
			log.Fatalf("Failed to insert SKUs: %v", err)
		}
		log.Println("SKUs created successfully")
	} else {
		log.Printf("SKUs already exist (%d records)", skuCount)
	}

	log.Println("Seed data completed!")
}