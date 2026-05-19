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
		`CREATE TABLE IF NOT EXISTS reviews (
			id BIGSERIAL PRIMARY KEY,
			booking_id BIGINT NOT NULL,
			property_id BIGINT NOT NULL,
			reviewer_id BIGINT NOT NULL,
			property_owner_id BIGINT NOT NULL,
			occupier_id BIGINT NOT NULL,
			target_type TEXT NOT NULL,
			rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
			comment TEXT,
			response_text TEXT,
			response_date TIMESTAMPTZ,
			created_at TIMESTAMPTZ NOT NULL,
			updated_at TIMESTAMPTZ NOT NULL
		)`,
		`CREATE INDEX IF NOT EXISTS reviews_booking_id_idx ON reviews(booking_id)`,
		`CREATE INDEX IF NOT EXISTS reviews_property_id_idx ON reviews(property_id)`,
		`CREATE INDEX IF NOT EXISTS reviews_reviewer_id_idx ON reviews(reviewer_id)`,
		`CREATE INDEX IF NOT EXISTS reviews_property_owner_id_idx ON reviews(property_owner_id)`,
		`CREATE INDEX IF NOT EXISTS reviews_occupier_id_idx ON reviews(occupier_id)`,
		`CREATE INDEX IF NOT EXISTS reviews_target_type_idx ON reviews(target_type)`,
		`CREATE INDEX IF NOT EXISTS reviews_created_at_idx ON reviews(created_at)`)
}
