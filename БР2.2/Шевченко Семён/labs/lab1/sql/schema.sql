CREATE TYPE "roles" AS ENUM (
	'USER',
	'RESTAURANT_ADMIN',
	'SUPER_ADMIN'
);

CREATE TYPE "STATUSES" AS ENUM (
	'PENDING',
	'CONFIRMED',
	'CANCELLED',
	'COMPLETED'
);

CREATE TABLE IF NOT EXISTS "users" (
	"id" UUID NOT NULL DEFAULT gen_random_uuid(),
	"email" VARCHAR(255) NOT NULL UNIQUE,
	-- bcrypt hash
	"password_hash" VARCHAR(255) NOT NULL,
	"name" VARCHAR(100) NOT NULL,
	"phone" VARCHAR(20),
	"role" ROLES NOT NULL,
	"created_at" TIMESTAMP DEFAULT NOW(),
	"updated_at" TIMESTAMP,
	PRIMARY KEY("id")
);

COMMENT ON TABLE "users" IS 'Пользователи системы';
COMMENT ON COLUMN "users"."password_hash" IS 'bcrypt hash';

CREATE TABLE IF NOT EXISTS "cities" (
	"id" UUID NOT NULL DEFAULT gen_random_uuid(),
	"name" VARCHAR(100) NOT NULL UNIQUE,
	"country" VARCHAR(100),
	PRIMARY KEY("id")
);

COMMENT ON TABLE "cities" IS 'Города';

CREATE TABLE IF NOT EXISTS "restaurant_tables" (
	"id" UUID NOT NULL DEFAULT gen_random_uuid(),
	"restaurant_id" UUID NOT NULL,
	"number" INTEGER NOT NULL,
	"seats" INTEGER NOT NULL,
	-- Зал: терраса, главный
	"location" VARCHAR(50),
	"is_active" BOOLEAN NOT NULL DEFAULT TRUE,
	PRIMARY KEY("id")
);

COMMENT ON TABLE "restaurant_tables" IS 'Столики ресторана';
COMMENT ON COLUMN "restaurant_tables"."location" IS 'Зал: терраса, главный';

CREATE TABLE IF NOT EXISTS "menu_items" (
	"id" UUID NOT NULL DEFAULT gen_random_uuid(),
	"restaurant_id" UUID NOT NULL,
	"name" VARCHAR(150) NOT NULL,
	"description" TEXT,
	-- Цена в копейках
	"price" INTEGER NOT NULL,
	"category" VARCHAR(50),
	"photo_url" VARCHAR(255),
	"is_available" BOOLEAN DEFAULT true,
	PRIMARY KEY("id")
);

COMMENT ON TABLE "menu_items" IS 'Блюда меню';
COMMENT ON COLUMN "menu_items"."price" IS 'Цена в копейках';

CREATE TABLE IF NOT EXISTS "time_slots" (
	"id" UUID NOT NULL DEFAULT gen_random_uuid(),
	"restaurant_id" UUID NOT NULL,
	"start_time" TIME NOT NULL,
	"end_time" TIME NOT NULL,
	-- Обычно 60-120
	"duration_minutes" INTEGER,
	PRIMARY KEY("id")
);

COMMENT ON TABLE "time_slots" IS 'Слоты времени для бронирования';
COMMENT ON COLUMN "time_slots"."duration_minutes" IS 'Обычно 60-120';

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

COMMENT ON TABLE "bookings" IS 'Бронирования';

CREATE TABLE IF NOT EXISTS "reviews" (
	"id" UUID NOT NULL DEFAULT gen_random_uuid(),
	"user_id" UUID NOT NULL,
	"restaurant_id" UUID NOT NULL,
	-- 1:1 с бронированием
	"booking_id" UUID UNIQUE,
	-- CHECK (rating >= 1 AND rating <= 5)
	"rating" INTEGER NOT NULL,
	"text" TEXT,
	"created_at" TIMESTAMP DEFAULT NOW(),
	PRIMARY KEY("id")
);

COMMENT ON TABLE "reviews" IS 'Отзывы';
COMMENT ON COLUMN "reviews"."booking_id" IS '1:1 с бронированием';
COMMENT ON COLUMN "reviews"."rating" IS 'CHECK (rating >= 1 AND rating <= 5)';

CREATE TABLE IF NOT EXISTS "restaurant_photos" (
	"id" UUID NOT NULL DEFAULT gen_random_uuid(),
	"restaurant_id" UUID NOT NULL,
	"url" VARCHAR(255) NOT NULL,
	"is_cover" BOOLEAN DEFAULT false,
	PRIMARY KEY("id")
);

COMMENT ON TABLE "restaurant_photos" IS 'Фотографии ресторанов';

CREATE TABLE IF NOT EXISTS "cuisines" (
	"id" UUID NOT NULL,
	"name" VARCHAR(50) NOT NULL UNIQUE,
	"icon_url" VARCHAR(255),
	PRIMARY KEY("id")
);

COMMENT ON TABLE "cuisines" IS 'Тип кухни';

CREATE TABLE IF NOT EXISTS "restaurants" (
	"id" UUID NOT NULL,
	"admin_id" UUID NOT NULL,
	"city_id" UUID NOT NULL,
	"name" VARCHAR(200) NOT NULL,
	"description" TEXT,
	"address" VARCHAR(255) NOT NULL,
	"latitude" DECIMAL(10,8),
	"longitude" DECIMAL(11,8),
	"avg_price" INTEGER,
	"rating" DECIMAL(3,2) DEFAULT '0',
	"working_hours" JSONB,
	"created_at" TIMESTAMP,
	"updated_at" TIMESTAMP,
	PRIMARY KEY("id")
);

COMMENT ON TABLE "restaurants" IS 'Ресторан';

CREATE TABLE IF NOT EXISTS "restaurant_cuisines" (
	"restaurant_id" UUID NOT NULL,
	"cuisine_id" UUID NOT NULL,
	PRIMARY KEY("restaurant_id", "cuisine_id")
);

COMMENT ON TABLE "restaurant_cuisines" IS 'Связующая таблица M:N между ресторанами и кухнями';

ALTER TABLE "restaurants"
ADD FOREIGN KEY("admin_id") REFERENCES "users"("id")
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "restaurants"
ADD FOREIGN KEY("city_id") REFERENCES "cities"("id")
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "restaurant_tables"
ADD FOREIGN KEY("restaurant_id") REFERENCES "restaurants"("id")
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "menu_items"
ADD FOREIGN KEY("restaurant_id") REFERENCES "restaurants"("id")
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "time_slots"
ADD FOREIGN KEY("restaurant_id") REFERENCES "restaurants"("id")
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "restaurant_photos"
ADD FOREIGN KEY("restaurant_id") REFERENCES "restaurants"("id")
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "bookings"
ADD FOREIGN KEY("user_id") REFERENCES "users"("id")
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "bookings"
ADD FOREIGN KEY("table_id") REFERENCES "restaurant_tables"("id")
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "bookings"
ADD FOREIGN KEY("time_slot_id") REFERENCES "time_slots"("id")
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "reviews"
ADD FOREIGN KEY("user_id") REFERENCES "users"("id")
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "reviews"
ADD FOREIGN KEY("restaurant_id") REFERENCES "restaurants"("id")
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "reviews"
ADD FOREIGN KEY("booking_id") REFERENCES "bookings"("id")
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "restaurant_cuisines"
ADD FOREIGN KEY("restaurant_id") REFERENCES "restaurants"("id")
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "restaurant_cuisines"
ADD FOREIGN KEY("cuisine_id") REFERENCES "cuisines"("id")
ON UPDATE NO ACTION ON DELETE NO ACTION;
-- Один столик нельзя забронировать дважды на одну дату и слот.
CREATE UNIQUE INDEX booking_slot_unique ON bookings(table_id, booking_date, time_slot_id)
WHERE status IN ('PENDING', 'CONFIRMED');
