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
		`CREATE TABLE IF NOT EXISTS profiles (
			user_id BIGINT PRIMARY KEY,
			first_name TEXT,
			last_name TEXT,
			middle_name TEXT,
			email TEXT,
			phone TEXT,
			updated_at TIMESTAMPTZ,
			initialized BOOLEAN NOT NULL DEFAULT FALSE
		)`,
		`CREATE UNIQUE INDEX IF NOT EXISTS profiles_email_lower_idx
			ON profiles (LOWER(email))
			WHERE email IS NOT NULL`,
		`CREATE TABLE IF NOT EXISTS favourites (
			id BIGSERIAL PRIMARY KEY,
			user_id BIGINT NOT NULL,
			property_id BIGINT NOT NULL,
			added_at TIMESTAMPTZ NOT NULL,
			UNIQUE (user_id, property_id)
		)`)
}
