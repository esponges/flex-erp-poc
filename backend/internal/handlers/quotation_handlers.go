package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"html/template"
	"net/http"
	"strconv"
	"time"

	"flex-erp-poc/internal/middleware"
	"flex-erp-poc/internal/models"

	"github.com/gorilla/mux"
)

// GetQuotations retrieves quotations for an organization with filtering
func (h *Handler) GetQuotations(w http.ResponseWriter, r *http.Request) {
	orgID, ok := middleware.GetOrganizationIDFromContext(r.Context())
	if !ok {
		h.respondWithError(w, http.StatusUnauthorized, "Organization not found in context")
		return
	}

	// Parse query parameters
	params := models.QuotationListParams{
		Page:  1,
		Limit: 50,
	}

	if status := r.URL.Query().Get("status"); status != "" {
		params.Status = &status
	}

	if salesPersonID := r.URL.Query().Get("sales_person_id"); salesPersonID != "" {
		params.SalesPersonID = &salesPersonID
	}

	if customerName := r.URL.Query().Get("customer_name"); customerName != "" {
		params.CustomerName = &customerName
	}

	if search := r.URL.Query().Get("search"); search != "" {
		params.Search = &search
	}

	if dateFrom := r.URL.Query().Get("date_from"); dateFrom != "" {
		if t, err := time.Parse("2006-01-02", dateFrom); err == nil {
			params.DateFrom = &t
		}
	}

	if dateTo := r.URL.Query().Get("date_to"); dateTo != "" {
		if t, err := time.Parse("2006-01-02", dateTo); err == nil {
			params.DateTo = &t
		}
	}

	if page := r.URL.Query().Get("page"); page != "" {
		if p, err := strconv.Atoi(page); err == nil && p > 0 {
			params.Page = p
		}
	}

	if limit := r.URL.Query().Get("limit"); limit != "" {
		if l, err := strconv.Atoi(limit); err == nil && l > 0 && l <= 100 {
			params.Limit = l
		}
	}

	quotations, err := h.DB.GetQuotations(orgID, params)
	if err != nil {
		h.respondWithError(w, http.StatusInternalServerError, "Failed to retrieve quotations")
		return
	}

	h.respondWithJSON(w, http.StatusOK, quotations)
}

// GetQuotation retrieves a single quotation by ID
func (h *Handler) GetQuotation(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	quotationID := vars["quotationId"]

	orgID, ok := middleware.GetOrganizationIDFromContext(r.Context())
	if !ok {
		h.respondWithError(w, http.StatusUnauthorized, "Organization not found in context")
		return
	}

	quotation, err := h.DB.GetQuotationByID(orgID, quotationID)
	if err != nil {
		h.respondWithError(w, http.StatusNotFound, "Quotation not found")
		return
	}

	h.respondWithJSON(w, http.StatusOK, quotation)
}

// CreateQuotation creates a new quotation
func (h *Handler) CreateQuotation(w http.ResponseWriter, r *http.Request) {
	orgID, ok := middleware.GetOrganizationIDFromContext(r.Context())
	if !ok {
		h.respondWithError(w, http.StatusUnauthorized, "Organization not found in context")
		return
	}

	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		h.respondWithError(w, http.StatusUnauthorized, "User not found in context")
		return
	}

	var req models.CreateQuotationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.respondWithError(w, http.StatusBadRequest, "Invalid JSON payload")
		return
	}

	// Validate request
	if err := h.validateCreateQuotationRequest(req); err != nil {
		h.respondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	quotation, err := h.DB.CreateQuotation(orgID, userID, req)
	if err != nil {
		h.respondWithError(w, http.StatusInternalServerError, "Failed to create quotation")
		return
	}

	h.respondWithJSON(w, http.StatusCreated, quotation)
}

// UpdateQuotation updates an existing quotation
func (h *Handler) UpdateQuotation(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	quotationID := vars["quotationId"]

	orgID, ok := middleware.GetOrganizationIDFromContext(r.Context())
	if !ok {
		h.respondWithError(w, http.StatusUnauthorized, "Organization not found in context")
		return
	}

	var req models.UpdateQuotationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.respondWithError(w, http.StatusBadRequest, "Invalid JSON payload")
		return
	}

	// Validate request
	if err := h.validateUpdateQuotationRequest(req); err != nil {
		h.respondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	quotation, err := h.DB.UpdateQuotation(orgID, quotationID, req)
	if err != nil {
		h.respondWithError(w, http.StatusInternalServerError, "Failed to update quotation")
		return
	}

	h.respondWithJSON(w, http.StatusOK, quotation)
}

// DeleteQuotation deletes a quotation
func (h *Handler) DeleteQuotation(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	quotationID := vars["quotationId"]

	orgID, ok := middleware.GetOrganizationIDFromContext(r.Context())
	if !ok {
		h.respondWithError(w, http.StatusUnauthorized, "Organization not found in context")
		return
	}

	err := h.DB.DeleteQuotation(orgID, quotationID)
	if err != nil {
		h.respondWithError(w, http.StatusInternalServerError, "Failed to delete quotation")
		return
	}

	h.respondWithJSON(w, http.StatusOK, map[string]string{"message": "Quotation deleted successfully"})
}

// DuplicateQuotation creates a copy of an existing quotation
func (h *Handler) DuplicateQuotation(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	quotationID := vars["quotationId"]

	orgID, ok := middleware.GetOrganizationIDFromContext(r.Context())
	if !ok {
		h.respondWithError(w, http.StatusUnauthorized, "Organization not found in context")
		return
	}

	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		h.respondWithError(w, http.StatusUnauthorized, "User not found in context")
		return
	}

	quotation, err := h.DB.DuplicateQuotation(orgID, quotationID, userID)
	if err != nil {
		h.respondWithError(w, http.StatusInternalServerError, "Failed to duplicate quotation")
		return
	}

	h.respondWithJSON(w, http.StatusCreated, quotation)
}

// ConvertQuotationToOrder converts a quotation to a sales order
func (h *Handler) ConvertQuotationToOrder(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	quotationID := vars["quotationId"]

	_, ok := middleware.GetOrganizationIDFromContext(r.Context())
	if !ok {
		h.respondWithError(w, http.StatusUnauthorized, "Organization not found in context")
		return
	}

	var req models.ConvertToSalesOrderRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.respondWithError(w, http.StatusBadRequest, "Invalid JSON payload")
		return
	}

	// For now, return a placeholder response
	// This will be implemented when sales order functionality is added
	h.respondWithJSON(w, http.StatusNotImplemented, map[string]string{
		"message": "Sales order conversion not yet implemented",
		"quotation_id": quotationID,
	})
}

// UpdateQuotationStatus updates the status of a quotation
func (h *Handler) UpdateQuotationStatus(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	quotationID := vars["quotationId"]

	orgID, ok := middleware.GetOrganizationIDFromContext(r.Context())
	if !ok {
		h.respondWithError(w, http.StatusUnauthorized, "Organization not found in context")
		return
	}

	var req struct {
		Status string `json:"status"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.respondWithError(w, http.StatusBadRequest, "Invalid JSON payload")
		return
	}

	// Validate status
	validStatuses := []string{"pending", "accepted", "rejected", "expired"}
	isValid := false
	for _, status := range validStatuses {
		if req.Status == status {
			isValid = true
			break
		}
	}
	if !isValid {
		h.respondWithError(w, http.StatusBadRequest, "Invalid status")
		return
	}

	err := h.DB.UpdateQuotationStatus(orgID, quotationID, req.Status)
	if err != nil {
		h.respondWithError(w, http.StatusInternalServerError, "Failed to update quotation status")
		return
	}

	h.respondWithJSON(w, http.StatusOK, map[string]string{"message": "Quotation status updated successfully"})
}

// GenerateQuotationPDF generates a PDF for the quotation
func (h *Handler) GenerateQuotationPDF(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	quotationID := vars["quotationId"]

	orgID, ok := middleware.GetOrganizationIDFromContext(r.Context())
	if !ok {
		h.respondWithError(w, http.StatusUnauthorized, "Organization not found in context")
		return
	}

	// Get quotation with full details
	quotation, err := h.DB.GetQuotationByID(orgID, quotationID)
	if err != nil {
		h.respondWithError(w, http.StatusNotFound, "Quotation not found")
		return
	}

	// Generate PDF content
	pdfContent, err := h.generateQuotationPDFContent(quotation)
	if err != nil {
		h.respondWithError(w, http.StatusInternalServerError, "Failed to generate PDF")
		return
	}

	// Set headers for PDF download
	filename := fmt.Sprintf("quotation-%s.html", quotation.QuotationNumber)
	w.Header().Set("Content-Type", "text/html")
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=%s", filename))
	w.Header().Set("Content-Length", fmt.Sprintf("%d", len(pdfContent)))

	// Write PDF content
	w.WriteHeader(http.StatusOK)
	w.Write(pdfContent)
}

// Helper functions for validation

func (h *Handler) validateCreateQuotationRequest(req models.CreateQuotationRequest) error {
	if req.CustomerName == "" {
		return fmt.Errorf("customer name is required")
	}
	if len(req.LineItems) == 0 {
		return fmt.Errorf("at least one line item is required")
	}
	if req.ValidityPeriodDays <= 0 {
		return fmt.Errorf("validity period must be positive")
	}
	for i, item := range req.LineItems {
		if item.SKUID == "" {
			return fmt.Errorf("line item %d: SKU ID is required", i+1)
		}
		if item.Quantity <= 0 {
			return fmt.Errorf("line item %d: quantity must be positive", i+1)
		}
	}
	return nil
}

func (h *Handler) validateUpdateQuotationRequest(req models.UpdateQuotationRequest) error {
	if req.CustomerName == "" {
		return fmt.Errorf("customer name is required")
	}
	if len(req.LineItems) == 0 {
		return fmt.Errorf("at least one line item is required")
	}
	if req.ValidityPeriodDays <= 0 {
		return fmt.Errorf("validity period must be positive")
	}
	for i, item := range req.LineItems {
		if item.SKUID == "" {
			return fmt.Errorf("line item %d: SKU ID is required", i+1)
		}
		if item.Quantity <= 0 {
			return fmt.Errorf("line item %d: quantity must be positive", i+1)
		}
	}
	return nil
}

// generateQuotationPDFContent generates HTML content for quotation PDF
func (h *Handler) generateQuotationPDFContent(quotation *models.Quotation) ([]byte, error) {
	const quotationTemplate = `
<!DOCTYPE html>
<html>
<head>
	<meta charset="UTF-8">
	<title>Quotation {{.QuotationNumber}}</title>
	<style>
		body {
			font-family: Arial, sans-serif;
			margin: 0;
			padding: 20px;
			line-height: 1.4;
		}
		.header {
			text-align: center;
			margin-bottom: 30px;
			border-bottom: 2px solid #333;
			padding-bottom: 20px;
		}
		.company-name {
			font-size: 28px;
			font-weight: bold;
			color: #333;
		}
		.quotation-info {
			display: flex;
			justify-content: space-between;
			margin-bottom: 30px;
		}
		.quotation-details, .customer-details {
			width: 48%;
		}
		.section-title {
			font-size: 18px;
			font-weight: bold;
			margin-bottom: 10px;
			color: #333;
			border-bottom: 1px solid #ccc;
			padding-bottom: 5px;
		}
		.detail-row {
			margin-bottom: 8px;
		}
		.label {
			font-weight: bold;
			color: #555;
		}
		.line-items {
			margin-top: 30px;
		}
		table {
			width: 100%;
			border-collapse: collapse;
			margin-bottom: 20px;
		}
		th, td {
			border: 1px solid #ddd;
			padding: 12px;
			text-align: left;
		}
		th {
			background-color: #f5f5f5;
			font-weight: bold;
		}
		.number {
			text-align: right;
		}
		.totals {
			float: right;
			width: 300px;
			margin-top: 20px;
		}
		.total-row {
			display: flex;
			justify-content: space-between;
			padding: 8px 0;
		}
		.grand-total {
			font-weight: bold;
			font-size: 18px;
			border-top: 2px solid #333;
			margin-top: 10px;
			padding-top: 10px;
		}
		.terms {
			clear: both;
			margin-top: 50px;
		}
		.terms h3 {
			color: #333;
			margin-bottom: 10px;
		}
		.footer {
			margin-top: 50px;
			text-align: center;
			color: #666;
			font-size: 12px;
		}
		@media print {
			body { margin: 0; padding: 15px; }
		}
	</style>
</head>
<body>
	<div class="header">
		<div class="company-name">Flex ERP PoC</div>
		<h2>QUOTATION</h2>
	</div>

	<div class="quotation-info">
		<div class="quotation-details">
			<div class="section-title">Quotation Details</div>
			<div class="detail-row">
				<span class="label">Quotation Number:</span> {{.QuotationNumber}}
			</div>
			<div class="detail-row">
				<span class="label">Date:</span> {{.CreationDate.Format "January 2, 2006"}}
			</div>
			<div class="detail-row">
				<span class="label">Valid Until:</span> {{.ValidUntil.Format "January 2, 2006"}}
			</div>
			<div class="detail-row">
				<span class="label">Status:</span> {{title .Status}}
			</div>
			{{if .SalesPersonName}}
			<div class="detail-row">
				<span class="label">Sales Person:</span> {{.SalesPersonName}}
			</div>
			{{end}}
		</div>

		<div class="customer-details">
			<div class="section-title">Customer Information</div>
			<div class="detail-row">
				<span class="label">Name:</span> {{.CustomerName}}
			</div>
			{{if .CustomerEmail}}
			<div class="detail-row">
				<span class="label">Email:</span> {{.CustomerEmail}}
			</div>
			{{end}}
			{{if .CustomerPhone}}
			<div class="detail-row">
				<span class="label">Phone:</span> {{.CustomerPhone}}
			</div>
			{{end}}
			{{if .CustomerAddress}}
			<div class="detail-row">
				<span class="label">Address:</span> {{.CustomerAddress}}
			</div>
			{{end}}
		</div>
	</div>

	<div class="line-items">
		<div class="section-title">Items</div>
		<table>
			<thead>
				<tr>
					<th>Item</th>
					<th>Description</th>
					<th class="number">Quantity</th>
					<th class="number">Unit Price</th>
					<th class="number">Total</th>
				</tr>
			</thead>
			<tbody>
				{{range .LineItems}}
				<tr>
					<td>{{if .SKU}}{{.SKU.SKUCode}}{{end}}</td>
					<td>{{if .SKU}}{{.SKU.ProductName}}{{if .SKU.Description}}<br><small>{{.SKU.Description}}</small>{{end}}{{end}}</td>
					<td class="number">{{printf "%.2f" .Quantity}}</td>
					<td class="number">${{printf "%.2f" .FinalUnitPrice}}</td>
					<td class="number">${{printf "%.2f" .LineTotal}}</td>
				</tr>
				{{end}}
			</tbody>
		</table>
	</div>

	<div class="totals">
		<div class="total-row">
			<span class="label">Subtotal:</span>
			<span>${{printf "%.2f" .Subtotal}}</span>
		</div>
		<div class="total-row grand-total">
			<span class="label">Total:</span>
			<span>${{printf "%.2f" .TotalAmount}}</span>
		</div>
	</div>

	<div class="terms">
		{{if .DeliveryTerms}}
		<h3>Delivery Terms</h3>
		<p>{{.DeliveryTerms}}</p>
		{{end}}

		{{if .PaymentTerms}}
		<h3>Payment Terms</h3>
		<p>{{.PaymentTerms}}</p>
		{{end}}

		{{if .Notes}}
		<h3>Notes</h3>
		<p>{{.Notes}}</p>
		{{end}}
	</div>

	<div class="footer">
		<p>Thank you for your business!</p>
		<p>This quotation is valid until {{.ValidUntil.Format "January 2, 2006"}}</p>
	</div>
</body>
</html>`

	// Create template with custom functions
	tmpl, err := template.New("quotation").Funcs(template.FuncMap{
		"title": func(s string) string {
			if len(s) == 0 {
				return s
			}
			return string(s[0]-32) + s[1:] // Simple title case for first letter
		},
	}).Parse(quotationTemplate)
	if err != nil {
		return nil, fmt.Errorf("failed to parse template: %w", err)
	}

	// Execute template
	var buf bytes.Buffer
	if err := tmpl.Execute(&buf, quotation); err != nil {
		return nil, fmt.Errorf("failed to execute template: %w", err)
	}

	return buf.Bytes(), nil
}