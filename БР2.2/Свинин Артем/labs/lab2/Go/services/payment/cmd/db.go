package main

import (
	"database/sql"

	"rental-platform/pkg/shared/dbutil"
)

func openDB() (*sql.DB, error) {
	return dbutil.Open(getenv("DATABASE_URL", ""), initSchema)
}

func initSchema(db *sql.DB) error {
	return dbutil.ExecStatements(db,
		`CREATE TABLE IF NOT EXISTS transactions (
			id BIGSERIAL PRIMARY KEY,
			booking_id BIGINT NOT NULL,
			payment_method TEXT NOT NULL,
			status TEXT NOT NULL,
			transaction_date TIMESTAMPTZ NOT NULL,
			payment_id TEXT NOT NULL UNIQUE,
			currency TEXT NOT NULL,
			amount DOUBLE PRECISION NOT NULL,
			fee_amount DOUBLE PRECISION NOT NULL DEFAULT 0,
			refunded_amount DOUBLE PRECISION,
			created_by BIGINT NOT NULL,
			created_at TIMESTAMPTZ NOT NULL,
			updated_at TIMESTAMPTZ NOT NULL
		)`,
		`CREATE INDEX IF NOT EXISTS transactions_booking_id_idx ON transactions(booking_id)`,
		`CREATE INDEX IF NOT EXISTS transactions_payment_id_idx ON transactions(payment_id)`,
		`CREATE INDEX IF NOT EXISTS transactions_status_idx ON transactions(status)`,
		`CREATE INDEX IF NOT EXISTS transactions_created_by_idx ON transactions(created_by)`,
		`CREATE INDEX IF NOT EXISTS transactions_created_at_idx ON transactions(created_at)`)
}
