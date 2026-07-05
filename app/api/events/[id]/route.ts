import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const db = getDb();
  const { id } = await params;
  const body = await req.json();
  db.prepare(`UPDATE events SET title=?, date=?, time=?, duration_minutes=?, category=?, location=?, notes=? WHERE id=?`)
    .run(body.title, body.date, body.time, body.duration_minutes, body.category, body.location, body.notes, id);
  return NextResponse.json(db.prepare('SELECT * FROM events WHERE id = ?').get(id));
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const db = getDb();
  const { id } = await params;
  db.prepare('DELETE FROM events WHERE id = ?').run(id);
  return NextResponse.json({ ok: true });
}
