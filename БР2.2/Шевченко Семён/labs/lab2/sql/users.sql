CREATE TYPE "roles" AS ENUM (
	'USER',
	'RESTAURANT_ADMIN',
	'SUPER_ADMIN'
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

INSERT INTO users (id,email,password_hash,name,role) VALUES
('10000000-0000-4000-8000-000000000001','admin@example.com','$2b$10$vGuwyk2u2o.4hV0JaouprOoRLeeXAy0WJcgW9.yxfC7rZgbuwm2/m','Администратор','RESTAURANT_ADMIN');
