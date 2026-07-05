import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const db = getDb();
  const { id } = await params;
  const body = await req.json();
  db.prepare(`UPDATE tasks SET title=?, description=?, category=?, priority=?, due_date=?, estimated_minutes=?, goal_id=?, status=? WHERE id=?`)
    .run(body.title, body.description, body.category, body.priority, body.due_date, body.estimated_minutes, body.goal_id || null, body.status, id);
  return NextResponse.json(db.prepare('SELECT * FROM tasks WHERE id = ?').get(id));
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const db = getDb();
  const { id } = await params;
  db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
  return NextResponse.json({ ok: true });
}
