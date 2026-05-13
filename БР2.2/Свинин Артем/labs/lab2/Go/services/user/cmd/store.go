package main

import (
	"context"
	"database/sql"
	"fmt"
	"strings"
	"time"
)

type favouritesListParams struct {
	UserID   int64
	Page     int
	PageSize int
}

func newUserStore(db *sql.DB) *userStore {
	return &userStore{db: db}
}

func (s *userStore) getOrInitProfile(userID int64) *userProfile {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	const insertQuery = `
		INSERT INTO profiles (user_id, initialized)
		VALUES ($1, FALSE)
		ON CONFLICT (user_id) DO NOTHING
	`
	_, _ = s.db.ExecContext(ctx, insertQuery, userID)

	const selectQuery = `
		SELECT user_id, first_name, last_name, middle_name, email, phone, updated_at, initialized
		FROM profiles
		WHERE user_id = $1
	`

	var p userProfile
	var firstName, lastName, middleName, email, phone sql.NullString
	var updatedAt sql.NullTime
	if err := s.db.QueryRowContext(ctx, selectQuery, userID).Scan(
		&p.UserID,
		&firstName,
		&lastName,
		&middleName,
		&email,
		&phone,
		&updatedAt,
		&p.Initialized,
	); err != nil {
		return &userProfile{UserID: userID}
	}

	if firstName.Valid {
		p.FirstName = &firstName.String
	}
	if lastName.Valid {
		p.LastName = &lastName.String
	}
	if middleName.Valid {
		p.MiddleName = &middleName.String
	}
	if email.Valid {
		p.Email = &email.String
	}
	if phone.Valid {
		p.Phone = &phone.String
	}
	if updatedAt.Valid {
		p.UpdatedAt = updatedAt.Time
	}

	return &p
}

func (s *userStore) updateProfile(userID int64, req userUpdateRequest) {
	p := s.getOrInitProfile(userID)

	if req.FirstName != nil {
		v := strings.TrimSpace(*req.FirstName)
		p.FirstName = &v
	}

	if req.LastName != nil {
		v := strings.TrimSpace(*req.LastName)
		p.LastName = &v
	}

	if req.MiddleName != nil {
		v := strings.TrimSpace(*req.MiddleName)
		p.MiddleName = &v
	}

	if req.Email != nil {
		v := strings.ToLower(strings.TrimSpace(*req.Email))
		p.Email = &v
	}

	if req.Phone != nil {
		v := strings.TrimSpace(*req.Phone)
		p.Phone = &v
	}

	p.UpdatedAt = time.Now().UTC()
	p.Initialized = true

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	const query = `
		INSERT INTO profiles (
			user_id,
			first_name,
			last_name,
			middle_name,
			email,
			phone,
			updated_at,
			initialized
		)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
		ON CONFLICT (user_id)
		DO UPDATE SET
			first_name = EXCLUDED.first_name,
			last_name = EXCLUDED.last_name,
			middle_name = EXCLUDED.middle_name,
			email = EXCLUDED.email,
			phone = EXCLUDED.phone,
			updated_at = EXCLUDED.updated_at,
			initialized = EXCLUDED.initialized
	`

	_, _ = s.db.ExecContext(
		ctx,
		query,
		userID,
		toNullString(p.FirstName),
		toNullString(p.LastName),
		toNullString(p.MiddleName),
		toNullString(p.Email),
		toNullString(p.Phone),
		p.UpdatedAt,
		p.Initialized,
	)
}

func (s *userStore) isEmailAvailable(userID int64, email string) bool {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	const query = `
		SELECT COUNT(1)
		FROM profiles
		WHERE email IS NOT NULL AND LOWER(email) = LOWER($1) AND user_id <> $2
	`

	var count int
	if err := s.db.QueryRowContext(ctx, query, strings.TrimSpace(email), userID).Scan(&count); err != nil {
		return true
	}
	return count == 0
}

func (s *userStore) listFavouritesPage(params favouritesListParams) ([]favourite, int, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var total int
	if err := s.db.QueryRowContext(ctx, `SELECT COUNT(*) FROM favourites WHERE user_id = $1`, params.UserID).Scan(&total); err != nil {
		return nil, 0, err
	}

	offset := (params.Page - 1) * params.PageSize
	const query = `
		SELECT id, user_id, property_id, added_at
		FROM favourites
		WHERE user_id = $1
		ORDER BY id
		LIMIT $2 OFFSET $3
	`

	rows, err := s.db.QueryContext(ctx, query, params.UserID, params.PageSize, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	items := make([]favourite, 0)
	for rows.Next() {
		var fav favourite
		var addedAt time.Time
		if err := rows.Scan(&fav.ID, &fav.UserID, &fav.PropertyID, &addedAt); err != nil {
			continue
		}
		fav.AddedAt = addedAt.UTC().Format(time.RFC3339)
		fav.Property = &favObject{
			ID:          fav.PropertyID,
			Title:       fmt.Sprintf("Property #%d", fav.PropertyID),
			PricePerDay: 0,
		}
		items = append(items, fav)
	}

	return items, total, nil
}

func (s *userStore) addFavourite(userID int64, propertyID int64) (*favourite, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	const query = `
		INSERT INTO favourites (user_id, property_id, added_at)
		VALUES ($1, $2, $3)
		ON CONFLICT (user_id, property_id)
		DO NOTHING
		RETURNING id, added_at
	`

	var favID int64
	var addedAt time.Time
	err := s.db.QueryRowContext(ctx, query, userID, propertyID, time.Now().UTC()).Scan(&favID, &addedAt)
	if err != nil {
		return nil, fmt.Errorf("already exists")
	}

	fav := &favourite{
		ID:         favID,
		UserID:     userID,
		PropertyID: propertyID,
		AddedAt:    addedAt.UTC().Format(time.RFC3339),
		Property: &favObject{
			ID:          propertyID,
			Title:       fmt.Sprintf("Property #%d", propertyID),
			PricePerDay: 0,
		},
	}

	return fav, nil
}

func (s *userStore) deleteFavourite(userID int64, favID int64) bool {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	const query = `
		DELETE FROM favourites
		WHERE id = $1 AND user_id = $2
	`

	res, err := s.db.ExecContext(ctx, query, favID, userID)
	if err != nil {
		return false
	}
	rows, err := res.RowsAffected()
	if err != nil {
		return false
	}
	return rows > 0
}

func toNullString(value *string) sql.NullString {
	if value == nil {
		return sql.NullString{Valid: false}
	}
	return sql.NullString{String: *value, Valid: true}
}
