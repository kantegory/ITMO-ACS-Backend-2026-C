CREATE TABLE IF NOT EXISTS "cities" (
	"id" UUID NOT NULL DEFAULT gen_random_uuid(),
	"name" VARCHAR(100) NOT NULL UNIQUE,
	"country" VARCHAR(100),
	PRIMARY KEY("id")
);

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

CREATE TABLE IF NOT EXISTS "time_slots" (
	"id" UUID NOT NULL DEFAULT gen_random_uuid(),
	"restaurant_id" UUID NOT NULL,
	"start_time" TIME NOT NULL,
	"end_time" TIME NOT NULL,
	-- Обычно 60-120
	"duration_minutes" INTEGER,
	PRIMARY KEY("id")
);

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

CREATE TABLE IF NOT EXISTS "restaurant_photos" (
	"id" UUID NOT NULL DEFAULT gen_random_uuid(),
	"restaurant_id" UUID NOT NULL,
	"url" VARCHAR(255) NOT NULL,
	"is_cover" BOOLEAN DEFAULT false,
	PRIMARY KEY("id")
);

CREATE TABLE IF NOT EXISTS "cuisines" (
	"id" UUID NOT NULL,
	"name" VARCHAR(50) NOT NULL UNIQUE,
	"icon_url" VARCHAR(255),
	PRIMARY KEY("id")
);

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

CREATE TABLE IF NOT EXISTS "restaurant_cuisines" (
	"restaurant_id" UUID NOT NULL,
	"cuisine_id" UUID NOT NULL,
	PRIMARY KEY("restaurant_id", "cuisine_id")
);

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
ALTER TABLE "reviews"
ADD FOREIGN KEY("restaurant_id") REFERENCES "restaurants"("id")
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "restaurant_cuisines"
ADD FOREIGN KEY("restaurant_id") REFERENCES "restaurants"("id")
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "restaurant_cuisines"
ADD FOREIGN KEY("cuisine_id") REFERENCES "cuisines"("id")
ON UPDATE NO ACTION ON DELETE NO ACTION;

INSERT INTO cities (id,name,country) VALUES
('20000000-0000-4000-8000-000000000001','Санкт-Петербург','Россия');
INSERT INTO cuisines (id,name) VALUES
('30000000-0000-4000-8000-000000000001','Европейская'),
('30000000-0000-4000-8000-000000000002','Азиатская');
INSERT INTO restaurants (id,admin_id,city_id,name,address,description,avg_price,working_hours) VALUES
('40000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','Нева','Невский проспект, 10','Небольшой ресторан европейской кухни',1500,'{"daily":"12:00-23:00"}'),
('40000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','Волна','Садовая улица, 5','Ресторан азиатской кухни',3000,'{"daily":"12:00-23:00"}');
INSERT INTO restaurant_cuisines VALUES
('40000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001'),
('40000000-0000-4000-8000-000000000002','30000000-0000-4000-8000-000000000002');
INSERT INTO restaurant_tables (id,restaurant_id,number,seats,location) VALUES
('50000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000001',1,4,'Главный зал'),
('50000000-0000-4000-8000-000000000002','40000000-0000-4000-8000-000000000002',1,2,'Терраса');
INSERT INTO time_slots (id,restaurant_id,start_time,end_time,duration_minutes) VALUES
('60000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000001','18:00','20:00',120),
('60000000-0000-4000-8000-000000000002','40000000-0000-4000-8000-000000000002','18:00','20:00',120);
INSERT INTO menu_items (restaurant_id,name,price,category) VALUES
('40000000-0000-4000-8000-000000000001','Паста с грибами',65000,'Горячее'),
('40000000-0000-4000-8000-000000000002','Рамен',75000,'Супы');
INSERT INTO reviews (user_id,restaurant_id,rating,text) VALUES
('10000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000001',5,'Тестовый отзыв для карточки ресторана.');

INSERT INTO menu_items (id,restaurant_id,name,price,category) VALUES
('80000000-0000-4000-8000-000000000002','40000000-0000-4000-8000-000000000001','Овощной суп',35000,'Супы')
ON CONFLICT (id) DO NOTHING;
INSERT INTO reviews (id,user_id,restaurant_id,rating,text) VALUES
('70000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000001',3,'Второй тестовый отзыв для проверки сортировки.')
ON CONFLICT (id) DO NOTHING;
