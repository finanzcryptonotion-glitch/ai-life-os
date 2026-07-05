import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  const db = getDb();
  return NextResponse.json(db.prepare('SELECT * FROM ecommerce_entries ORDER BY date DESC').all());
}

export async function POST(req: NextRequest) {
  const db = getDb();
  const body = await req.json();
  const stmt = db.prepare(`INSERT INTO ecommerce_entries (revenue, profit, ad_spend, orders, conversion_rate, notes, date) VALUES (?, ?, ?, ?, ?, ?, ?)`);
  const result = stmt.run(body.revenue || 0, body.profit || 0, body.ad_spend || 0, body.orders || 0, body.conversion_rate || 0, body.notes || '', body.date);
  return NextResponse.json(db.prepare('SELECT * FROM ecommerce_entries WHERE id = ?').get(result.lastInsertRowid));
}
