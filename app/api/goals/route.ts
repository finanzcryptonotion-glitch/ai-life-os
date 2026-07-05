import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, run } from '@/lib/db';

export async function GET() {
  const goals = await query('SELECT * FROM goals ORDER BY priority DESC, created_at DESC');
  return NextResponse.json(goals);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const result = await run(
    `INSERT INTO goals (title, description, category, target_date, status, priority, progress, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [body.title, body.description || '', body.category || 'Personal', body.target_date || null, body.status || 'active', body.priority || 'medium', body.progress || 0, body.notes || '']
  );
  const goal = await queryOne('SELECT * FROM goals WHERE id = ?', [result.lastInsertRowid]);
  return NextResponse.json(goal);
}
