import { neon } from "@neondatabase/serverless";

/**
 * Database migration script.
 * Run with: npm run db:migrate
 *
 * Creates all tables needed for The Mirror.
 */
async function migrate() {
  const url = process.env.POSTGRES_URL;
  if (!url) {
    console.error("❌ POSTGRES_URL not set. Copy .env.example to .env.local and fill in your Neon URL.");
    process.exit(1);
  }

  const sql = neon(url);

  // Users table
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT UNIQUE NOT NULL,
      display_name TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  // Diary entries — raw writing from users
  await sql`
    CREATE TABLE IF NOT EXISTS diary_entries (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      c NUMERIC(4,3),
      lfh_dominant TEXT,
      ei INTEGER,
      ntr_density NUMERIC(3,2),
      delta_i INTEGER,
      bridges_found JSONB DEFAULT '[]',
      creature_tier TEXT,
      creature_archetype TEXT,
      read TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  // User profile — accumulated state
  await sql`
    CREATE TABLE IF NOT EXISTS user_profiles (
      user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      cumulative_ei INTEGER NOT NULL DEFAULT 0,
      all_bridges JSONB NOT NULL DEFAULT '[]',
      total_entries INTEGER NOT NULL DEFAULT 0,
      current_creature_tier TEXT NOT NULL DEFAULT 'animal_low',
      current_creature_archetype TEXT NOT NULL DEFAULT 'prey',
      current_lfh_dominant TEXT NOT NULL DEFAULT 'fear',
      current_c NUMERIC(4,3) NOT NULL DEFAULT 0.300,
      current_delta_i INTEGER NOT NULL DEFAULT 0,
      switch_pattern TEXT,
      switch_fired_count INTEGER NOT NULL DEFAULT 0,
      streak_days INTEGER NOT NULL DEFAULT 0,
      last_entry_date DATE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  // Switch events — when the user confirms they acted
  await sql`
    CREATE TABLE IF NOT EXISTS switch_events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      diary_entry_id UUID REFERENCES diary_entries(id) ON DELETE SET NULL,
      action_taken TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  // Indexes for performance
  await sql`CREATE INDEX IF NOT EXISTS idx_diary_user_date ON diary_entries(user_id, created_at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_switch_user ON switch_events(user_id, created_at DESC)`;

  console.log("✅ Migration complete — all tables created.");
}

migrate().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
