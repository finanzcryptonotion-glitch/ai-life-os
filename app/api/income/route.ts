import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  const db = getDb();
  const entries = db.prepare('SELECT * FROM income_entries ORDER BY date DESC').all();
  return NextResponse.json(entries);
}

export async function POST(req: NextRequest) {
  const db = getDb();
  const body = await req.json();
  const stmt = db.prepare(`INSERT INTO income_entries (amount, category, description, date) VALUES (?, ?, ?, ?)`);
  const result = stmt.run(body.amount, body.category, body.description || '', body.date);
  return NextResponse.json(db.prepare('SELECT * FROM income_entries WHERE id = ?').get(result.lastInsertRowid));
}
