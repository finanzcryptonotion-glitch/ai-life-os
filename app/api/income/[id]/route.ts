import { NextRequest, NextResponse } from 'next/server';
import { run } from '@/lib/db';

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await run('DELETE FROM income_entries WHERE id = ?', [id]);
  return NextResponse.json({ ok: true });
}
