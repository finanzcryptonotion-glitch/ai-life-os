import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  const db = getDb();
  const categories = db.prepare('SELECT * FROM budget_categories ORDER BY type, name').all();
  const monthStart = new Date().toISOString().slice(0, 7) + '-01';
  const entries = db.prepare('SELECT * FROM budget_entries WHERE date >= ? ORDER BY date DESC').all(monthStart);
  return NextResponse.json({ categories, entries });
}

export async function POST(req: NextRequest) {
  const db = getDb();
  const body = await req.json();
  if (body._type === 'category') {
    const r = db.prepare('INSERT INTO budget_categories (name, type, monthly_budget, color, icon) VALUES (?, ?, ?, ?, ?)')
      .run(body.name, body.type || 'expense', body.monthly_budget || 0, body.color || '#ef4444', body.icon || '💰');
    return NextResponse.json(db.prepare('SELECT * FROM budget_categories WHERE id = ?').get(r.lastInsertRowid));
  }
  const r = db.prepare('INSERT INTO budget_entries (category_id, amount, description, date, type) VALUES (?, ?, ?, ?, ?)')
    .run(body.category_id || null, body.amount, body.description || '', body.date || new Date().toISOString().split('T')[0], body.type || 'expense');
  return NextResponse.json(db.prepare('SELECT * FROM budget_entries WHERE id = ?').get(r.lastInsertRowid));
}

export async function DELETE(req: NextRequest) {
  const db = getDb();
  const { id } = await req.json();
  db.prepare('DELETE FROM budget_entries WHERE id = ?').run(id);
  return NextResponse.json({ ok: true });
}
