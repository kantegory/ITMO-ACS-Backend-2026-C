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

type transactionStore struct {
	db *sql.DB
}

type transactionListParams struct {
	BookingID *int64
	Status    *transactionStatus
	StartDate *time.Time
	EndDate   *time.Time
	Page      int
	PageSize  int
}

func newTransactionStore(db *sql.DB) *transactionStore {
	return &transactionStore{db: db}
}

func (s *transactionStore) create(rec transactionRecord) *transactionRecord {
	now := time.Now().UTC()
	rec.TransactionDate = now

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	const query = `
		INSERT INTO transactions (
			booking_id, payment_method, status, transaction_date, payment_id,
			currency, amount, fee_amount, refunded_amount, created_by,
			created_at, updated_at
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
		RETURNING id
	`

	err := s.db.QueryRowContext(
		ctx, query,
		rec.BookingID,
		rec.PaymentMethod,
		rec.Status,
		rec.TransactionDate,
		rec.PaymentID,
		rec.Currency,
		rec.Amount,
		rec.FeeAmount,
		rec.RefundedAmount,
		rec.CreatedBy,
		now,
		now,
	).Scan(&rec.ID)

	if err != nil {
		return nil
	}

	copy := rec
	return &copy
}

func (s *transactionStore) get(id int64) (*transactionRecord, bool) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	const query = `
		SELECT id, booking_id, payment_method, status, transaction_date, payment_id,
		       currency, amount, fee_amount, refunded_amount, created_by
		FROM transactions
		WHERE id = $1
	`

	var rec transactionRecord
	err := s.db.QueryRowContext(ctx, query, id).Scan(
		&rec.ID,
		&rec.BookingID,
		&rec.PaymentMethod,
		&rec.Status,
		&rec.TransactionDate,
		&rec.PaymentID,
		&rec.Currency,
		&rec.Amount,
		&rec.FeeAmount,
		&rec.RefundedAmount,
		&rec.CreatedBy,
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

func (s *transactionStore) update(id int64, mutator func(*transactionRecord) error) (*transactionRecord, error) {
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
		UPDATE transactions
		SET status = $1, refunded_amount = $2, updated_at = $3
		WHERE id = $4
	`

	_, err := s.db.ExecContext(
		ctx, query,
		rec.Status,
		rec.RefundedAmount,
		time.Now().UTC(),
		id,
	)

	if err != nil {
		return nil, err
	}

	copy := *rec
	return &copy, nil
}

func (s *transactionStore) list(filter func(*transactionRecord) bool) []transactionRecord {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	const query = `
		SELECT id, booking_id, payment_method, status, transaction_date, payment_id,
		       currency, amount, fee_amount, refunded_amount, created_by
		FROM transactions
		ORDER BY created_at DESC
		LIMIT 1000
	`

	rows, err := s.db.QueryContext(ctx, query)
	if err != nil {
		return []transactionRecord{}
	}
	defer rows.Close()

	var out []transactionRecord
	for rows.Next() {
		var rec transactionRecord
		if err := rows.Scan(
			&rec.ID,
			&rec.BookingID,
			&rec.PaymentMethod,
			&rec.Status,
			&rec.TransactionDate,
			&rec.PaymentID,
			&rec.Currency,
			&rec.Amount,
			&rec.FeeAmount,
			&rec.RefundedAmount,
			&rec.CreatedBy,
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

func (s *transactionStore) listPage(params transactionListParams) ([]transactionRecord, int, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	conditions := make([]string, 0, 4)
	args := make([]any, 0, 8)
	addCondition := func(expr string, value any) {
		args = append(args, value)
		conditions = append(conditions, fmt.Sprintf(expr, len(args)))
	}

	if params.BookingID != nil {
		addCondition("booking_id = $%d", *params.BookingID)
	}
	if params.Status != nil {
		addCondition("status = $%d", *params.Status)
	}
	if params.StartDate != nil {
		addCondition("transaction_date >= $%d", *params.StartDate)
	}
	if params.EndDate != nil {
		addCondition("transaction_date <= $%d", *params.EndDate)
	}

	whereClause := ""
	if len(conditions) > 0 {
		whereClause = " WHERE " + strings.Join(conditions, " AND ")
	}

	countQuery := `SELECT COUNT(*) FROM transactions` + whereClause
	var total int
	if err := s.db.QueryRowContext(ctx, countQuery, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	limitArgIndex := len(args) + 1
	offsetArgIndex := len(args) + 2
	query := `
		SELECT id, booking_id, payment_method, status, transaction_date, payment_id,
		       currency, amount, fee_amount, refunded_amount, created_by
		FROM transactions
	` + whereClause + fmt.Sprintf(" ORDER BY transaction_date DESC, id DESC LIMIT $%d OFFSET $%d", limitArgIndex, offsetArgIndex)

	offset := (params.Page - 1) * params.PageSize
	dataArgs := append(args, params.PageSize, offset)
	rows, err := s.db.QueryContext(ctx, query, dataArgs...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	out := make([]transactionRecord, 0, params.PageSize)
	for rows.Next() {
		var rec transactionRecord
		if err := rows.Scan(
			&rec.ID,
			&rec.BookingID,
			&rec.PaymentMethod,
			&rec.Status,
			&rec.TransactionDate,
			&rec.PaymentID,
			&rec.Currency,
			&rec.Amount,
			&rec.FeeAmount,
			&rec.RefundedAmount,
			&rec.CreatedBy,
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

func (s *transactionStore) hasActiveByBooking(bookingID int64) bool {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	const query = `
		SELECT COUNT(*) > 0
		FROM transactions
		WHERE booking_id = $1
		  AND status IN ('PENDING', 'SUCCESS')
	`

	var active bool
	err := s.db.QueryRowContext(ctx, query, bookingID).Scan(&active)
	if err != nil {
		return false
	}

	return active
}

func (s *transactionStore) findByPaymentID(paymentID string) (*transactionRecord, bool) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	const query = `
		SELECT id, booking_id, payment_method, status, transaction_date, payment_id,
		       currency, amount, fee_amount, refunded_amount, created_by
		FROM transactions
		WHERE payment_id = $1
	`

	var rec transactionRecord
	err := s.db.QueryRowContext(ctx, query, paymentID).Scan(
		&rec.ID,
		&rec.BookingID,
		&rec.PaymentMethod,
		&rec.Status,
		&rec.TransactionDate,
		&rec.PaymentID,
		&rec.Currency,
		&rec.Amount,
		&rec.FeeAmount,
		&rec.RefundedAmount,
		&rec.CreatedBy,
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
