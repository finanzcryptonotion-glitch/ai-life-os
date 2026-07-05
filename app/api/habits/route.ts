import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, run } from '@/lib/db';

export async function GET() {
  const habits = await query('SELECT * FROM habits WHERE active = 1 ORDER BY created_at ASC');
  const last30 = new Date(Date.now() - 30 * 864e5).toISOString().split('T')[0];
  const logs = await query('SELECT * FROM habit_logs WHERE date >= ?', [last30]);
  return NextResponse.json({ habits, logs });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const result = await run(
    'INSERT INTO habits (title, description, frequency, target_days, color) VALUES (?, ?, ?, ?, ?)',
    [body.title, body.description || '', body.frequency || 'daily', body.target_days || 7, body.color || '#3b82f6']
  );
  return NextResponse.json(await queryOne('SELECT * FROM habits WHERE id = ?', [result.lastInsertRowid]));
}
