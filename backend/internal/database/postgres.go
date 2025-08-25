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

func (p *PostgresService) GetOrganizationByID(id int) (*Organization, error) {
	org := &Organization{}
	query := `
		SELECT id, name, created_at, updated_at 
		FROM organizations 
		WHERE id = $1
	`
	err := p.DB.QueryRow(query, id).Scan(
		&org.ID,
		&org.Name,
		&org.CreatedAt,
		&org.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return org, nil
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

// Transaction Methods

func (p *PostgresService) GetTransactionsWithDetails(organizationID int, params models.TransactionListParams) ([]*models.TransactionWithSKU, error) {
	query := `
		SELECT 
			t.id, t.organization_id, t.sku_id, t.transaction_type, t.quantity, 
			t.unit_cost, t.total_cost, t.reference_number, t.notes, t.created_by, 
			t.created_at, t.updated_at,
			s.sku_code, s.product_name, s.description, s.category,
			u.name as created_by_name
		FROM transactions t
		JOIN skus s ON t.sku_id = s.id
		JOIN users u ON t.created_by = u.id
		WHERE t.organization_id = $1
	`
	args := []interface{}{organizationID}
	argIndex := 2

	// Add transaction type filter
	if params.TransactionType != nil && *params.TransactionType != "" {
		query += fmt.Sprintf(" AND t.transaction_type = $%d", argIndex)
		args = append(args, *params.TransactionType)
		argIndex++
	}

	// Add SKU filter
	if params.SKUID != nil && *params.SKUID > 0 {
		query += fmt.Sprintf(" AND t.sku_id = $%d", argIndex)
		args = append(args, *params.SKUID)
		argIndex++
	}

	// Add category filter
	if params.Category != nil && *params.Category != "" {
		query += fmt.Sprintf(" AND s.category = $%d", argIndex)
		args = append(args, *params.Category)
		argIndex++
	}

	// Add search filter
	if params.Search != nil && *params.Search != "" {
		searchTerm := "%" + strings.ToLower(*params.Search) + "%"
		query += fmt.Sprintf(" AND (LOWER(s.sku_code) LIKE $%d OR LOWER(s.product_name) LIKE $%d OR LOWER(t.reference_number) LIKE $%d OR LOWER(t.notes) LIKE $%d)", argIndex, argIndex, argIndex, argIndex)
		args = append(args, searchTerm)
		argIndex++
	}

	// Add date range filters
	if params.StartDate != nil && *params.StartDate != "" {
		query += fmt.Sprintf(" AND t.created_at >= $%d", argIndex)
		args = append(args, *params.StartDate)
		argIndex++
	}

	if params.EndDate != nil && *params.EndDate != "" {
		query += fmt.Sprintf(" AND t.created_at <= $%d", argIndex)
		args = append(args, *params.EndDate)
		argIndex++
	}

	query += " ORDER BY t.created_at DESC"

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

	var transactions []*models.TransactionWithSKU
	for rows.Next() {
		tx := &models.TransactionWithSKU{}
		err := rows.Scan(
			&tx.ID,
			&tx.OrganizationID,
			&tx.SKUID,
			&tx.TransactionType,
			&tx.Quantity,
			&tx.UnitCost,
			&tx.TotalCost,
			&tx.ReferenceNumber,
			&tx.Notes,
			&tx.CreatedBy,
			&tx.CreatedAt,
			&tx.UpdatedAt,
			&tx.SKUCode,
			&tx.ProductName,
			&tx.Description,
			&tx.Category,
			&tx.CreatedByName,
		)
		if err != nil {
			return nil, err
		}
		transactions = append(transactions, tx)
	}

	return transactions, nil
}

func (p *PostgresService) CreateTransaction(organizationID, userID int, req models.CreateTransactionRequest) (*models.Transaction, error) {
	// First, validate that the SKU exists and belongs to this organization
	_, err := p.GetSKUByID(organizationID, req.SKUID)
	if err != nil {
		return nil, fmt.Errorf("SKU not found: %v", err)
	}

	// Calculate total cost
	totalCost := float64(req.Quantity) * req.UnitCost

	// For 'out' transactions, check if there's enough inventory
	if req.TransactionType == "out" {
		inventory, err := p.GetInventoryBySKUID(organizationID, req.SKUID)
		if err != nil {
			// If no inventory record exists, we can't do an 'out' transaction
			return nil, fmt.Errorf("insufficient inventory: no inventory record found")
		}
		
		if inventory.Quantity < req.Quantity {
			return nil, fmt.Errorf("insufficient inventory: have %d, requested %d", inventory.Quantity, req.Quantity)
		}
	}

	// Create the transaction
	transaction := &models.Transaction{}
	query := `
		INSERT INTO transactions (organization_id, sku_id, transaction_type, quantity, unit_cost, total_cost, reference_number, notes, created_by, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
		RETURNING id, organization_id, sku_id, transaction_type, quantity, unit_cost, total_cost, reference_number, notes, created_by, created_at, updated_at
	`
	now := time.Now()
	err = p.DB.QueryRow(
		query,
		organizationID,
		req.SKUID,
		req.TransactionType,
		req.Quantity,
		req.UnitCost,
		totalCost,
		req.ReferenceNumber,
		req.Notes,
		userID,
		now,
		now,
	).Scan(
		&transaction.ID,
		&transaction.OrganizationID,
		&transaction.SKUID,
		&transaction.TransactionType,
		&transaction.Quantity,
		&transaction.UnitCost,
		&transaction.TotalCost,
		&transaction.ReferenceNumber,
		&transaction.Notes,
		&transaction.CreatedBy,
		&transaction.CreatedAt,
		&transaction.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	// Update inventory based on transaction type
	err = p.updateInventoryFromTransaction(organizationID, req.SKUID, req.TransactionType, req.Quantity, req.UnitCost)
	if err != nil {
		// Log error but don't fail the transaction creation
		// In a real system, this should be handled with database transactions
		fmt.Printf("Warning: Failed to update inventory: %v\n", err)
	}

	return transaction, nil
}

func (p *PostgresService) updateInventoryFromTransaction(organizationID, skuID int, transactionType string, quantity int, unitCost float64) error {
	// Get current inventory
	inventory, err := p.GetInventoryBySKUID(organizationID, skuID)
	if err != nil {
		// If no inventory exists and this is an 'in' transaction, create it
		if transactionType == "in" {
			_, err = p.CreateInventoryForSKU(organizationID, skuID, quantity, unitCost)
			return err
		}
		return fmt.Errorf("inventory not found for SKU %d", skuID)
	}

	var newQuantity int
	var newWeightedCost float64

	if transactionType == "in" {
		// Calculate weighted average cost for incoming inventory
		totalCurrentValue := float64(inventory.Quantity) * inventory.WeightedCost
		totalIncomingValue := float64(quantity) * unitCost
		newQuantity = inventory.Quantity + quantity
		if newQuantity > 0 {
			newWeightedCost = (totalCurrentValue + totalIncomingValue) / float64(newQuantity)
		} else {
			newWeightedCost = inventory.WeightedCost
		}
	} else { // "out"
		newQuantity = inventory.Quantity - quantity
		newWeightedCost = inventory.WeightedCost // Keep the same weighted cost
	}

	newTotalValue := float64(newQuantity) * newWeightedCost

	// Update inventory
	query := `
		UPDATE inventory 
		SET quantity = $3, weighted_cost = $4, total_value = $5, updated_at = $6
		WHERE organization_id = $1 AND sku_id = $2
	`
	_, err = p.DB.Exec(query, organizationID, skuID, newQuantity, newWeightedCost, newTotalValue, time.Now())
	return err
}

func (p *PostgresService) GetTransactionSummary(organizationID int, params models.TransactionListParams) ([]*models.TransactionSummary, error) {
	query := `
		SELECT 
			t.transaction_type,
			COUNT(*) as total_transactions,
			SUM(t.quantity) as total_quantity,
			SUM(t.total_cost) as total_value
		FROM transactions t
		JOIN skus s ON t.sku_id = s.id
		WHERE t.organization_id = $1
	`
	args := []interface{}{organizationID}
	argIndex := 2

	// Add filters (similar to GetTransactionsWithDetails)
	if params.SKUID != nil && *params.SKUID > 0 {
		query += fmt.Sprintf(" AND t.sku_id = $%d", argIndex)
		args = append(args, *params.SKUID)
		argIndex++
	}

	if params.Category != nil && *params.Category != "" {
		query += fmt.Sprintf(" AND s.category = $%d", argIndex)
		args = append(args, *params.Category)
		argIndex++
	}

	if params.StartDate != nil && *params.StartDate != "" {
		query += fmt.Sprintf(" AND t.created_at >= $%d", argIndex)
		args = append(args, *params.StartDate)
		argIndex++
	}

	if params.EndDate != nil && *params.EndDate != "" {
		query += fmt.Sprintf(" AND t.created_at <= $%d", argIndex)
		args = append(args, *params.EndDate)
		argIndex++
	}

	query += " GROUP BY t.transaction_type ORDER BY t.transaction_type"

	rows, err := p.DB.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var summaries []*models.TransactionSummary
	for rows.Next() {
		summary := &models.TransactionSummary{}
		err := rows.Scan(
			&summary.TransactionType,
			&summary.TotalTransactions,
			&summary.TotalQuantity,
			&summary.TotalValue,
		)
		if err != nil {
			return nil, err
		}
		summaries = append(summaries, summary)
	}

	return summaries, nil
}

// User Management Methods

func (p *PostgresService) GetUsersWithDetails(organizationID int, params models.UserListParams) ([]*models.UserWithDetails, error) {
	query := `
		SELECT 
			u.id, u.organization_id, u.email, u.name, u.role, u.is_active, 
			u.last_login_at, u.created_at, u.updated_at,
			o.name as organization_name
		FROM users u
		JOIN organizations o ON u.organization_id = o.id
		WHERE u.organization_id = $1
	`
	args := []interface{}{organizationID}
	argIndex := 2

	// Add role filter
	if params.Role != nil && *params.Role != "" {
		query += fmt.Sprintf(" AND u.role = $%d", argIndex)
		args = append(args, *params.Role)
		argIndex++
	}

	// Add active status filter
	if params.IsActive != nil {
		query += fmt.Sprintf(" AND u.is_active = $%d", argIndex)
		args = append(args, *params.IsActive)
		argIndex++
	}

	// Add search filter
	if params.Search != nil && *params.Search != "" {
		searchTerm := "%" + strings.ToLower(*params.Search) + "%"
		query += fmt.Sprintf(" AND (LOWER(u.name) LIKE $%d OR LOWER(u.email) LIKE $%d)", argIndex, argIndex)
		args = append(args, searchTerm)
		argIndex++
	}

	query += " ORDER BY u.created_at DESC"

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

	var users []*models.UserWithDetails
	for rows.Next() {
		user := &models.UserWithDetails{}
		err := rows.Scan(
			&user.ID,
			&user.OrganizationID,
			&user.Email,
			&user.Name,
			&user.Role,
			&user.IsActive,
			&user.LastLoginAt,
			&user.CreatedAt,
			&user.UpdatedAt,
			&user.OrganizationName,
		)
		if err != nil {
			return nil, err
		}
		users = append(users, user)
	}

	return users, nil
}

func (p *PostgresService) GetUserWithDetails(organizationID, userID int) (*models.UserWithDetails, error) {
	user := &models.UserWithDetails{}
	query := `
		SELECT 
			u.id, u.organization_id, u.email, u.name, u.role, u.is_active, 
			u.last_login_at, u.created_at, u.updated_at,
			o.name as organization_name
		FROM users u
		JOIN organizations o ON u.organization_id = o.id
		WHERE u.organization_id = $1 AND u.id = $2
	`
	err := p.DB.QueryRow(query, organizationID, userID).Scan(
		&user.ID,
		&user.OrganizationID,
		&user.Email,
		&user.Name,
		&user.Role,
		&user.IsActive,
		&user.LastLoginAt,
		&user.CreatedAt,
		&user.UpdatedAt,
		&user.OrganizationName,
	)
	if err != nil {
		return nil, err
	}
	return user, nil
}

func (p *PostgresService) CreateUser(organizationID int, req models.CreateUserRequest) (*models.UserWithDetails, error) {
	user := &models.UserWithDetails{}
	query := `
		INSERT INTO users (organization_id, email, name, role, is_active, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, organization_id, email, name, role, is_active, last_login_at, created_at, updated_at
	`
	now := time.Now()
	err := p.DB.QueryRow(
		query,
		organizationID,
		req.Email,
		req.Name,
		req.Role,
		true, // default to active
		now,
		now,
	).Scan(
		&user.ID,
		&user.OrganizationID,
		&user.Email,
		&user.Name,
		&user.Role,
		&user.IsActive,
		&user.LastLoginAt,
		&user.CreatedAt,
		&user.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	// Get the organization name
	orgQuery := `SELECT name FROM organizations WHERE id = $1`
	err = p.DB.QueryRow(orgQuery, organizationID).Scan(&user.OrganizationName)
	if err != nil {
		user.OrganizationName = ""
	}

	return user, nil
}

func (p *PostgresService) UpdateUser(organizationID, userID int, req models.UpdateUserRequest) (*models.UserWithDetails, error) {
	user := &models.UserWithDetails{}
	
	// Build dynamic query based on provided fields
	setParts := []string{"updated_at = $3"}
	args := []interface{}{organizationID, userID, time.Now()}
	argIndex := 4

	setParts = append(setParts, fmt.Sprintf("name = $%d", argIndex))
	args = append(args, req.Name)
	argIndex++

	setParts = append(setParts, fmt.Sprintf("role = $%d", argIndex))
	args = append(args, req.Role)
	argIndex++

	if req.IsActive != nil {
		setParts = append(setParts, fmt.Sprintf("is_active = $%d", argIndex))
		args = append(args, *req.IsActive)
		argIndex++
	}

	query := fmt.Sprintf(`
		UPDATE users 
		SET %s
		WHERE organization_id = $1 AND id = $2
		RETURNING id, organization_id, email, name, role, is_active, last_login_at, created_at, updated_at
	`, strings.Join(setParts, ", "))

	err := p.DB.QueryRow(query, args...).Scan(
		&user.ID,
		&user.OrganizationID,
		&user.Email,
		&user.Name,
		&user.Role,
		&user.IsActive,
		&user.LastLoginAt,
		&user.CreatedAt,
		&user.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	// Get the organization name
	orgQuery := `SELECT name FROM organizations WHERE id = $1`
	err = p.DB.QueryRow(orgQuery, organizationID).Scan(&user.OrganizationName)
	if err != nil {
		user.OrganizationName = ""
	}

	return user, nil
}

func (p *PostgresService) DeleteUser(organizationID, userID int) error {
	query := `DELETE FROM users WHERE organization_id = $1 AND id = $2`
	result, err := p.DB.Exec(query, organizationID, userID)
	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return fmt.Errorf("user not found")
	}

	return nil
}

func (p *PostgresService) UpdateUserLoginTime(userID int) error {
	query := `UPDATE users SET last_login_at = $1 WHERE id = $2`
	_, err := p.DB.Exec(query, time.Now(), userID)
	return err
}

// Helper function to check user permissions
func (p *PostgresService) CheckUserPermission(userID int, resource, action string) (bool, error) {
	// Get user role
	var role string
	query := `SELECT role FROM users WHERE id = $1`
	err := p.DB.QueryRow(query, userID).Scan(&role)
	if err != nil {
		return false, err
	}

	// Check permission using the role-based system
	userRole := models.GetRoleByName(role)
	if userRole == nil {
		return false, nil
	}

	return userRole.HasPermission(resource, action), nil
}