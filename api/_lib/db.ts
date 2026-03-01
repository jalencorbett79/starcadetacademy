import { createPool, type Pool, type QueryResult } from '@vercel/postgres';

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    pool = createPool({
      connectionString: process.env.POSTGRES_URL ?? process.env.DATABASE_URL,
    });
  }
  return pool;
}

export async function query(text: string, params?: unknown[]): Promise<QueryResult> {
  const client = getPool();
  return client.query(text, params);
}

// Initialize tables if they don't exist
export async function initDB(): Promise<void> {
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(20) DEFAULT 'parent' NOT NULL,
      verified BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS child_profiles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      parent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(100) NOT NULL,
      age SMALLINT NOT NULL CHECK (age BETWEEN 3 AND 5),
      avatar_color VARCHAR(7) DEFAULT '#00d4ff',
      language VARCHAR(2) DEFAULT 'en',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS xp_progress (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      child_id UUID UNIQUE NOT NULL REFERENCES child_profiles(id) ON DELETE CASCADE,
      xp INTEGER DEFAULT 0,
      level INTEGER DEFAULT 1,
      rank VARCHAR(50) DEFAULT 'beginnerExplorer',
      missions_completed INTEGER DEFAULT 0,
      streak_days INTEGER DEFAULT 0,
      last_active_date DATE,
      skill_letter_recognition SMALLINT DEFAULT 0,
      skill_phonics SMALLINT DEFAULT 0,
      skill_sight_words SMALLINT DEFAULT 0,
      skill_counting SMALLINT DEFAULT 0,
      skill_addition SMALLINT DEFAULT 0,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS activity_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      child_id UUID NOT NULL REFERENCES child_profiles(id) ON DELETE CASCADE,
      activity_type VARCHAR(20) NOT NULL,
      module VARCHAR(100) NOT NULL,
      score INTEGER DEFAULT 0,
      xp_earned INTEGER DEFAULT 0,
      time_spent_seconds INTEGER DEFAULT 0,
      language VARCHAR(2) DEFAULT 'en',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);
}

export default { query, initDB };
