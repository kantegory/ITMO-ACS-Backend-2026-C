import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function initDb(): Promise<void> {
  await pool.query(`
    CREATE EXTENSION IF NOT EXISTS pgcrypto;
    CREATE TABLE IF NOT EXISTS chats (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      user_a_id UUID NOT NULL,
      user_b_id UUID NOT NULL,
      listing_id UUID,
      deal_id UUID
    );
    CREATE TABLE IF NOT EXISTS messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
      sender_id UUID NOT NULL,
      text TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'sent',
      edited BOOLEAN NOT NULL DEFAULT false
    );
    CREATE TABLE IF NOT EXISTS reviews (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      author_id UUID NOT NULL,
      target_id UUID NOT NULL,
      rating INT NOT NULL,
      text TEXT,
      deal_id UUID,
      listing_id UUID
    );
  `);
}

export { pool, initDb };
