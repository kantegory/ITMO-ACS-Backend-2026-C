import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function initDb(): Promise<void> {
  await pool.query(`
    CREATE EXTENSION IF NOT EXISTS pgcrypto;
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      phone TEXT,
      password_hash TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('landlord', 'tenant', 'admin'))
    );
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      revoked_at TIMESTAMPTZ
    );
  `);
}

export { pool, initDb };
