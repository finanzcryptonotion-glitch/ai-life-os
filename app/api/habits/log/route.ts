import { NextRequest, NextResponse } from 'next/server';
import { run } from '@/lib/db';

export async function POST(req: NextRequest) {
  const { habit_id, date, completed, notes } = await req.json();
  if (completed === false) {
    await run('DELETE FROM habit_logs WHERE habit_id = ? AND date = ?', [habit_id, date]);
    return NextResponse.json({ removed: true });
  }
  await run('DELETE FROM habit_logs WHERE habit_id = ? AND date = ?', [habit_id, date]);
  await run('INSERT INTO habit_logs (habit_id, date, completed, notes) VALUES (?, ?, 1, ?)', [habit_id, date, notes || '']);
  return NextResponse.json({ ok: true });
}
