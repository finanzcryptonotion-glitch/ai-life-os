import { NextResponse } from 'next/server';
import { run } from '@/lib/db';

export async function POST() {
  await run('DELETE FROM goals');
  await run('DELETE FROM tasks');
  await run('DELETE FROM events');
  await run('DELETE FROM income_entries');
  await run('DELETE FROM ecommerce_entries');
  await run('DELETE FROM trading_entries');
  await run('DELETE FROM health_entries');
  await run('DELETE FROM notes');
  await run('DELETE FROM habits');
  await run('DELETE FROM habit_logs');
  await run('DELETE FROM budget_entries');
  await run('DELETE FROM budget_categories');
  await run("INSERT OR REPLACE INTO settings (key, value) VALUES ('seeded', 'done')");
  return NextResponse.json({ ok: true });
}
