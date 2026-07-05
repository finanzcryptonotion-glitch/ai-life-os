import { NextRequest, NextResponse } from 'next/server';
import { queryOne, run } from '@/lib/db';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  await run(
    `UPDATE tasks SET title=?, description=?, category=?, priority=?, due_date=?, estimated_minutes=?, goal_id=?, status=? WHERE id=?`,
    [body.title, body.description, body.category, body.priority, body.due_date, body.estimated_minutes, body.goal_id || null, body.status, id]
  );
  return NextResponse.json(await queryOne('SELECT * FROM tasks WHERE id = ?', [id]));
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await run('DELETE FROM tasks WHERE id = ?', [id]);
  return NextResponse.json({ ok: true });
}
