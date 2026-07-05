import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  const db = getDb();
  return NextResponse.json(db.prepare('SELECT * FROM notes ORDER BY updated_at DESC').all());
}

export async function POST(req: NextRequest) {
  const db = getDb();
  const body = await req.json();
  const now = new Date().toISOString();
  const result = db.prepare(`INSERT INTO notes (title, body, created_at, updated_at) VALUES (?, ?, ?, ?)`).run(body.title, body.body || '', now, now);
  return NextResponse.json(db.prepare('SELECT * FROM notes WHERE id = ?').get(result.lastInsertRowid));
}
