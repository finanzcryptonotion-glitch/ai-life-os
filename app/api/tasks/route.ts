import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  const db = getDb();
  const tasks = db.prepare('SELECT * FROM tasks ORDER BY due_date ASC, priority DESC').all();
  return NextResponse.json(tasks);
}

export async function POST(req: NextRequest) {
  const db = getDb();
  const body = await req.json();
  const stmt = db.prepare(`INSERT INTO tasks (title, description, category, priority, due_date, estimated_minutes, goal_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
  const result = stmt.run(body.title, body.description || '', body.category || 'General', body.priority || 'medium', body.due_date || null, body.estimated_minutes || 60, body.goal_id || null, body.status || 'todo');
  return NextResponse.json(db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid));
}
