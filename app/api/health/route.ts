import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, run } from '@/lib/db';

export async function GET() {
  return NextResponse.json(await query('SELECT * FROM health_entries ORDER BY date DESC'));
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const result = await run(
    `INSERT INTO health_entries (date, workout, workout_duration, body_weight, sleep_hours, habits, daily_score, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [body.date, body.workout || '', body.workout_duration || 0, body.body_weight || null, body.sleep_hours || null, JSON.stringify(body.habits || []), body.daily_score || 0, body.notes || '']
  );
  return NextResponse.json(await queryOne('SELECT * FROM health_entries WHERE id = ?', [result.lastInsertRowid]));
}
