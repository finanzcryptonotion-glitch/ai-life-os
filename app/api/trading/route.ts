import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, run } from '@/lib/db';

export async function GET() {
  return NextResponse.json(await query('SELECT * FROM trading_entries ORDER BY date DESC'));
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const result = await run(
    `INSERT INTO trading_entries (account_balance, daily_pnl, win_rate, notes, journal, date) VALUES (?, ?, ?, ?, ?, ?)`,
    [body.account_balance || 0, body.daily_pnl || 0, body.win_rate || 0, body.notes || '', body.journal || '', body.date]
  );
  return NextResponse.json(await queryOne('SELECT * FROM trading_entries WHERE id = ?', [result.lastInsertRowid]));
}
