package main

import (
	"context"
	"database/sql"
	"fmt"
	"strings"
	"time"

	"golang.org/x/crypto/bcrypt"
)

func newAuthStore(db *sql.DB) *authStore {
	return &authStore{db: db}
}

func (s *authStore) createUser(firstName string, lastName string, email string, password string) (*user, error) {
	normalizedEmail := strings.ToLower(strings.TrimSpace(email))

	passwordHash, err := hashPassword(password)
	if err != nil {
		return nil, fmt.Errorf("password hash error: %w", err)
	}

	now := time.Now().UTC()
	u := &user{
		FirstName:    strings.TrimSpace(firstName),
		LastName:     strings.TrimSpace(lastName),
		Email:        normalizedEmail,
		PasswordHash: passwordHash,
		Role:         "USER",
		IsVerified:   true,
		IsActive:     true,
		CreatedAt:    now,
		UpdatedAt:    now,
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	const query = `
		INSERT INTO users (
			first_name,
			last_name,
			email,
			password_hash,
			role,
			is_verified,
			is_active,
			created_at,
			updated_at
		)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
		RETURNING id, created_at, updated_at
	`

	err = s.db.QueryRowContext(
		ctx,
		query,
		u.FirstName,
		u.LastName,
		u.Email,
		u.PasswordHash,
		u.Role,
		u.IsVerified,
		u.IsActive,
		u.CreatedAt,
		u.UpdatedAt,
	).Scan(&u.ID, &u.CreatedAt, &u.UpdatedAt)
	if err != nil {
		if isUniqueViolation(err) {
			return nil, fmt.Errorf("email already exists")
		}
		return nil, err
	}

	return cloneUser(u), nil
}

func (s *authStore) getUserByEmail(email string) (*user, bool) {
	normalizedEmail := strings.ToLower(strings.TrimSpace(email))

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	const query = `
		SELECT id, first_name, last_name, email, password_hash, role, is_verified, is_active, created_at, updated_at
		FROM users
		WHERE email = $1
	`

	var u user
	err := s.db.QueryRowContext(ctx, query, normalizedEmail).Scan(
		&u.ID,
		&u.FirstName,
		&u.LastName,
		&u.Email,
		&u.PasswordHash,
		&u.Role,
		&u.IsVerified,
		&u.IsActive,
		&u.CreatedAt,
		&u.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, false
		}
		return nil, false
	}

	return cloneUser(&u), true
}

func (s *authStore) getUserByID(id int64) (*user, bool) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	const query = `
		SELECT id, first_name, last_name, email, password_hash, role, is_verified, is_active, created_at, updated_at
		FROM users
		WHERE id = $1
	`

	var u user
	err := s.db.QueryRowContext(ctx, query, id).Scan(
		&u.ID,
		&u.FirstName,
		&u.LastName,
		&u.Email,
		&u.PasswordHash,
		&u.Role,
		&u.IsVerified,
		&u.IsActive,
		&u.CreatedAt,
		&u.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, false
		}
		return nil, false
	}

	return cloneUser(&u), true
}

func (s *authStore) saveRefreshToken(token string, userID int64) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	const query = `
		INSERT INTO refresh_tokens (token, user_id, created_at)
		VALUES ($1, $2, $3)
		ON CONFLICT (token)
		DO UPDATE SET user_id = EXCLUDED.user_id, created_at = EXCLUDED.created_at
	`

	_, _ = s.db.ExecContext(ctx, query, token, userID, time.Now().UTC())
}

func (s *authStore) consumeRefreshToken(token string, userID int64) bool {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	const query = `
		DELETE FROM refresh_tokens
		WHERE token = $1 AND user_id = $2
	`

	res, err := s.db.ExecContext(ctx, query, token, userID)
	if err != nil {
		return false
	}

	rows, err := res.RowsAffected()
	if err != nil {
		return false
	}
	return rows > 0
}

func cloneUser(u *user) *user {
	if u == nil {
		return nil
	}

	copyUser := *u
	return &copyUser
}

func isUniqueViolation(err error) bool {
	if err == nil {
		return false
	}
	msg := strings.ToLower(err.Error())
	return strings.Contains(msg, "duplicate key") || strings.Contains(msg, "unique")
}

func hashPassword(password string) (string, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}

	return string(hash), nil
}

func verifyPassword(hash string, rawPassword string) bool {
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(rawPassword)) == nil
}
