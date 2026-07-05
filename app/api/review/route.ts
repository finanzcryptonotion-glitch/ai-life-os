import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, run } from '@/lib/db';

export async function POST(req: NextRequest) {
  const { userInput } = await req.json();

  const rows = await query('SELECT key, value FROM settings') as { key: string; value: string }[];
  const s = Object.fromEntries(rows.map(r => [r.key, r.value]));
  const apiKey = s['ai_api_key'] || process.env.ANTHROPIC_API_KEY || '';
  if (!apiKey) return NextResponse.json({ error: 'Kein API Key konfiguriert.' }, { status: 400 });

  const today = new Date().toISOString().split('T')[0];
  const weekStart = new Date(Date.now() - 7 * 864e5).toISOString().split('T')[0];
  const monthStart = today.slice(0, 7) + '-01';

  const goals = await query("SELECT * FROM goals WHERE status = 'active'");
  const tasksCompleted = await query('SELECT * FROM tasks WHERE status = ? AND created_at >= ?', ['completed', weekStart]);
  const tasksOpen = await query("SELECT * FROM tasks WHERE status NOT IN ('completed','archived')");
  const incomeWeek = await query('SELECT * FROM income_entries WHERE date >= ? ORDER BY date DESC', [weekStart]);
  const incomeMonth = await queryOne('SELECT SUM(amount) as total FROM income_entries WHERE date >= ?', [monthStart]) as { total: number } | null;
  const tradingWeek = await query('SELECT * FROM trading_entries WHERE date >= ? ORDER BY date DESC', [weekStart]);
  const healthWeek = await query('SELECT * FROM health_entries WHERE date >= ? ORDER BY date DESC', [weekStart]);
  const ecomWeek = await query('SELECT * FROM ecommerce_entries WHERE date >= ? ORDER BY date DESC', [weekStart]);

  const totalIncome = (incomeWeek as { amount: number }[]).reduce((s, r) => s + r.amount, 0);
  const totalPnl = (tradingWeek as { daily_pnl: number }[]).reduce((s, r) => s + r.daily_pnl, 0);
  const avgSleep = healthWeek.length ? ((healthWeek as { sleep_hours: number }[]).reduce((s, r) => s + (r.sleep_hours || 0), 0) / healthWeek.length).toFixed(1) : '?';
  const workouts = (healthWeek as { workout: string }[]).filter(r => r.workout).length;
  const ecomRevenue = (ecomWeek as { revenue: number }[]).reduce((s, r) => s + r.revenue, 0);
  const ecomAdSpend = (ecomWeek as { ad_spend: number }[]).reduce((s, r) => s + r.ad_spend, 0);

  const systemPrompt = `Du bist der persönliche Lebens-Coach und Assistent von Fritz.
Fritz ist ein deutscher Unternehmer der finanzielle Freiheit anstrebt und nach Bangkok/Chiang Mai auswandern will.
Sein Ziel: €5.000+/Monat Nettoeinkommen.

WOCHENDATEN (${weekStart} bis ${today}):
- Gesamteinkommen: €${totalIncome.toFixed(2)}
- Monatseinkommen bisher: €${(incomeMonth?.total || 0).toFixed(2)}
- Trading PnL: €${totalPnl.toFixed(2)} (${tradingWeek.length} Tage)
- E-Commerce Revenue: €${ecomRevenue.toFixed(2)}, Ad Spend: €${ecomAdSpend.toFixed(2)}
- Trainingstage: ${workouts}/7
- Ø Schlaf: ${avgSleep}h
- Erledigte Tasks: ${tasksCompleted.length}

AKTIVE ZIELE:
${(goals as { title: string; progress: number; priority: string; target_date: string }[]).map(g => `- ${g.title} (${g.progress}%, Prio: ${g.priority}, Deadline: ${g.target_date || 'offen'})`).join('\n')}

OFFENE TASKS (${tasksOpen.length}):
${(tasksOpen as { title: string; priority: string; due_date: string; status: string }[]).slice(0, 15).map(t => `- [${t.status}] ${t.title} (${t.priority}, fällig: ${t.due_date || 'offen'})`).join('\n')}

Antworte mit einem JSON-Objekt:
{
  "review": "Vollständiges Wochenreview auf Deutsch (Markdown, 300-500 Wörter)",
  "task_updates": [
    { "action": "create", "title": "...", "priority": "high|medium|low", "due_date": "YYYY-MM-DD", "status": "today|todo", "description": "..." },
    { "action": "complete", "title": "..." },
    { "action": "delete", "title": "..." }
  ],
  "goal_updates": [
    { "title": "Ziel-Titel exakt wie oben", "progress": 0-100, "notes": "..." }
  ],
  "next_week_focus": ["Fokus 1", "Fokus 2", "Fokus 3"]
}`;

  const userMessage = userInput
    ? `Hier mein persönlicher Input für diese Woche:\n\n${userInput}\n\nBitte erstelle das Wochenreview.`
    : `Bitte erstelle das Wochenreview basierend auf meinen Daten.`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: s['ai_model'] || 'claude-3-5-sonnet-20241022',
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    return NextResponse.json({ error: err.error?.message }, { status: response.status });
  }

  const data = await response.json();
  let parsed: {
    review: string;
    task_updates: { action: string; title: string; priority?: string; due_date?: string; status?: string; description?: string }[];
    goal_updates: { title: string; progress: number; notes?: string }[];
    next_week_focus: string[];
  };

  try {
    const text = data.content[0].text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text);
  } catch {
    return NextResponse.json({ review: data.content[0].text, task_updates: [], goal_updates: [], next_week_focus: [], executed: [] });
  }

  const executed: string[] = [];

  for (const u of parsed.task_updates || []) {
    if (u.action === 'create') {
      await run('INSERT INTO tasks (title, description, priority, due_date, status, category) VALUES (?, ?, ?, ?, ?, ?)',
        [u.title, u.description || '', u.priority || 'medium', u.due_date || today, u.status || 'todo', 'General']);
      executed.push(`Task erstellt: "${u.title}"`);
    } else if (u.action === 'complete') {
      await run("UPDATE tasks SET status = 'completed' WHERE title LIKE ?", [`%${u.title}%`]);
      executed.push(`Task erledigt: "${u.title}"`);
    } else if (u.action === 'delete') {
      await run("UPDATE tasks SET status = 'archived' WHERE title LIKE ?", [`%${u.title}%`]);
      executed.push(`Task archiviert: "${u.title}"`);
    }
  }

  for (const g of parsed.goal_updates || []) {
    await run('UPDATE goals SET progress = ?, notes = ? WHERE title LIKE ?',
      [g.progress, g.notes || '', `%${g.title.slice(0, 20)}%`]);
    executed.push(`Goal aktualisiert: "${g.title}" → ${g.progress}%`);
  }

  const noteTitle = `Wochenreview ${weekStart} – ${today}`;
  const noteBody = `${parsed.review}\n\n---\n**Nächste Woche Fokus:**\n${(parsed.next_week_focus || []).map((f, i) => `${i + 1}. ${f}`).join('\n')}`;
  await run('INSERT INTO notes (title, body, created_at, updated_at) VALUES (?, ?, ?, ?)',
    [noteTitle, noteBody, new Date().toISOString(), new Date().toISOString()]);
  executed.push(`Review als Notiz gespeichert: "${noteTitle}"`);

  return NextResponse.json({ ...parsed, executed });
}
