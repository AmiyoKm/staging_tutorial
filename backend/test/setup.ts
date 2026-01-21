import postgres from 'postgres';
import { env } from '../src/config/env';

const sql = postgres(env.DATABASE_URL);

export async function setupTestDatabase() {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS priority (
      name VARCHAR(50) PRIMARY KEY
    );
  `;

  await sql`INSERT INTO priority (name) VALUES ('low'), ('medium'), ('high') ON CONFLICT DO NOTHING;`;

  await sql`
    CREATE TABLE IF NOT EXISTS todos (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id INTEGER NOT NULL REFERENCES users(id),
      title VARCHAR(255) NOT NULL,
      description TEXT,
      due_date TIMESTAMP,
      priority VARCHAR(50) DEFAULT 'medium' NOT NULL,
      completed BOOLEAN DEFAULT FALSE NOT NULL,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    );
  `;
}

export async function teardownTestDatabase() {
  await sql`DROP TABLE IF EXISTS todos CASCADE;`;
  await sql`DROP TABLE IF EXISTS priority CASCADE;`;
  await sql`DROP TABLE IF EXISTS users CASCADE;`;
  await sql.end();
}
