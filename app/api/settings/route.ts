import { NextRequest, NextResponse } from 'next/server';
import { query, run } from '@/lib/db';

export async function GET() {
  const rows = await query('SELECT key, value FROM settings') as { key: string; value: string }[];
  return NextResponse.json(Object.fromEntries(rows.map(r => [r.key, r.value])));
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  for (const [key, value] of Object.entries(body)) {
    await run('DELETE FROM settings WHERE key = ?', [key]);
    await run('INSERT INTO settings (key, value) VALUES (?, ?)', [key, String(value)]);
  }
  return NextResponse.json({ ok: true });
}
