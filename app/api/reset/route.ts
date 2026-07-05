import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST() {
  const db = getDb();
  db.prepare('DELETE FROM goals').run();
  db.prepare('DELETE FROM tasks').run();
  db.prepare('DELETE FROM events').run();
  db.prepare('DELETE FROM income_entries').run();
  db.prepare('DELETE FROM ecommerce_entries').run();
  db.prepare('DELETE FROM trading_entries').run();
  db.prepare('DELETE FROM health_entries').run();
  db.prepare('DELETE FROM notes').run();
  db.prepare("DELETE FROM sqlite_sequence WHERE name != 'settings'").run();
  db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('seeded', 'done')").run();
  return NextResponse.json({ ok: true });
}
