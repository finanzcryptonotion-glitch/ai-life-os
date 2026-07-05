import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(req: NextRequest) {
  const db = getDb();
  const { habit_id, date, completed, notes } = await req.json();
  if (completed === false) {
    db.prepare('DELETE FROM habit_logs WHERE habit_id = ? AND date = ?').run(habit_id, date);
    return NextResponse.json({ removed: true });
  }
  db.prepare('INSERT OR REPLACE INTO habit_logs (habit_id, date, completed, notes) VALUES (?, ?, 1, ?)')
    .run(habit_id, date, notes || '');
  return NextResponse.json({ ok: true });
}
