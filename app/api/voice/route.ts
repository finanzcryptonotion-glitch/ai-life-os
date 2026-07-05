import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(req: NextRequest) {
  const db = getDb();
  const { text } = await req.json();

  const settings = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[];
  const s = Object.fromEntries(settings.map(r => [r.key, r.value]));
  const apiKey = s['ai_api_key'] || process.env.ANTHROPIC_API_KEY || '';

  if (!apiKey) return NextResponse.json({ error: 'Kein API Key konfiguriert.' }, { status: 400 });

  const today = new Date().toISOString().split('T')[0];

  const systemPrompt = `Du bist der persönliche Assistent von Fritz und verarbeitest Spracheingaben.
Fritz spricht auf Deutsch und gibt dir Aufgaben, Termine, Einträge oder Fragen.
Heute ist ${today}.

Deine Aufgabe: Analysiere die Eingabe und antworte mit einem JSON-Objekt das beschreibt welche Aktionen ausgeführt werden sollen.

Mögliche Aktionen:
- create_task: { title, description?, priority ("high"|"medium"|"low"), due_date (YYYY-MM-DD)?, estimated_minutes?, status ("todo"|"today") }
- create_event: { title, date (YYYY-MM-DD), time (HH:MM)?, duration_minutes?, category?, location? }
- create_goal: { title, description?, category?, target_date (YYYY-MM-DD)?, priority }
- add_income: { amount (number), category ("Trading"|"E-Commerce"|"Remote Job"|"Other"), description?, date? }
- add_health: { body_weight?, sleep_hours?, workout?, daily_score?, date? }
- add_trading: { daily_pnl (number), account_balance (number), win_rate?, notes?, date? }
- create_note: { title, body }
- answer: { text } — wenn es eine Frage ist oder nichts erstellt werden soll

Antworte NUR mit validem JSON in diesem Format:
{
  "actions": [...],
  "summary": "kurze deutsche Bestätigung was du gemacht hast"
}

Beispiele:
- "Füge Task hinzu: Morgen Meta Ads analysieren, hoch prio" → create_task
- "Heute Trading: +450 Euro, Balance 26000" → add_trading
- "Termin: Zahnarzt übermorgen um 10 Uhr" → create_event
- "Ich habe heute 7 Stunden geschlafen und 83kg gewogen" → add_health
- "Was sind meine Ziele?" → answer`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: s['ai_model'] || 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: text }],
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    return NextResponse.json({ error: err.error?.message }, { status: response.status });
  }

  const data = await response.json();
  let parsed: { actions: { type: string; [key: string]: unknown }[]; summary: string };

  try {
    parsed = JSON.parse(data.content[0].text);
  } catch {
    return NextResponse.json({ summary: data.content[0].text, actions: [], executed: [] });
  }

  const executed: string[] = [];

  for (const action of parsed.actions || []) {
    try {
      switch (action.type) {
        case 'create_task':
          db.prepare('INSERT INTO tasks (title, description, priority, due_date, estimated_minutes, status, category) VALUES (?, ?, ?, ?, ?, ?, ?)')
            .run(action.title, action.description || '', action.priority || 'medium', action.due_date || today, action.estimated_minutes || 60, action.status || 'todo', action.category || 'General');
          executed.push(`Task erstellt: "${action.title}"`);
          break;
        case 'create_event':
          db.prepare('INSERT INTO events (title, date, time, duration_minutes, category, location) VALUES (?, ?, ?, ?, ?, ?)')
            .run(action.title, action.date, action.time || null, action.duration_minutes || 60, action.category || 'General', action.location || null);
          executed.push(`Termin erstellt: "${action.title}" am ${action.date}`);
          break;
        case 'create_goal':
          db.prepare('INSERT INTO goals (title, description, category, target_date, priority, status) VALUES (?, ?, ?, ?, ?, ?)')
            .run(action.title, action.description || '', action.category || 'Personal', action.target_date || null, action.priority || 'medium', 'active');
          executed.push(`Ziel erstellt: "${action.title}"`);
          break;
        case 'add_income':
          db.prepare('INSERT INTO income_entries (amount, category, description, date) VALUES (?, ?, ?, ?)')
            .run(action.amount, action.category, action.description || '', action.date || today);
          executed.push(`Einkommen eingetragen: €${action.amount} (${action.category})`);
          break;
        case 'add_health':
          db.prepare('INSERT OR REPLACE INTO health_entries (date, body_weight, sleep_hours, workout, daily_score) VALUES (?, ?, ?, ?, ?)')
            .run(action.date || today, action.body_weight || null, action.sleep_hours || null, action.workout || null, action.daily_score || 0);
          executed.push(`Health eingetragen für ${action.date || today}`);
          break;
        case 'add_trading':
          db.prepare('INSERT INTO trading_entries (daily_pnl, account_balance, win_rate, notes, date) VALUES (?, ?, ?, ?, ?)')
            .run(action.daily_pnl, action.account_balance, action.win_rate || 0, action.notes || '', action.date || today);
          executed.push(`Trading eingetragen: ${Number(action.daily_pnl) > 0 ? '+' : ''}€${action.daily_pnl}`);
          break;
        case 'create_note':
          db.prepare('INSERT INTO notes (title, body, created_at, updated_at) VALUES (?, ?, ?, ?)')
            .run(action.title, action.body || '', new Date().toISOString(), new Date().toISOString());
          executed.push(`Notiz erstellt: "${action.title}"`);
          break;
      }
    } catch (e) {
      executed.push(`Fehler bei ${action.type}: ${String(e)}`);
    }
  }

  return NextResponse.json({ summary: parsed.summary, actions: parsed.actions, executed });
}
