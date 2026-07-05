import { NextRequest, NextResponse } from 'next/server';
import { queryOne, run } from '@/lib/db';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  await run(
    `UPDATE goals SET title=?, description=?, category=?, target_date=?, status=?, priority=?, progress=?, notes=? WHERE id=?`,
    [body.title, body.description, body.category, body.target_date, body.status, body.priority, body.progress, body.notes, id]
  );
  return NextResponse.json(await queryOne('SELECT * FROM goals WHERE id = ?', [id]));
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await run('DELETE FROM goals WHERE id = ?', [id]);
  return NextResponse.json({ ok: true });
}
