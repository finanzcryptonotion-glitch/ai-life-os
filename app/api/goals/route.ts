import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  const db = getDb();
  const goals = db.prepare('SELECT * FROM goals ORDER BY priority DESC, created_at DESC').all();
  return NextResponse.json(goals);
}

export async function POST(req: NextRequest) {
  const db = getDb();
  const body = await req.json();
  const stmt = db.prepare(`INSERT INTO goals (title, description, category, target_date, status, priority, progress, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
  const result = stmt.run(body.title, body.description || '', body.category || 'Personal', body.target_date || null, body.status || 'active', body.priority || 'medium', body.progress || 0, body.notes || '');
  const goal = db.prepare('SELECT * FROM goals WHERE id = ?').get(result.lastInsertRowid);
  return NextResponse.json(goal);
}
