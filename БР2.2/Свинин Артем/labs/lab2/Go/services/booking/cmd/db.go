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
		`CREATE TABLE IF NOT EXISTS bookings (
			id BIGSERIAL PRIMARY KEY,
			property_id BIGINT NOT NULL,
			property_owner_id BIGINT NOT NULL,
			occupier_id BIGINT NOT NULL,
			start_date TIMESTAMPTZ NOT NULL,
			end_date TIMESTAMPTZ NOT NULL,
			total_price DOUBLE PRECISION NOT NULL,
			status TEXT NOT NULL,
			guests_count INT NOT NULL,
			special_request TEXT,
			cancellation_reason TEXT,
			created_at TIMESTAMPTZ NOT NULL,
			updated_at TIMESTAMPTZ NOT NULL
		)`,
		`CREATE INDEX IF NOT EXISTS bookings_property_id_idx ON bookings(property_id)`,
		`CREATE INDEX IF NOT EXISTS bookings_occupier_id_idx ON bookings(occupier_id)`,
		`CREATE INDEX IF NOT EXISTS bookings_property_owner_id_idx ON bookings(property_owner_id)`,
		`CREATE INDEX IF NOT EXISTS bookings_status_idx ON bookings(status)`,
		`CREATE INDEX IF NOT EXISTS bookings_created_at_idx ON bookings(created_at)`)
}
