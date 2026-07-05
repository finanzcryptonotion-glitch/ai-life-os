import { NextResponse } from 'next/server';
import { run } from '@/lib/db';

export async function POST() {
  const tables = ['goals', 'tasks', 'events', 'income_entries', 'ecommerce_entries',
    'trading_entries', 'health_entries', 'notes', 'habits', 'habit_logs',
    'budget_entries', 'budget_categories'];
  for (const t of tables) {
    await run(`DELETE FROM ${t}`);
  }
  await run('DELETE FROM settings WHERE key = ?', ['seeded']);
  await run('INSERT INTO settings (key, value) VALUES (?, ?)', ['seeded', 'done']);
  return NextResponse.json({ ok: true });
}
