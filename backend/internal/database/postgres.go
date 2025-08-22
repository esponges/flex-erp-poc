package database

import (
	"database/sql"
	"fmt"
	"strings"
	"time"

	"flex-erp-poc/internal/models"
)

type PostgresService struct {
	DB *sql.DB
}

type User struct {
	ID             int       `json:"id"`
	OrganizationID int       `json:"organization_id"`
	Email          string    `json:"email"`
	Name           string    `json:"name"`
	Role           string    `json:"role"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

type Organization struct {
	ID        int       `json:"id"`
	Name      string    `json:"name"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (p *PostgresService) GetUserByEmail(email string) (*User, error) {
	user := &User{}
	query := `
		SELECT id, organization_id, email, name, role, created_at, updated_at 
		FROM users 
		WHERE email = $1
	`
	err := p.DB.QueryRow(query, email).Scan(
		&user.ID,
		&user.OrganizationID,
		&user.Email,
		&user.Name,
		&user.Role,
		&user.CreatedAt,
		&user.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return user, nil
}

func (p *PostgresService) GetUserByID(id int) (*User, error) {
	user := &User{}
	query := `
		SELECT id, organization_id, email, name, role, created_at, updated_at 
		FROM users 
		WHERE id = $1
	`
	err := p.DB.QueryRow(query, id).Scan(
		&user.ID,
		&user.OrganizationID,
		&user.Email,
		&user.Name,
		&user.Role,
		&user.CreatedAt,
		&user.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return user, nil
}

// SKU Methods

func (p *PostgresService) GetSKUs(organizationID int, params models.SKUListParams) ([]*models.SKU, error) {
	query := `
		SELECT id, organization_id, sku_code, product_name, description, category, supplier, barcode, is_active, created_at, updated_at
		FROM skus 
		WHERE organization_id = $1
	`
	args := []interface{}{organizationID}
	argIndex := 2

	// Add active filter
	if !params.IncludeDeactivated {
		query += fmt.Sprintf(" AND is_active = $%d", argIndex)
		args = append(args, true)
		argIndex++
	}

	// Add category filter
	if params.Category != nil && *params.Category != "" {
		query += fmt.Sprintf(" AND category = $%d", argIndex)
		args = append(args, *params.Category)
		argIndex++
	}

	// Add search filter
	if params.Search != nil && *params.Search != "" {
		searchTerm := "%" + strings.ToLower(*params.Search) + "%"
		query += fmt.Sprintf(" AND (LOWER(sku_code) LIKE $%d OR LOWER(product_name) LIKE $%d OR LOWER(description) LIKE $%d)", argIndex, argIndex, argIndex)
		args = append(args, searchTerm)
		argIndex++
	}

	query += " ORDER BY created_at DESC"

	// Add pagination
	if params.Limit > 0 {
		query += fmt.Sprintf(" LIMIT $%d", argIndex)
		args = append(args, params.Limit)
		argIndex++

		if params.Page > 0 {
			offset := (params.Page - 1) * params.Limit
			query += fmt.Sprintf(" OFFSET $%d", argIndex)
			args = append(args, offset)
		}
	}

	rows, err := p.DB.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var skus []*models.SKU
	for rows.Next() {
		sku := &models.SKU{}
		err := rows.Scan(
			&sku.ID,
			&sku.OrganizationID,
			&sku.SKUCode,
			&sku.ProductName,
			&sku.Description,
			&sku.Category,
			&sku.Supplier,
			&sku.Barcode,
			&sku.IsActive,
			&sku.CreatedAt,
			&sku.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		skus = append(skus, sku)
	}

	return skus, nil
}

func (p *PostgresService) GetSKUByID(organizationID, id int) (*models.SKU, error) {
	sku := &models.SKU{}
	query := `
		SELECT id, organization_id, sku_code, product_name, description, category, supplier, barcode, is_active, created_at, updated_at
		FROM skus 
		WHERE organization_id = $1 AND id = $2
	`
	err := p.DB.QueryRow(query, organizationID, id).Scan(
		&sku.ID,
		&sku.OrganizationID,
		&sku.SKUCode,
		&sku.ProductName,
		&sku.Description,
		&sku.Category,
		&sku.Supplier,
		&sku.Barcode,
		&sku.IsActive,
		&sku.CreatedAt,
		&sku.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return sku, nil
}

func (p *PostgresService) CreateSKU(organizationID int, req models.CreateSKURequest) (*models.SKU, error) {
	sku := &models.SKU{}
	query := `
		INSERT INTO skus (organization_id, sku_code, product_name, description, category, supplier, barcode, is_active, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		RETURNING id, organization_id, sku_code, product_name, description, category, supplier, barcode, is_active, created_at, updated_at
	`
	now := time.Now()
	err := p.DB.QueryRow(
		query,
		organizationID,
		req.SKUCode,
		req.ProductName,
		req.Description,
		req.Category,
		req.Supplier,
		req.Barcode,
		true, // default to active
		now,
		now,
	).Scan(
		&sku.ID,
		&sku.OrganizationID,
		&sku.SKUCode,
		&sku.ProductName,
		&sku.Description,
		&sku.Category,
		&sku.Supplier,
		&sku.Barcode,
		&sku.IsActive,
		&sku.CreatedAt,
		&sku.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return sku, nil
}

func (p *PostgresService) UpdateSKU(organizationID, id int, req models.UpdateSKURequest) (*models.SKU, error) {
	sku := &models.SKU{}
	query := `
		UPDATE skus 
		SET product_name = $3, description = $4, category = $5, supplier = $6, barcode = $7, updated_at = $8
		WHERE organization_id = $1 AND id = $2
		RETURNING id, organization_id, sku_code, product_name, description, category, supplier, barcode, is_active, created_at, updated_at
	`
	now := time.Now()
	err := p.DB.QueryRow(
		query,
		organizationID,
		id,
		req.ProductName,
		req.Description,
		req.Category,
		req.Supplier,
		req.Barcode,
		now,
	).Scan(
		&sku.ID,
		&sku.OrganizationID,
		&sku.SKUCode,
		&sku.ProductName,
		&sku.Description,
		&sku.Category,
		&sku.Supplier,
		&sku.Barcode,
		&sku.IsActive,
		&sku.CreatedAt,
		&sku.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return sku, nil
}

func (p *PostgresService) UpdateSKUStatus(organizationID, id int, isActive bool) (*models.SKU, error) {
	sku := &models.SKU{}
	query := `
		UPDATE skus 
		SET is_active = $3, updated_at = $4
		WHERE organization_id = $1 AND id = $2
		RETURNING id, organization_id, sku_code, product_name, description, category, supplier, barcode, is_active, created_at, updated_at
	`
	now := time.Now()
	err := p.DB.QueryRow(query, organizationID, id, isActive, now).Scan(
		&sku.ID,
		&sku.OrganizationID,
		&sku.SKUCode,
		&sku.ProductName,
		&sku.Description,
		&sku.Category,
		&sku.Supplier,
		&sku.Barcode,
		&sku.IsActive,
		&sku.CreatedAt,
		&sku.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return sku, nil
}

// Inventory Methods

func (p *PostgresService) GetInventoryWithSKUs(organizationID int, params models.InventoryListParams) ([]*models.InventoryWithSKU, error) {
	query := `
		SELECT 
			i.id, i.organization_id, i.sku_id, i.quantity, i.weighted_cost, i.total_value, i.is_manual_cost, i.created_at, i.updated_at,
			s.sku_code, s.product_name, s.description, s.category, s.supplier, s.barcode, s.is_active
		FROM inventory i
		JOIN skus s ON i.sku_id = s.id
		WHERE i.organization_id = $1 AND s.is_active = true
	`
	args := []interface{}{organizationID}
	argIndex := 2

	// Add category filter
	if params.Category != nil && *params.Category != "" {
		query += fmt.Sprintf(" AND s.category = $%d", argIndex)
		args = append(args, *params.Category)
		argIndex++
	}

	// Add search filter
	if params.Search != nil && *params.Search != "" {
		searchTerm := "%" + strings.ToLower(*params.Search) + "%"
		query += fmt.Sprintf(" AND (LOWER(s.sku_code) LIKE $%d OR LOWER(s.product_name) LIKE $%d OR LOWER(s.description) LIKE $%d)", argIndex, argIndex, argIndex)
		args = append(args, searchTerm)
		argIndex++
	}

	query += " ORDER BY i.created_at DESC"

	// Add pagination
	if params.Limit > 0 {
		query += fmt.Sprintf(" LIMIT $%d", argIndex)
		args = append(args, params.Limit)
		argIndex++

		if params.Page > 0 {
			offset := (params.Page - 1) * params.Limit
			query += fmt.Sprintf(" OFFSET $%d", argIndex)
			args = append(args, offset)
		}
	}

	rows, err := p.DB.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var inventory []*models.InventoryWithSKU
	for rows.Next() {
		item := &models.InventoryWithSKU{}
		err := rows.Scan(
			&item.ID,
			&item.OrganizationID,
			&item.SKUID,
			&item.Quantity,
			&item.WeightedCost,
			&item.TotalValue,
			&item.IsManualCost,
			&item.CreatedAt,
			&item.UpdatedAt,
			&item.SKUCode,
			&item.ProductName,
			&item.Description,
			&item.Category,
			&item.Supplier,
			&item.Barcode,
			&item.IsActive,
		)
		if err != nil {
			return nil, err
		}
		inventory = append(inventory, item)
	}

	return inventory, nil
}

func (p *PostgresService) GetInventoryBySKUID(organizationID, skuID int) (*models.Inventory, error) {
	inventory := &models.Inventory{}
	query := `
		SELECT id, organization_id, sku_id, quantity, weighted_cost, total_value, is_manual_cost, created_at, updated_at
		FROM inventory 
		WHERE organization_id = $1 AND sku_id = $2
	`
	err := p.DB.QueryRow(query, organizationID, skuID).Scan(
		&inventory.ID,
		&inventory.OrganizationID,
		&inventory.SKUID,
		&inventory.Quantity,
		&inventory.WeightedCost,
		&inventory.TotalValue,
		&inventory.IsManualCost,
		&inventory.CreatedAt,
		&inventory.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return inventory, nil
}

func (p *PostgresService) UpdateManualCost(organizationID, skuID int, req models.UpdateManualCostRequest) (*models.Inventory, error) {
	inventory := &models.Inventory{}
	
	// First get current inventory data
	currentInventory, err := p.GetInventoryBySKUID(organizationID, skuID)
	if err != nil {
		return nil, err
	}
	
	// Calculate new total value
	newTotalValue := float64(currentInventory.Quantity) * req.WeightedCost
	
	query := `
		UPDATE inventory 
		SET weighted_cost = $3, total_value = $4, is_manual_cost = $5, updated_at = $6
		WHERE organization_id = $1 AND sku_id = $2
		RETURNING id, organization_id, sku_id, quantity, weighted_cost, total_value, is_manual_cost, created_at, updated_at
	`
	now := time.Now()
	err = p.DB.QueryRow(
		query,
		organizationID,
		skuID,
		req.WeightedCost,
		newTotalValue,
		true, // mark as manual cost
		now,
	).Scan(
		&inventory.ID,
		&inventory.OrganizationID,
		&inventory.SKUID,
		&inventory.Quantity,
		&inventory.WeightedCost,
		&inventory.TotalValue,
		&inventory.IsManualCost,
		&inventory.CreatedAt,
		&inventory.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return inventory, nil
}

func (p *PostgresService) CreateInventoryForSKU(organizationID, skuID int, quantity int, weightedCost float64) (*models.Inventory, error) {
	inventory := &models.Inventory{}
	totalValue := float64(quantity) * weightedCost
	
	query := `
		INSERT INTO inventory (organization_id, sku_id, quantity, weighted_cost, total_value, is_manual_cost, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id, organization_id, sku_id, quantity, weighted_cost, total_value, is_manual_cost, created_at, updated_at
	`
	now := time.Now()
	err := p.DB.QueryRow(
		query,
		organizationID,
		skuID,
		quantity,
		weightedCost,
		totalValue,
		false, // default to not manual cost
		now,
		now,
	).Scan(
		&inventory.ID,
		&inventory.OrganizationID,
		&inventory.SKUID,
		&inventory.Quantity,
		&inventory.WeightedCost,
		&inventory.TotalValue,
		&inventory.IsManualCost,
		&inventory.CreatedAt,
		&inventory.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return inventory, nil
}