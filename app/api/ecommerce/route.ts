import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, run } from '@/lib/db';

export async function GET() {
  return NextResponse.json(await query('SELECT * FROM ecommerce_entries ORDER BY date DESC'));
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const result = await run(
    `INSERT INTO ecommerce_entries (revenue, profit, ad_spend, orders, conversion_rate, notes, date) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [body.revenue || 0, body.profit || 0, body.ad_spend || 0, body.orders || 0, body.conversion_rate || 0, body.notes || '', body.date]
  );
  return NextResponse.json(await queryOne('SELECT * FROM ecommerce_entries WHERE id = ?', [result.lastInsertRowid]));
}
