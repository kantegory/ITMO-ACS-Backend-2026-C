package main

import (
	"database/sql"
	"time"

	"rental-platform/pkg/shared/dbutil"
)

func openDB() (*sql.DB, error) {
	return dbutil.Open(getenv("DATABASE_URL", ""), initSchema)
}

func initSchema(db *sql.DB) error {
	if err := dbutil.ExecStatements(db,
		`CREATE TABLE IF NOT EXISTS addresses (
			id BIGSERIAL PRIMARY KEY,
			country TEXT NOT NULL,
			city TEXT NOT NULL,
			district TEXT,
			house_number TEXT NOT NULL,
			apartment TEXT,
			postal_code TEXT,
			lat DOUBLE PRECISION,
			lon DOUBLE PRECISION,
			full_address TEXT
		)`,
		`CREATE TABLE IF NOT EXISTS properties (
			id BIGSERIAL PRIMARY KEY,
			owner_id BIGINT NOT NULL,
			type_id BIGINT NOT NULL,
			address_id BIGINT NOT NULL REFERENCES addresses(id),
			title TEXT NOT NULL,
			description TEXT NOT NULL,
			price_per_day DOUBLE PRECISION NOT NULL,
			price_per_month DOUBLE PRECISION NOT NULL,
			area_sqm INT NOT NULL,
			max_guests INT NOT NULL,
			bedrooms INT NOT NULL,
			bathrooms INT NOT NULL,
			is_available BOOLEAN NOT NULL,
			min_rent_days INT NOT NULL,
			max_rent_days INT NOT NULL,
			created_at TIMESTAMPTZ NOT NULL,
			updated_at TIMESTAMPTZ NOT NULL
		)`,
		`CREATE TABLE IF NOT EXISTS images (
			id BIGSERIAL PRIMARY KEY,
			property_id BIGINT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
			image_url TEXT NOT NULL,
			is_main BOOLEAN NOT NULL,
			created_at TIMESTAMPTZ NOT NULL
		)`,
		`CREATE TABLE IF NOT EXISTS facilities (
			id BIGINT PRIMARY KEY,
			type TEXT NOT NULL,
			created_at TEXT,
			updated_at TEXT
		)`,
		`CREATE TABLE IF NOT EXISTS property_facilities (
			property_id BIGINT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
			facility_id BIGINT NOT NULL REFERENCES facilities(id),
			PRIMARY KEY (property_id, facility_id)
		)`); err != nil {
		return err
	}

	return seedFacilities(db)
}

func seedFacilities(db *sql.DB) error {
	now := time.Now().UTC().Format(time.RFC3339)
	for _, f := range defaultFacilities {
		_, err := db.Exec(
			`INSERT INTO facilities (id, type, created_at, updated_at)
			 VALUES ($1, $2, $3, $4)
			 ON CONFLICT (id) DO NOTHING`,
			f.ID,
			f.Type,
			now,
			now,
		)
		if err != nil {
			return err
		}
	}
	return nil
}
