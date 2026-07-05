import { NextRequest, NextResponse } from 'next/server';
import { queryOne, run } from '@/lib/db';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  await run(
    `UPDATE events SET title=?, date=?, time=?, duration_minutes=?, category=?, location=?, notes=? WHERE id=?`,
    [body.title, body.date, body.time, body.duration_minutes, body.category, body.location, body.notes, id]
  );
  return NextResponse.json(await queryOne('SELECT * FROM events WHERE id = ?', [id]));
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await run('DELETE FROM events WHERE id = ?', [id]);
  return NextResponse.json({ ok: true });
}
