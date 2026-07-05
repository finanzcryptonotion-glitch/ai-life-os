import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(req: NextRequest) {
  const db = getDb();
  const body = await req.json();
  const { prompt, context_type } = body;

  const settings = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[];
  const settingsMap = Object.fromEntries(settings.map(r => [r.key, r.value]));
  const apiKey = settingsMap['ai_api_key'] || process.env.ANTHROPIC_API_KEY || '';

  if (!apiKey) {
    return NextResponse.json({ error: 'Kein API Key konfiguriert. Bitte in den Einstellungen hinterlegen.' }, { status: 400 });
  }

  const goals = db.prepare('SELECT * FROM goals WHERE status = "active"').all();
  const tasks = db.prepare('SELECT * FROM tasks WHERE status NOT IN ("completed", "archived")').all();
  const todayStr = new Date().toISOString().split('T')[0];
  const todayIncome = db.prepare('SELECT SUM(amount) as total FROM income_entries WHERE date = ?').get(todayStr) as { total: number };
  const weekIncome = db.prepare(`SELECT SUM(amount) as total FROM income_entries WHERE date >= date('now', '-7 days')`).get() as { total: number };

  const systemPrompt = `Du bist der persönliche KI-Assistent von Fritz, einem deutschen Unternehmer und Trader.
Fritz ist aktiv dabei, finanzielle Freiheit zu erreichen, um nach Bangkok oder Chiang Mai auszuwandern.
Er betreibt einen Shopify E-Commerce Store, tradet NQ Futures (ICT/SMC Strategie), und hat ein Remote-Job.
Sein monatliches Einkommensziel ist €5.000+.

Aktive Ziele:
${(goals as { title: string; progress: number; priority: string }[]).map(g => `- ${g.title} (${g.progress}% Fortschritt, Priorität: ${g.priority})`).join('\n')}

Offene Tasks: ${(tasks as { title: string }[]).length} Aufgaben
Heutiges Einkommen: €${todayIncome?.total?.toFixed(2) || '0.00'}
Einkommen diese Woche: €${weekIncome?.total?.toFixed(2) || '0.00'}

Antworte immer auf Deutsch. Sei konkret, direkt und handlungsorientiert.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: settingsMap['ai_model'] || 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      return NextResponse.json({ error: err.error?.message || 'API Fehler' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json({ content: data.content[0].text });
  } catch {
    return NextResponse.json({ error: 'Verbindungsfehler zur KI' }, { status: 500 });
  }
}
