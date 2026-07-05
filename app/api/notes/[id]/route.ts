import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const db = getDb();
  const { id } = await params;
  const body = await req.json();
  const now = new Date().toISOString();
  db.prepare(`UPDATE notes SET title=?, body=?, updated_at=? WHERE id=?`).run(body.title, body.body, now, id);
  return NextResponse.json(db.prepare('SELECT * FROM notes WHERE id = ?').get(id));
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const db = getDb();
  const { id } = await params;
  db.prepare('DELETE FROM notes WHERE id = ?').run(id);
  return NextResponse.json({ ok: true });
}
