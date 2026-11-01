CREATE TYPE "STATUSES" AS ENUM (
	'PENDING',
	'CONFIRMED',
	'CANCELLED',
	'COMPLETED'
);

CREATE TABLE IF NOT EXISTS "bookings" (
	"id" UUID NOT NULL DEFAULT gen_random_uuid(),
	"user_id" UUID NOT NULL,
	"table_id" UUID NOT NULL,
	"time_slot_id" UUID NOT NULL,
	"booking_date" DATE NOT NULL,
	"guests_count" INTEGER NOT NULL,
	"status" "STATUSES" NOT NULL,
	"comment" TEXT,
	"created_at" TIMESTAMP,
	PRIMARY KEY("id")
);

CREATE UNIQUE INDEX booking_slot_unique ON bookings(table_id, booking_date, time_slot_id)
WHERE status IN ('PENDING', 'CONFIRMED');
