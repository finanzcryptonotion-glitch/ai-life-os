import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, run } from '@/lib/db';

export async function GET() {
  return NextResponse.json(await query('SELECT * FROM notes ORDER BY updated_at DESC'));
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const now = new Date().toISOString();
  const result = await run(
    `INSERT INTO notes (title, body, created_at, updated_at) VALUES (?, ?, ?, ?)`,
    [body.title, body.body || '', now, now]
  );
  return NextResponse.json(await queryOne('SELECT * FROM notes WHERE id = ?', [result.lastInsertRowid]));
}
