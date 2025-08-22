package main

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"os"

	"flex-erp-poc/internal/database"
	"flex-erp-poc/internal/handlers"
	"flex-erp-poc/internal/middleware"

	"github.com/gorilla/mux"
	"github.com/joho/godotenv"
	"github.com/rs/cors"
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
		dbURL = "postgres://postgres:postgres@localhost:5432/flex_erp_poc?sslmode=disable"
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

	// Initialize handlers
	dbService := &database.PostgresService{DB: db}
	h := &handlers.Handler{DB: dbService}

	// Setup routes
	r := mux.NewRouter()
	
	// Health check
	r.HandleFunc("/health", h.HealthCheck).Methods("GET")
	
	// Auth routes
	r.HandleFunc("/auth/login", h.Login).Methods("POST")
	
	// Protected routes
	api := r.PathPrefix("/api/v1").Subrouter()
	api.Use(middleware.AuthMiddleware)

	// SKU routes
	api.HandleFunc("/orgs/{orgId:[0-9]+}/skus", h.GetSKUs).Methods("GET")
	api.HandleFunc("/orgs/{orgId:[0-9]+}/skus", h.CreateSKU).Methods("POST")
	api.HandleFunc("/orgs/{orgId:[0-9]+}/skus/{skuId:[0-9]+}", h.GetSKU).Methods("GET")
	api.HandleFunc("/orgs/{orgId:[0-9]+}/skus/{skuId:[0-9]+}", h.UpdateSKU).Methods("PATCH")
	api.HandleFunc("/orgs/{orgId:[0-9]+}/skus/{skuId:[0-9]+}/status", h.UpdateSKUStatus).Methods("PATCH")

	// Inventory routes
	api.HandleFunc("/orgs/{orgId:[0-9]+}/inventory", h.GetInventory).Methods("GET")
	api.HandleFunc("/orgs/{orgId:[0-9]+}/inventory", h.CreateInventory).Methods("POST")
	api.HandleFunc("/orgs/{orgId:[0-9]+}/inventory/sku/{skuId:[0-9]+}", h.GetInventoryBySKU).Methods("GET")
	api.HandleFunc("/orgs/{orgId:[0-9]+}/inventory/sku/{skuId:[0-9]+}/cost", h.UpdateManualCost).Methods("PATCH")

	// CORS setup
	c := cors.New(cors.Options{
		AllowedOrigins: []string{"http://localhost:5173", "http://localhost:3000"},
		AllowedMethods: []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders: []string{"*"},
		AllowCredentials: true,
	})

	handler := c.Handler(r)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	log.Fatal(http.ListenAndServe(fmt.Sprintf(":%s", port), handler))
}