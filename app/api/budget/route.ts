import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, run } from '@/lib/db';

export async function GET() {
  const categories = await query('SELECT * FROM budget_categories ORDER BY type, name');
  const monthStart = new Date().toISOString().slice(0, 7) + '-01';
  const entries = await query('SELECT * FROM budget_entries WHERE date >= ? ORDER BY date DESC', [monthStart]);
  return NextResponse.json({ categories, entries });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (body._type === 'category') {
    const result = await run(
      'INSERT INTO budget_categories (name, type, monthly_budget, color, icon) VALUES (?, ?, ?, ?, ?)',
      [body.name, body.type || 'expense', body.monthly_budget || 0, body.color || '#ef4444', body.icon || '💰']
    );
    return NextResponse.json(await queryOne('SELECT * FROM budget_categories WHERE id = ?', [result.lastInsertRowid]));
  }
  const result = await run(
    'INSERT INTO budget_entries (category_id, amount, description, date, type) VALUES (?, ?, ?, ?, ?)',
    [body.category_id || null, body.amount, body.description || '', body.date || new Date().toISOString().split('T')[0], body.type || 'expense']
  );
  return NextResponse.json(await queryOne('SELECT * FROM budget_entries WHERE id = ?', [result.lastInsertRowid]));
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  await run('DELETE FROM budget_entries WHERE id = ?', [id]);
  return NextResponse.json({ ok: true });
}
