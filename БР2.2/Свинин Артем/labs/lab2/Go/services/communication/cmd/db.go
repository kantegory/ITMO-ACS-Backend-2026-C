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
		`CREATE TABLE IF NOT EXISTS chats (
			id BIGSERIAL PRIMARY KEY,
			owner_id BIGINT NOT NULL,
			occupier_id BIGINT NOT NULL,
			property_id BIGINT NOT NULL,
			booking_id BIGINT NOT NULL,
			last_message_at TIMESTAMPTZ,
			created_at TIMESTAMPTZ NOT NULL,
			updated_at TIMESTAMPTZ NOT NULL
		)`,
		`CREATE UNIQUE INDEX IF NOT EXISTS chats_unique_pair_idx 
			ON chats(LEAST(owner_id, occupier_id), GREATEST(owner_id, occupier_id), property_id)`,
		`CREATE INDEX IF NOT EXISTS chats_owner_id_idx ON chats(owner_id)`,
		`CREATE INDEX IF NOT EXISTS chats_occupier_id_idx ON chats(occupier_id)`,
		`CREATE INDEX IF NOT EXISTS chats_property_id_idx ON chats(property_id)`,
		`CREATE INDEX IF NOT EXISTS chats_booking_id_idx ON chats(booking_id)`,
		`CREATE INDEX IF NOT EXISTS chats_created_at_idx ON chats(created_at)`,
		`CREATE TABLE IF NOT EXISTS messages (
			id BIGSERIAL PRIMARY KEY,
			chat_id BIGINT NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
			sender_id BIGINT NOT NULL,
			content TEXT NOT NULL,
			is_read BOOLEAN NOT NULL DEFAULT FALSE,
			read_at TIMESTAMPTZ,
			sent_at TIMESTAMPTZ NOT NULL,
			created_at TIMESTAMPTZ NOT NULL
		)`,
		`CREATE INDEX IF NOT EXISTS messages_chat_id_idx ON messages(chat_id)`,
		`CREATE INDEX IF NOT EXISTS messages_sender_id_idx ON messages(sender_id)`,
		`CREATE INDEX IF NOT EXISTS messages_is_read_idx ON messages(is_read)`,
		`CREATE INDEX IF NOT EXISTS messages_sent_at_idx ON messages(sent_at)`)
}
