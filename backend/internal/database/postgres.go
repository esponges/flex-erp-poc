package database

import (
	"database/sql"
	"time"
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