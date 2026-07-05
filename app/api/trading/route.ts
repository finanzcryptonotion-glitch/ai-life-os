import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  const db = getDb();
  return NextResponse.json(db.prepare('SELECT * FROM trading_entries ORDER BY date DESC').all());
}

export async function POST(req: NextRequest) {
  const db = getDb();
  const body = await req.json();
  const stmt = db.prepare(`INSERT INTO trading_entries (account_balance, daily_pnl, win_rate, notes, journal, date) VALUES (?, ?, ?, ?, ?, ?)`);
  const result = stmt.run(body.account_balance || 0, body.daily_pnl || 0, body.win_rate || 0, body.notes || '', body.journal || '', body.date);
  return NextResponse.json(db.prepare('SELECT * FROM trading_entries WHERE id = ?').get(result.lastInsertRowid));
}
