import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const db = getDb();
  const { id } = await params;
  const body = await req.json();
  db.prepare(`UPDATE goals SET title=?, description=?, category=?, target_date=?, status=?, priority=?, progress=?, notes=? WHERE id=?`)
    .run(body.title, body.description, body.category, body.target_date, body.status, body.priority, body.progress, body.notes, id);
  return NextResponse.json(db.prepare('SELECT * FROM goals WHERE id = ?').get(id));
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const db = getDb();
  const { id } = await params;
  db.prepare('DELETE FROM goals WHERE id = ?').run(id);
  return NextResponse.json({ ok: true });
}
