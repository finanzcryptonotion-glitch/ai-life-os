import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, run } from '@/lib/db';

export async function GET() {
  const tasks = await query('SELECT * FROM tasks ORDER BY due_date ASC, priority DESC');
  return NextResponse.json(tasks);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const result = await run(
    `INSERT INTO tasks (title, description, category, priority, due_date, estimated_minutes, goal_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [body.title, body.description || '', body.category || 'General', body.priority || 'medium', body.due_date || null, body.estimated_minutes || 60, body.goal_id || null, body.status || 'todo']
  );
  return NextResponse.json(await queryOne('SELECT * FROM tasks WHERE id = ?', [result.lastInsertRowid]));
}
