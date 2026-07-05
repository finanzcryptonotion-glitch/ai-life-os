import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  const db = getDb();
  const habits = db.prepare('SELECT * FROM habits WHERE active = 1 ORDER BY created_at ASC').all();
  const today = new Date().toISOString().split('T')[0];
  const last30 = new Date(Date.now() - 30 * 864e5).toISOString().split('T')[0];
  const logs = db.prepare('SELECT * FROM habit_logs WHERE date >= ?').all(last30);
  return NextResponse.json({ habits, logs });
}

export async function POST(req: NextRequest) {
  const db = getDb();
  const body = await req.json();
  const r = db.prepare('INSERT INTO habits (title, description, frequency, target_days, color) VALUES (?, ?, ?, ?, ?)')
    .run(body.title, body.description || '', body.frequency || 'daily', body.target_days || 7, body.color || '#3b82f6');
  return NextResponse.json(db.prepare('SELECT * FROM habits WHERE id = ?').get(r.lastInsertRowid));
}
