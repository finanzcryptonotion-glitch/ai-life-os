import { Pool } from 'pg';

// ── PostgreSQL ────────────────────────────────────────────────────────────────
let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    const connStr = process.env.DATABASE_URL;
    if (!connStr) throw new Error('DATABASE_URL environment variable is not set');
    pool = new Pool({ connectionString: connStr, ssl: { rejectUnauthorized: false } });
  }
  return pool;
}

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS goals (
    id SERIAL PRIMARY KEY, title TEXT NOT NULL, description TEXT,
    category TEXT DEFAULT 'Personal', target_date TEXT, status TEXT DEFAULT 'active',
    priority TEXT DEFAULT 'medium', progress INTEGER DEFAULT 0, notes TEXT,
    created_at TEXT DEFAULT (now()::text)
  );
  CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY, title TEXT NOT NULL, description TEXT,
    category TEXT DEFAULT 'General', priority TEXT DEFAULT 'medium',
    due_date TEXT, estimated_minutes INTEGER DEFAULT 60,
    goal_id INTEGER, status TEXT DEFAULT 'todo', created_at TEXT DEFAULT (now()::text)
  );
  CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY, title TEXT NOT NULL, date TEXT NOT NULL,
    time TEXT, duration_minutes INTEGER DEFAULT 60, category TEXT DEFAULT 'General',
    location TEXT, notes TEXT, created_at TEXT DEFAULT (now()::text)
  );
  CREATE TABLE IF NOT EXISTS income_entries (
    id SERIAL PRIMARY KEY, amount REAL NOT NULL, category TEXT NOT NULL,
    description TEXT, date TEXT NOT NULL, created_at TEXT DEFAULT (now()::text)
  );
  CREATE TABLE IF NOT EXISTS ecommerce_entries (
    id SERIAL PRIMARY KEY, revenue REAL DEFAULT 0, profit REAL DEFAULT 0,
    ad_spend REAL DEFAULT 0, orders INTEGER DEFAULT 0, conversion_rate REAL DEFAULT 0,
    notes TEXT, date TEXT NOT NULL, created_at TEXT DEFAULT (now()::text)
  );
  CREATE TABLE IF NOT EXISTS trading_entries (
    id SERIAL PRIMARY KEY, account_balance REAL DEFAULT 0, daily_pnl REAL DEFAULT 0,
    win_rate REAL DEFAULT 0, notes TEXT, journal TEXT, date TEXT NOT NULL,
    created_at TEXT DEFAULT (now()::text)
  );
  CREATE TABLE IF NOT EXISTS health_entries (
    id SERIAL PRIMARY KEY, date TEXT NOT NULL, workout TEXT,
    workout_duration INTEGER DEFAULT 0, body_weight REAL, sleep_hours REAL,
    habits TEXT DEFAULT '[]', daily_score INTEGER DEFAULT 0, notes TEXT,
    created_at TEXT DEFAULT (now()::text)
  );
  CREATE TABLE IF NOT EXISTS notes (
    id SERIAL PRIMARY KEY, title TEXT NOT NULL, body TEXT,
    created_at TEXT DEFAULT (now()::text), updated_at TEXT DEFAULT (now()::text)
  );
  CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT);
  CREATE TABLE IF NOT EXISTS habits (
    id SERIAL PRIMARY KEY, title TEXT NOT NULL, description TEXT,
    frequency TEXT DEFAULT 'daily', target_days INTEGER DEFAULT 7,
    color TEXT DEFAULT '#3b82f6', active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (now()::text)
  );
  CREATE TABLE IF NOT EXISTS habit_logs (
    id SERIAL PRIMARY KEY, habit_id INTEGER, date TEXT NOT NULL, completed INTEGER DEFAULT 1,
    notes TEXT, UNIQUE(habit_id, date)
  );
  CREATE TABLE IF NOT EXISTS budget_categories (
    id SERIAL PRIMARY KEY, name TEXT NOT NULL, type TEXT DEFAULT 'expense',
    monthly_budget REAL DEFAULT 0, color TEXT DEFAULT '#ef4444', icon TEXT DEFAULT '💰'
  );
  CREATE TABLE IF NOT EXISTS budget_entries (
    id SERIAL PRIMARY KEY, category_id INTEGER, amount REAL NOT NULL,
    description TEXT, date TEXT NOT NULL, type TEXT DEFAULT 'expense',
    created_at TEXT DEFAULT (now()::text)
  );
`;

let inited = false;
async function init() {
  if (inited) return;
  await getPool().query(SCHEMA);
  inited = true;
}

// ── Unified query interface ───────────────────────────────────────────────────

export type Row = Record<string, unknown>;

function toPostgres(sql: string, params: unknown[]): { sql: string; params: unknown[] } {
  let i = 0;
  const pgSql = sql
    .replace(/\?/g, () => `$${++i}`)
    .replace(/INSERT OR REPLACE/gi, 'INSERT')
    .replace(/INSERT OR IGNORE/gi, 'INSERT')
    .replace(/datetime\('now'\)/gi, 'now()::text');
  return { sql: pgSql, params };
}

export async function query(sql: string, params: unknown[] = []): Promise<Row[]> {
  await init();
  const pg = toPostgres(sql, params);
  const res = await getPool().query(pg.sql, pg.params);
  return res.rows;
}

export async function queryOne(sql: string, params: unknown[] = []): Promise<Row | null> {
  const rows = await query(sql, params);
  return rows[0] || null;
}

export async function run(sql: string, params: unknown[] = []): Promise<{ lastInsertRowid: number; changes: number }> {
  await init();
  const pg = toPostgres(sql, params);
  const isInsert = pg.sql.trim().toUpperCase().startsWith('INSERT');
  const finalSql = isInsert && !pg.sql.toUpperCase().includes('RETURNING')
    ? pg.sql + ' RETURNING id'
    : pg.sql;
  const res = await getPool().query(finalSql, pg.params);
  return { lastInsertRowid: res.rows[0]?.id || 0, changes: res.rowCount || 0 };
}
