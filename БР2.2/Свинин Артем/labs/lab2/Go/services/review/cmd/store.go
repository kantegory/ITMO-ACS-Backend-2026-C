package main

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"
	"time"
)

var errNotFound = errors.New("not found")

type reviewStore struct {
	db *sql.DB
}

type reviewListParams struct {
	PropertyID *int64
	ReviewerID *int64
	TargetType *reviewTargetType
	Page       int
	PageSize   int
}

func newReviewStore(db *sql.DB) *reviewStore {
	return &reviewStore{db: db}
}

func (s *reviewStore) create(rec reviewRecord) *reviewRecord {
	now := time.Now().UTC()
	rec.CreatedAt = now

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	const query = `
		INSERT INTO reviews (
			booking_id, property_id, reviewer_id, property_owner_id, occupier_id,
			target_type, rating, comment, response_text, response_date,
			created_at, updated_at
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
		RETURNING id
	`

	err := s.db.QueryRowContext(
		ctx, query,
		rec.BookingID,
		rec.PropertyID,
		rec.ReviewerID,
		rec.PropertyOwnerID,
		rec.OccupierID,
		rec.TargetType,
		rec.Rating,
		rec.Comment,
		rec.ResponseText,
		rec.ResponseDate,
		rec.CreatedAt,
		now,
	).Scan(&rec.ID)

	if err != nil {
		return nil
	}

	copy := rec
	return &copy
}

func (s *reviewStore) get(id int64) (*reviewRecord, bool) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	const query = `
		SELECT id, booking_id, property_id, reviewer_id, property_owner_id, occupier_id,
		       target_type, rating, comment, response_text, response_date, created_at
		FROM reviews
		WHERE id = $1
	`

	var rec reviewRecord
	err := s.db.QueryRowContext(ctx, query, id).Scan(
		&rec.ID,
		&rec.BookingID,
		&rec.PropertyID,
		&rec.ReviewerID,
		&rec.PropertyOwnerID,
		&rec.OccupierID,
		&rec.TargetType,
		&rec.Rating,
		&rec.Comment,
		&rec.ResponseText,
		&rec.ResponseDate,
		&rec.CreatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, false
	}
	if err != nil {
		return nil, false
	}

	copy := rec
	return &copy, true
}

func (s *reviewStore) update(id int64, mutator func(*reviewRecord) error) (*reviewRecord, error) {
	rec, ok := s.get(id)
	if !ok {
		return nil, errNotFound
	}

	if err := mutator(rec); err != nil {
		return nil, err
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	const query = `
		UPDATE reviews
		SET response_text = $1, response_date = $2, updated_at = $3
		WHERE id = $4
	`

	_, err := s.db.ExecContext(
		ctx, query,
		rec.ResponseText,
		rec.ResponseDate,
		time.Now().UTC(),
		id,
	)

	if err != nil {
		return nil, err
	}

	copy := *rec
	return &copy, nil
}

func (s *reviewStore) delete(id int64) bool {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	result, err := s.db.ExecContext(ctx, `DELETE FROM reviews WHERE id = $1`, id)
	if err != nil {
		return false
	}

	rowsAffected, err := result.RowsAffected()
	return err == nil && rowsAffected > 0
}

func (s *reviewStore) list(filter func(*reviewRecord) bool) []reviewRecord {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	const query = `
		SELECT id, booking_id, property_id, reviewer_id, property_owner_id, occupier_id,
		       target_type, rating, comment, response_text, response_date, created_at
		FROM reviews
		ORDER BY created_at DESC
		LIMIT 1000
	`

	rows, err := s.db.QueryContext(ctx, query)
	if err != nil {
		return []reviewRecord{}
	}
	defer rows.Close()

	var out []reviewRecord
	for rows.Next() {
		var rec reviewRecord
		if err := rows.Scan(
			&rec.ID,
			&rec.BookingID,
			&rec.PropertyID,
			&rec.ReviewerID,
			&rec.PropertyOwnerID,
			&rec.OccupierID,
			&rec.TargetType,
			&rec.Rating,
			&rec.Comment,
			&rec.ResponseText,
			&rec.ResponseDate,
			&rec.CreatedAt,
		); err != nil {
			continue
		}

		if filter != nil && !filter(&rec) {
			continue
		}
		out = append(out, rec)
	}

	return out
}

func (s *reviewStore) listPage(params reviewListParams) ([]reviewRecord, int, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	conditions := make([]string, 0, 3)
	args := make([]any, 0, 7)
	addCondition := func(expr string, value any) {
		args = append(args, value)
		conditions = append(conditions, fmt.Sprintf(expr, len(args)))
	}

	if params.PropertyID != nil {
		addCondition("property_id = $%d", *params.PropertyID)
	}
	if params.ReviewerID != nil {
		addCondition("reviewer_id = $%d", *params.ReviewerID)
	}
	if params.TargetType != nil {
		addCondition("target_type = $%d", *params.TargetType)
	}

	whereClause := ""
	if len(conditions) > 0 {
		whereClause = " WHERE " + strings.Join(conditions, " AND ")
	}

	countQuery := `SELECT COUNT(*) FROM reviews` + whereClause
	var total int
	if err := s.db.QueryRowContext(ctx, countQuery, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	limitArgIndex := len(args) + 1
	offsetArgIndex := len(args) + 2
	query := `
		SELECT id, booking_id, property_id, reviewer_id, property_owner_id, occupier_id,
		       target_type, rating, comment, response_text, response_date, created_at
		FROM reviews
	` + whereClause + fmt.Sprintf(" ORDER BY created_at DESC, id DESC LIMIT $%d OFFSET $%d", limitArgIndex, offsetArgIndex)

	offset := (params.Page - 1) * params.PageSize
	dataArgs := append(args, params.PageSize, offset)
	rows, err := s.db.QueryContext(ctx, query, dataArgs...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	out := make([]reviewRecord, 0, params.PageSize)
	for rows.Next() {
		var rec reviewRecord
		if err := rows.Scan(
			&rec.ID,
			&rec.BookingID,
			&rec.PropertyID,
			&rec.ReviewerID,
			&rec.PropertyOwnerID,
			&rec.OccupierID,
			&rec.TargetType,
			&rec.Rating,
			&rec.Comment,
			&rec.ResponseText,
			&rec.ResponseDate,
			&rec.CreatedAt,
		); err != nil {
			return nil, 0, err
		}
		out = append(out, rec)
	}
	if err := rows.Err(); err != nil {
		return nil, 0, err
	}

	return out, total, nil
}

func (s *reviewStore) hasDuplicate(bookingID int64, reviewerID int64, targetType reviewTargetType) bool {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	const query = `
		SELECT COUNT(*) > 0
		FROM reviews
		WHERE booking_id = $1
		  AND reviewer_id = $2
		  AND target_type = $3
	`

	var duplicate bool
	err := s.db.QueryRowContext(ctx, query, bookingID, reviewerID, targetType).Scan(&duplicate)
	if err != nil {
		return false
	}

	return duplicate
}
