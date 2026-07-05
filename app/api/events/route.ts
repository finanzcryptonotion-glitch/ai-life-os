import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, run } from '@/lib/db';

export async function GET() {
  const events = await query('SELECT * FROM events ORDER BY date ASC, time ASC');
  return NextResponse.json(events);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const result = await run(
    `INSERT INTO events (title, date, time, duration_minutes, category, location, notes) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [body.title, body.date, body.time || '', body.duration_minutes || 60, body.category || 'General', body.location || '', body.notes || '']
  );
  return NextResponse.json(await queryOne('SELECT * FROM events WHERE id = ?', [result.lastInsertRowid]));
}
