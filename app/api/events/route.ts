import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  const db = getDb();
  const events = db.prepare('SELECT * FROM events ORDER BY date ASC, time ASC').all();
  return NextResponse.json(events);
}

export async function POST(req: NextRequest) {
  const db = getDb();
  const body = await req.json();
  const stmt = db.prepare(`INSERT INTO events (title, date, time, duration_minutes, category, location, notes) VALUES (?, ?, ?, ?, ?, ?, ?)`);
  const result = stmt.run(body.title, body.date, body.time || '', body.duration_minutes || 60, body.category || 'General', body.location || '', body.notes || '');
  return NextResponse.json(db.prepare('SELECT * FROM events WHERE id = ?').get(result.lastInsertRowid));
}
