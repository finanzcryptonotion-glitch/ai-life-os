import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_DIR = path.join(process.env.HOME || '', '.ai-life-os');
const DB_PATH = path.join(DB_DIR, 'data.db');

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema(db);
    seedIfEmpty(db);
  }
  return db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS goals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT DEFAULT 'Personal',
      target_date TEXT,
      status TEXT DEFAULT 'active',
      priority TEXT DEFAULT 'medium',
      progress INTEGER DEFAULT 0,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT DEFAULT 'General',
      priority TEXT DEFAULT 'medium',
      due_date TEXT,
      estimated_minutes INTEGER DEFAULT 60,
      goal_id INTEGER REFERENCES goals(id) ON DELETE SET NULL,
      status TEXT DEFAULT 'todo',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      date TEXT NOT NULL,
      time TEXT,
      duration_minutes INTEGER DEFAULT 60,
      category TEXT DEFAULT 'General',
      location TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS income_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      amount REAL NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      date TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS ecommerce_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      revenue REAL DEFAULT 0,
      profit REAL DEFAULT 0,
      ad_spend REAL DEFAULT 0,
      orders INTEGER DEFAULT 0,
      conversion_rate REAL DEFAULT 0,
      notes TEXT,
      date TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS trading_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_balance REAL DEFAULT 0,
      daily_pnl REAL DEFAULT 0,
      win_rate REAL DEFAULT 0,
      notes TEXT,
      journal TEXT,
      date TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS health_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      workout TEXT,
      workout_duration INTEGER DEFAULT 0,
      body_weight REAL,
      sleep_hours REAL,
      habits TEXT DEFAULT '[]',
      daily_score INTEGER DEFAULT 0,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      body TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS habits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      frequency TEXT DEFAULT 'daily',
      target_days INTEGER DEFAULT 7,
      color TEXT DEFAULT '#3b82f6',
      active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS habit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      habit_id INTEGER REFERENCES habits(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      completed INTEGER DEFAULT 1,
      notes TEXT,
      UNIQUE(habit_id, date)
    );

    CREATE TABLE IF NOT EXISTS budget_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT DEFAULT 'expense',
      monthly_budget REAL DEFAULT 0,
      color TEXT DEFAULT '#ef4444',
      icon TEXT DEFAULT '💰'
    );

    CREATE TABLE IF NOT EXISTS budget_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER REFERENCES budget_categories(id) ON DELETE SET NULL,
      amount REAL NOT NULL,
      description TEXT,
      date TEXT NOT NULL,
      type TEXT DEFAULT 'expense',
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);
}

function seedIfEmpty(db: Database.Database) {
  const count = (db.prepare('SELECT COUNT(*) as c FROM goals').get() as { c: number }).c;
  if (count > 0) return;
  const noSeed = db.prepare("SELECT value FROM settings WHERE key = 'seeded'").get() as { value: string } | undefined;
  if (noSeed?.value === 'done') return;

  const today = new Date();
  const fmt = (d: Date) => d.toISOString().split('T')[0];
  const daysAgo = (n: number) => { const d = new Date(today); d.setDate(d.getDate() - n); return fmt(d); };
  const daysAhead = (n: number) => { const d = new Date(today); d.setDate(d.getDate() + n); return fmt(d); };

  // Goals
  const insertGoal = db.prepare(`INSERT INTO goals (title, description, category, target_date, status, priority, progress, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
  const g1 = insertGoal.run('Nach Bangkok / Chiang Mai auswandern', 'Finanzielle Freiheit durch ortsunabhängiges Einkommen. Ziel: min. €5.000/Monat passiv, dann Umzug nach Südostasien.', 'Financial', '2026-12-31', 'active', 'high', 45, 'Fokus: E-Commerce + Trading skalieren');
  const g2 = insertGoal.run('AI Life OS auf €5.000 MRR', 'Eigenes SaaS-Produkt aufbauen und vermarkten. Zielgruppe: deutschsprachige Selbstständige.', 'Business', '2026-09-30', 'active', 'high', 20, '');
  const g3 = insertGoal.run('80kg bei 12% Körperfett', 'Muskelaufbau und Fettabbau gleichzeitig durch konsequentes Training 4x/Woche und Kalorientracking.', 'Fitness', '2026-10-01', 'active', 'medium', 55, 'Aktuell: 84kg');
  const g4 = insertGoal.run('NQ Futures Trading profitabel machen', 'Konsistent profitable Trading-Strategie basierend auf ICT/SMC entwickeln. Ziel: 70%+ Win Rate.', 'Financial', '2026-06-30', 'active', 'high', 60, 'London + NY Session');

  // Tasks
  const insertTask = db.prepare(`INSERT INTO tasks (title, description, category, priority, due_date, estimated_minutes, goal_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
  insertTask.run('Trading Journal für letzte Woche ausfüllen', '', 'Trading', 'high', fmt(today), 30, g4.lastInsertRowid, 'today');
  insertTask.run('Shopify Store – neue Produktbilder hochladen', '', 'E-Commerce', 'high', fmt(today), 60, g1.lastInsertRowid, 'in_progress');
  insertTask.run('AI Life OS – Dashboard Widgets finalisieren', '', 'Business', 'high', daysAhead(1), 120, g2.lastInsertRowid, 'in_progress');
  insertTask.run('Meta Ads Kampagne analysieren', 'ROAS prüfen und Budget anpassen', 'E-Commerce', 'medium', daysAhead(1), 45, g1.lastInsertRowid, 'todo');
  insertTask.run('Wöchentliches Review schreiben', '', 'Personal', 'medium', daysAhead(2), 30, null, 'todo');
  insertTask.run('Trainingsplan für nächsten Monat erstellen', '', 'Fitness', 'low', daysAhead(3), 45, g3.lastInsertRowid, 'todo');
  insertTask.run('Landing Page für AI Life OS erstellen', '', 'Business', 'high', daysAhead(5), 180, g2.lastInsertRowid, 'todo');
  insertTask.run('Morgendliche NQ-Analyse', 'London Session vorbereiten', 'Trading', 'high', daysAgo(1), 20, g4.lastInsertRowid, 'completed');
  insertTask.run('Shopify – Produktbeschreibungen optimieren', '', 'E-Commerce', 'medium', daysAgo(2), 90, g1.lastInsertRowid, 'completed');
  insertTask.run('Monatliche Finanzen überprüfen', '', 'Financial', 'high', daysAgo(3), 60, null, 'completed');

  // Events
  const insertEvent = db.prepare(`INSERT INTO events (title, date, time, duration_minutes, category, location, notes) VALUES (?, ?, ?, ?, ?, ?, ?)`);
  insertEvent.run('NQ Trading – London Session', fmt(today), '09:00', 120, 'Trading', 'Home Office', 'Fokus: ICT Order Blocks');
  insertEvent.run('Workout – Push Day', fmt(today), '17:00', 75, 'Health', 'Gym', 'Brust, Schulter, Trizeps');
  insertEvent.run('Wöchentliches Review', daysAhead(1), '10:00', 60, 'Personal', 'Home Office', '');
  insertEvent.run('Meta Ads Strategy Call', daysAhead(2), '14:00', 60, 'Business', 'Zoom', '');
  insertEvent.run('NQ Trading – NY Session', daysAhead(3), '15:30', 120, 'Trading', 'Home Office', '');
  insertEvent.run('Zahnarzt', daysAhead(5), '11:00', 45, 'Personal', 'München Innenstadt', '');

  // Income (last 30 days)
  const insertIncome = db.prepare(`INSERT INTO income_entries (amount, category, description, date) VALUES (?, ?, ?, ?)`);
  for (let i = 0; i < 30; i++) {
    const d = daysAgo(i);
    if (Math.random() > 0.3) insertIncome.run(Math.round(150 + Math.random() * 350), 'E-Commerce', 'Shopify Sales', d);
    if (i % 5 === 0) insertIncome.run(Math.round(200 + Math.random() * 600) * (Math.random() > 0.4 ? 1 : -1), 'Trading', 'NQ Futures', d);
    if (i === 1) insertIncome.run(2800, 'Remote Job', 'Monatsgehalt', d);
  }

  // E-Commerce (last 14 days)
  const insertEcom = db.prepare(`INSERT INTO ecommerce_entries (revenue, profit, ad_spend, orders, conversion_rate, notes, date) VALUES (?, ?, ?, ?, ?, ?, ?)`);
  for (let i = 0; i < 14; i++) {
    const rev = Math.round(300 + Math.random() * 400);
    const ads = Math.round(rev * 0.25);
    insertEcom.run(rev, Math.round(rev * 0.45 - ads), ads, Math.round(5 + Math.random() * 15), Math.round(20 + Math.random() * 15) / 10, '', daysAgo(i));
  }

  // Trading (last 14 days)
  const insertTrading = db.prepare(`INSERT INTO trading_entries (account_balance, daily_pnl, win_rate, notes, journal, date) VALUES (?, ?, ?, ?, ?, ?)`);
  let balance = 25000;
  for (let i = 13; i >= 0; i--) {
    const pnl = Math.round((Math.random() > 0.45 ? 1 : -1) * (100 + Math.random() * 400));
    balance += pnl;
    insertTrading.run(balance, pnl, Math.round(60 + Math.random() * 15) / 100, '', pnl > 0 ? 'Guter Trade, Setup war klar.' : 'Stop getriggert. Regel eingehalten.', daysAgo(i));
  }

  // Health (last 14 days)
  const insertHealth = db.prepare(`INSERT INTO health_entries (date, workout, workout_duration, body_weight, sleep_hours, habits, daily_score, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
  const workouts = ['Push Day', 'Pull Day', 'Leg Day', 'Upper Body', null, 'Full Body', null];
  let weight = 84.2;
  for (let i = 0; i < 14; i++) {
    weight -= Math.random() * 0.15;
    const wo = workouts[i % 7];
    const habits = JSON.stringify(['Wasser 3L', 'Protein-Ziel', wo ? 'Training' : null, 'Kein Zucker'].filter(Boolean));
    insertHealth.run(daysAgo(i), wo, wo ? Math.round(60 + Math.random() * 30) : 0, Math.round(weight * 10) / 10, Math.round(65 + Math.random() * 20) / 10, habits, Math.round(70 + Math.random() * 25), '');
  }

  // Notes
  const insertNote = db.prepare(`INSERT INTO notes (title, body, created_at, updated_at) VALUES (?, ?, ?, ?)`);
  insertNote.run('Bangkok Research', 'Viertel: Sukhumvit, Silom, Thonglor\nVisum: Thailand LTR Visa (Long Term Resident) – 10 Jahre\nKosten: ca. €1.500–2.500/Monat für guten Lifestyle\nInternet: Exzellent in Bangkok, coworking spaces überall', daysAgo(5), daysAgo(2));
  insertNote.run('ICT Trading Notizen', 'Order Blocks: Letzte bärische Kerze vor bullischer Bewegung\nFair Value Gaps: Imbalance im Preis\nLondon Session: 09:00–12:00 Uhr\nNY Session: 15:30–18:00 Uhr\nBeste Setups: 09:30 und 16:00', daysAgo(3), daysAgo(1));
  insertNote.run('AI Life OS – Feature Ideen', '- Widget Drag & Drop\n- Telegram Bot Integration\n- Automatische Wochenreview-Generierung\n- Broker API (OANDA, Interactive Brokers)\n- Shopify Webhook Integration', daysAgo(1), daysAgo(0));

  // Settings
  const insertSetting = db.prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`);
  insertSetting.run('ai_model', 'claude-3-5-sonnet-20241022');
  insertSetting.run('ai_api_key', '');
  insertSetting.run('user_name', 'Fritz');
  insertSetting.run('currency', 'EUR');
}
