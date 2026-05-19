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

type bookingStore struct {
	db *sql.DB
}

type bookingListParams struct {
	PropertyID *int64
	Status     *bookingStatus
	Statuses   []bookingStatus
	StartDate  *time.Time
	EndDate    *time.Time
	OverlapFrom *time.Time
	OverlapTo   *time.Time
	OccupierID *int64
	OwnerID    *int64
	Page       int
	PageSize   int
}

func newBookingStore(db *sql.DB) *bookingStore {
	return &bookingStore{db: db}
}

func (s *bookingStore) create(rec bookingRecord) *bookingRecord {
	now := time.Now().UTC()
	rec.CreatedAt = now
	rec.UpdatedAt = now

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	const query = `
		INSERT INTO bookings (
			property_id, property_owner_id, occupier_id, start_date, end_date,
			total_price, status, guests_count, special_request, cancellation_reason,
			created_at, updated_at
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
		RETURNING id
	`

	err := s.db.QueryRowContext(
		ctx, query,
		rec.PropertyID,
		rec.PropertyOwnerID,
		rec.OccupierID,
		rec.StartDate,
		rec.EndDate,
		rec.TotalPrice,
		rec.Status,
		rec.GuestsCount,
		rec.SpecialRequest,
		rec.CancellationReason,
		rec.CreatedAt,
		rec.UpdatedAt,
	).Scan(&rec.ID)

	if err != nil {
		return nil
	}

	copy := rec
	return &copy
}

func (s *bookingStore) get(id int64) (*bookingRecord, bool) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	const query = `
		SELECT id, property_id, property_owner_id, occupier_id, start_date, end_date,
		       total_price, status, guests_count, special_request, cancellation_reason,
		       created_at, updated_at
		FROM bookings
		WHERE id = $1
	`

	var rec bookingRecord
	err := s.db.QueryRowContext(ctx, query, id).Scan(
		&rec.ID,
		&rec.PropertyID,
		&rec.PropertyOwnerID,
		&rec.OccupierID,
		&rec.StartDate,
		&rec.EndDate,
		&rec.TotalPrice,
		&rec.Status,
		&rec.GuestsCount,
		&rec.SpecialRequest,
		&rec.CancellationReason,
		&rec.CreatedAt,
		&rec.UpdatedAt,
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

func (s *bookingStore) update(id int64, mutator func(*bookingRecord) error) (*bookingRecord, error) {
	// Get existing record
	rec, ok := s.get(id)
	if !ok {
		return nil, errNotFound
	}

	// Apply mutations
	if err := mutator(rec); err != nil {
		return nil, err
	}

	rec.UpdatedAt = time.Now().UTC()

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	const query = `
		UPDATE bookings
		SET status = $1, special_request = $2, cancellation_reason = $3, updated_at = $4
		WHERE id = $5
	`

	_, err := s.db.ExecContext(
		ctx, query,
		rec.Status,
		rec.SpecialRequest,
		rec.CancellationReason,
		rec.UpdatedAt,
		id,
	)

	if err != nil {
		return nil, err
	}

	copy := *rec
	return &copy, nil
}

func (s *bookingStore) delete(id int64) bool {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	result, err := s.db.ExecContext(ctx, `DELETE FROM bookings WHERE id = $1`, id)
	if err != nil {
		return false
	}

	rowsAffected, err := result.RowsAffected()
	return err == nil && rowsAffected > 0
}

func (s *bookingStore) listPage(params bookingListParams) ([]bookingRecord, int, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	conditions := make([]string, 0, 6)
	args := make([]any, 0, 8)
	addCondition := func(expr string, value any) {
		args = append(args, value)
		conditions = append(conditions, fmt.Sprintf(expr, len(args)))
	}

	if params.PropertyID != nil {
		addCondition("property_id = $%d", *params.PropertyID)
	}
	if params.Status != nil {
		addCondition("status = $%d", *params.Status)
	}
	if len(params.Statuses) > 0 {
		placeholders := make([]string, 0, len(params.Statuses))
		for _, status := range params.Statuses {
			args = append(args, status)
			placeholders = append(placeholders, fmt.Sprintf("$%d", len(args)))
		}
		conditions = append(conditions, "status IN ("+strings.Join(placeholders, ", ")+")")
	}
	if params.StartDate != nil {
		addCondition("start_date >= $%d", *params.StartDate)
	}
	if params.EndDate != nil {
		addCondition("end_date <= $%d", *params.EndDate)
	}
	if params.OverlapFrom != nil {
		addCondition("end_date >= $%d", *params.OverlapFrom)
	}
	if params.OverlapTo != nil {
		addCondition("start_date <= $%d", *params.OverlapTo)
	}
	if params.OccupierID != nil {
		addCondition("occupier_id = $%d", *params.OccupierID)
	}
	if params.OwnerID != nil {
		addCondition("property_owner_id = $%d", *params.OwnerID)
	}

	whereClause := ""
	if len(conditions) > 0 {
		whereClause = " WHERE " + strings.Join(conditions, " AND ")
	}

	countQuery := `SELECT COUNT(*) FROM bookings` + whereClause
	var total int
	if err := s.db.QueryRowContext(ctx, countQuery, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	limitArgIndex := len(args) + 1
	offsetArgIndex := len(args) + 2
	query := `
		SELECT id, property_id, property_owner_id, occupier_id, start_date, end_date,
		       total_price, status, guests_count, special_request, cancellation_reason,
		       created_at, updated_at
		FROM bookings
	` + whereClause + fmt.Sprintf(" ORDER BY created_at DESC, id DESC LIMIT $%d OFFSET $%d", limitArgIndex, offsetArgIndex)

	offset := (params.Page - 1) * params.PageSize
	dataArgs := append(args, params.PageSize, offset)
	rows, err := s.db.QueryContext(ctx, query, dataArgs...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	out := make([]bookingRecord, 0, params.PageSize)
	for rows.Next() {
		var rec bookingRecord
		if err := rows.Scan(
			&rec.ID,
			&rec.PropertyID,
			&rec.PropertyOwnerID,
			&rec.OccupierID,
			&rec.StartDate,
			&rec.EndDate,
			&rec.TotalPrice,
			&rec.Status,
			&rec.GuestsCount,
			&rec.SpecialRequest,
			&rec.CancellationReason,
			&rec.CreatedAt,
			&rec.UpdatedAt,
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

func (s *bookingStore) hasDateConflict(propertyID int64, startDate time.Time, endDate time.Time, excludeID int64) bool {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	const query = `
		SELECT COUNT(*) > 0
		FROM bookings
		WHERE property_id = $1
		  AND id != $2
		  AND status NOT IN ('CANCELLED', 'REJECTED')
		  AND start_date < $3
		  AND end_date > $4
	`

	var conflict bool
	err := s.db.QueryRowContext(ctx, query, propertyID, excludeID, endDate, startDate).Scan(&conflict)
	if err != nil {
		return false
	}

	return conflict
}
