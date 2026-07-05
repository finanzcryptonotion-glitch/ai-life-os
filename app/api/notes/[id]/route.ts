import { NextRequest, NextResponse } from 'next/server';
import { queryOne, run } from '@/lib/db';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const now = new Date().toISOString();
  await run(`UPDATE notes SET title=?, body=?, updated_at=? WHERE id=?`, [body.title, body.body, now, id]);
  return NextResponse.json(await queryOne('SELECT * FROM notes WHERE id = ?', [id]));
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await run('DELETE FROM notes WHERE id = ?', [id]);
  return NextResponse.json({ ok: true });
}
