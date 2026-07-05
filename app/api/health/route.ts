import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  const db = getDb();
  return NextResponse.json(db.prepare('SELECT * FROM health_entries ORDER BY date DESC').all());
}

export async function POST(req: NextRequest) {
  const db = getDb();
  const body = await req.json();
  const stmt = db.prepare(`INSERT INTO health_entries (date, workout, workout_duration, body_weight, sleep_hours, habits, daily_score, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
  const result = stmt.run(body.date, body.workout || '', body.workout_duration || 0, body.body_weight || null, body.sleep_hours || null, JSON.stringify(body.habits || []), body.daily_score || 0, body.notes || '');
  return NextResponse.json(db.prepare('SELECT * FROM health_entries WHERE id = ?').get(result.lastInsertRowid));
}
