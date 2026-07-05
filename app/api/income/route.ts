import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, run } from '@/lib/db';

export async function GET() {
  const entries = await query('SELECT * FROM income_entries ORDER BY date DESC');
  return NextResponse.json(entries);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const result = await run(
    `INSERT INTO income_entries (amount, category, description, date) VALUES (?, ?, ?, ?)`,
    [body.amount, body.category, body.description || '', body.date]
  );
  return NextResponse.json(await queryOne('SELECT * FROM income_entries WHERE id = ?', [result.lastInsertRowid]));
}
