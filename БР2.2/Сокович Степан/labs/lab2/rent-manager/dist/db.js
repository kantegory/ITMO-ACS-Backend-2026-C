"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
exports.initDb = initDb;
const pg_1 = require("pg");
const pool = new pg_1.Pool({ connectionString: process.env.DATABASE_URL });
exports.pool = pool;
async function initDb() {
    await pool.query(`
    CREATE EXTENSION IF NOT EXISTS pgcrypto;
    CREATE TABLE IF NOT EXISTS estate_types (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE
    );
    CREATE TABLE IF NOT EXISTS amenities (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE
    );
    CREATE TABLE IF NOT EXISTS listings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      owner_id UUID NOT NULL,
      type_id INT NOT NULL REFERENCES estate_types(id),
      name TEXT NOT NULL,
      price NUMERIC NOT NULL,
      deposit NUMERIC,
      description TEXT,
      city TEXT,
      address TEXT
    );
    CREATE TABLE IF NOT EXISTS listing_amenities (
      listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
      amenity_id INT NOT NULL REFERENCES amenities(id),
      PRIMARY KEY (listing_id, amenity_id)
    );
    CREATE TABLE IF NOT EXISTS listing_photos (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
      url TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS deals (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      listing_id UUID NOT NULL REFERENCES listings(id),
      landlord_id UUID NOT NULL,
      tenant_id UUID NOT NULL,
      start_time TIMESTAMPTZ,
      end_time TIMESTAMPTZ,
      status TEXT NOT NULL
    );
  `);
    const { rows: et } = await pool.query("SELECT COUNT(*)::int AS c FROM estate_types");
    if (et[0].c === 0) {
        await pool.query(`INSERT INTO estate_types (name) VALUES ('Квартира'), ('Дом'), ('Комната')`);
    }
    const { rows: am } = await pool.query("SELECT COUNT(*)::int AS c FROM amenities");
    if (am[0].c === 0) {
        await pool.query(`INSERT INTO amenities (name) VALUES
       ('Посудомоечная машина'), ('Стиральная машина'), ('Wi-Fi'),
       ('Кондиционер'), ('Парковка')`);
    }
}
