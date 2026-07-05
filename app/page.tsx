'use client';
import { useEffect, useState } from 'react';
import type { Goal, Task, CalendarEvent, IncomeEntry, EcommerceEntry, TradingEntry, HealthEntry } from '@/types';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { Target, CheckSquare, TrendingUp, Calendar, Brain, ShoppingBag, LineChart, Heart, AlertCircle } from 'lucide-react';

function fmt(n: number) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: '#111', border: '1px solid #1f1f1f', borderRadius: 12,
      padding: 20, ...style
    }}>
      {children}
    </div>
  );
}

function SectionTitle({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
      <Icon size={15} color="#a1a1aa" />
      <span style={{ fontSize: 11, fontWeight: 600, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
    </div>
  );
}

export default function Dashboard() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [income, setIncome] = useState<IncomeEntry[]>([]);
  const [ecom, setEcom] = useState<EcommerceEntry[]>([]);
  const [trading, setTrading] = useState<TradingEntry[]>([]);
  const [health, setHealth] = useState<HealthEntry[]>([]);
  const [aiText, setAiText] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    Promise.all([
      fetch('/api/goals').then(r => r.json()),
      fetch('/api/tasks').then(r => r.json()),
      fetch('/api/events').then(r => r.json()),
      fetch('/api/income').then(r => r.json()),
      fetch('/api/ecommerce').then(r => r.json()),
      fetch('/api/trading').then(r => r.json()),
      fetch('/api/health').then(r => r.json()),
    ]).then(([g, t, e, i, ec, tr, h]) => {
      setGoals(g); setTasks(t); setEvents(e); setIncome(i);
      setEcom(ec); setTrading(tr); setHealth(h);
    });
  }, []);

  const todayTasks = tasks.filter(t => t.status === 'today' || t.status === 'in_progress');
  const todayEvents = events.filter(e => e.date === today);
  const upcomingEvents = events.filter(e => e.date >= today).slice(0, 5);

  const todayIncome = income.filter(i => i.date === today).reduce((s, i) => s + i.amount, 0);
  const weekIncome = income.filter(i => i.date >= new Date(Date.now() - 7 * 864e5).toISOString().split('T')[0]).reduce((s, i) => s + i.amount, 0);
  const monthIncome = income.filter(i => i.date >= new Date().toISOString().slice(0, 7) + '-01').reduce((s, i) => s + i.amount, 0);

  // Income chart data (last 14 days)
  const incomeChart = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(Date.now() - (13 - i) * 864e5).toISOString().split('T')[0];
    const total = income.filter(e => e.date === d).reduce((s, e) => s + e.amount, 0);
    return { date: d.slice(5), total };
  });

  // Latest trading
  const latestTrade = trading[0];
  const latestEcom = ecom[0];
  const latestHealth = health[0];

  // Overdue tasks
  const overdue = tasks.filter(t => t.due_date && t.due_date < today && !['completed', 'archived'].includes(t.status));

  async function askAi(prompt: string) {
    setAiLoading(true);
    setAiText('');
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      const data = await res.json();
      setAiText(data.content || data.error || 'Fehler');
    } catch { setAiText('Fehler beim Abrufen der KI.'); }
    setAiLoading(false);
  }

  async function enableNotifications() {
    if (!('Notification' in window)) return alert('Browser unterstützt keine Notifications.');
    const perm = await Notification.requestPermission();
    if (perm === 'granted') {
      setNotifEnabled(true);
      new Notification('Life OS', { body: 'Benachrichtigungen aktiviert!', icon: '/favicon.ico' });
      scheduleNotifications();
    }
  }

  function scheduleNotifications() {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    events.filter(e => e.date === todayStr && e.time).forEach(event => {
      const [h, m] = event.time!.split(':').map(Number);
      const eventTime = new Date(now);
      eventTime.setHours(h, m - 15, 0);
      const diff = eventTime.getTime() - now.getTime();
      if (diff > 0) {
        setTimeout(() => {
          new Notification('Termin in 15 Min', { body: event.title, icon: '/favicon.ico' });
        }, diff);
      }
    });
  }

  async function resetAll() {
    await fetch('/api/reset', { method: 'POST' });
    setResetConfirm(false);
    window.location.reload();
  }

  const priorityColor = (p: string) => p === 'high' ? '#ef4444' : p === 'medium' ? '#f97316' : '#71717a';
  const statusColor = (s: string) => ({ todo: '#71717a', today: '#3b82f6', in_progress: '#f97316', completed: '#22c55e' }[s] || '#71717a');

  return (
    <div style={{ padding: 32, maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.03em' }}>
          Guten {new Date().getHours() < 12 ? 'Morgen' : new Date().getHours() < 18 ? 'Tag' : 'Abend'}, Fritz 👋
        </h1>
        <p style={{ color: '#a1a1aa', marginTop: 4, fontSize: 14 }}>
          {new Date().toLocaleDateString('de-DE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Top Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Heute', value: fmt(todayIncome), sub: 'Einkommen', color: '#22c55e' },
          { label: 'Diese Woche', value: fmt(weekIncome), sub: 'Einkommen', color: '#22c55e' },
          { label: 'Dieser Monat', value: fmt(monthIncome), sub: 'Einkommen', color: '#22c55e' },
          { label: 'Aktive Ziele', value: String(goals.filter(g => g.status === 'active').length), sub: 'Goals', color: '#3b82f6' },
        ].map(s => (
          <Card key={s.label}>
            <div style={{ fontSize: 11, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: s.color, letterSpacing: '-0.02em', lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: '#52525b', marginTop: 4 }}>{s.sub}</div>
          </Card>
        ))}
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>

        {/* Today's Focus */}
        <Card style={{ gridColumn: '1 / 2' }}>
          <SectionTitle icon={CheckSquare} label="Today's Focus" />
          {todayTasks.length === 0 ? (
            <p style={{ color: '#52525b', fontSize: 13 }}>Keine aktiven Tasks für heute.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {todayTasks.slice(0, 5).map(t => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor(t.status), marginTop: 4, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 500 }}>{t.title}</div>
                    <div style={{ fontSize: 11, color: '#52525b', marginTop: 2 }}>{t.estimated_minutes}min · <span style={{ color: priorityColor(t.priority) }}>{t.priority}</span></div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {overdue.length > 0 && (
            <div style={{ marginTop: 14, padding: '8px 12px', background: '#1a0a0a', border: '1px solid #2a1010', borderRadius: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
              <AlertCircle size={13} color="#ef4444" />
              <span style={{ fontSize: 12, color: '#ef4444' }}>{overdue.length} überfällige Task{overdue.length > 1 ? 's' : ''}</span>
            </div>
          )}
        </Card>

        {/* Today's Schedule */}
        <Card style={{ gridColumn: '2 / 3' }}>
          <SectionTitle icon={Calendar} label="Heutiger Kalender" />
          {todayEvents.length === 0 ? (
            <p style={{ color: '#52525b', fontSize: 13 }}>Keine Termine heute.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {todayEvents.map(e => (
                <div key={e.id} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{ fontSize: 12, color: '#3b82f6', fontWeight: 600, minWidth: 42, fontVariantNumeric: 'tabular-nums' }}>{e.time}</div>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 500 }}>{e.title}</div>
                    {e.location && <div style={{ fontSize: 11, color: '#52525b' }}>{e.location}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Upcoming */}
        <Card style={{ gridColumn: '3 / 4' }}>
          <SectionTitle icon={Calendar} label="Nächste Termine" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {upcomingEvents.map(e => (
              <div key={e.id} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ fontSize: 11, color: '#a1a1aa', minWidth: 70, fontVariantNumeric: 'tabular-nums' }}>
                  {new Date(e.date).toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' })}
                </div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{e.title}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Income Chart + Goals */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>
        <Card>
          <SectionTitle icon={TrendingUp} label="Einkommen – Letzte 14 Tage" />
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={incomeChart} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fill: '#52525b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#52525b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#111', border: '1px solid #1f1f1f', borderRadius: 8, fontSize: 12 }} formatter={(v) => [fmt(Number(v)), 'Einkommen']} />
              <Area type="monotone" dataKey="total" stroke="#22c55e" strokeWidth={2} fill="url(#incGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <SectionTitle icon={Target} label="Goal Progress" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {goals.filter(g => g.status === 'active').slice(0, 4).map(g => (
              <div key={g.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '75%' }}>{g.title}</span>
                  <span style={{ fontSize: 12, color: '#22c55e', fontWeight: 600 }}>{g.progress}%</span>
                </div>
                <div style={{ background: '#1a1a1a', borderRadius: 4, height: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${g.progress}%`, background: g.progress >= 70 ? '#22c55e' : g.progress >= 40 ? '#f97316' : '#3b82f6', borderRadius: 4, transition: 'width 0.5s' }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Snapshots Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 16 }}>

        {/* E-Commerce Snapshot */}
        <Card>
          <SectionTitle icon={ShoppingBag} label="E-Commerce" />
          {latestEcom ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { label: 'Revenue', value: fmt(latestEcom.revenue), color: '#22c55e' },
                { label: 'Profit', value: fmt(latestEcom.profit), color: '#22c55e' },
                { label: 'Ad Spend', value: fmt(latestEcom.ad_spend), color: '#ef4444' },
                { label: 'Orders', value: String(latestEcom.orders), color: '#3b82f6' },
              ].map(s => (
                <div key={s.label}>
                  <div style={{ fontSize: 10, color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>{s.label}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: s.color, letterSpacing: '-0.02em' }}>{s.value}</div>
                </div>
              ))}
            </div>
          ) : <p style={{ color: '#52525b', fontSize: 13 }}>Keine Daten</p>}
          <div style={{ fontSize: 10, color: '#3f3f46', marginTop: 12 }}>
            {latestEcom ? `Letzte Eintr.: ${new Date(latestEcom.date).toLocaleDateString('de-DE')}` : ''}
          </div>
        </Card>

        {/* Trading Snapshot */}
        <Card>
          <SectionTitle icon={LineChart} label="Trading – NQ Futures" />
          {latestTrade ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { label: 'Balance', value: fmt(latestTrade.account_balance), color: '#fff' },
                { label: 'Daily P&L', value: fmt(latestTrade.daily_pnl), color: latestTrade.daily_pnl >= 0 ? '#22c55e' : '#ef4444' },
                { label: 'Win Rate', value: `${(latestTrade.win_rate * 100).toFixed(0)}%`, color: latestTrade.win_rate >= 0.6 ? '#22c55e' : '#f97316' },
                { label: 'Datum', value: new Date(latestTrade.date).toLocaleDateString('de-DE'), color: '#a1a1aa' },
              ].map(s => (
                <div key={s.label}>
                  <div style={{ fontSize: 10, color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>{s.label}</div>
                  <div style={{ fontSize: s.label === 'Datum' ? 13 : 20, fontWeight: 700, color: s.color, letterSpacing: '-0.02em' }}>{s.value}</div>
                </div>
              ))}
            </div>
          ) : <p style={{ color: '#52525b', fontSize: 13 }}>Keine Daten</p>}
        </Card>

        {/* Health Snapshot */}
        <Card>
          <SectionTitle icon={Heart} label="Health" />
          {latestHealth ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { label: 'Gewicht', value: latestHealth.body_weight ? `${latestHealth.body_weight}kg` : '—', color: '#fff' },
                { label: 'Schlaf', value: latestHealth.sleep_hours ? `${latestHealth.sleep_hours}h` : '—', color: '#3b82f6' },
                { label: 'Training', value: latestHealth.workout || 'Ruhetag', color: latestHealth.workout ? '#22c55e' : '#52525b' },
                { label: 'Score', value: `${latestHealth.daily_score}/100`, color: latestHealth.daily_score >= 80 ? '#22c55e' : '#f97316' },
              ].map(s => (
                <div key={s.label}>
                  <div style={{ fontSize: 10, color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>{s.label}</div>
                  <div style={{ fontSize: s.label === 'Training' ? 12 : 20, fontWeight: 700, color: s.color, letterSpacing: '-0.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.value}</div>
                </div>
              ))}
            </div>
          ) : <p style={{ color: '#52525b', fontSize: 13 }}>Keine Daten</p>}
        </Card>
      </div>

      {/* AI Assistant */}
      <Card style={{ marginBottom: 16 }}>
        <SectionTitle icon={Brain} label="KI-Assistent" />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          {[
            { label: '🗓 Tagesplan', prompt: 'Erstelle mir einen optimalen Tagesplan für heute. Top 3 Prioritäten, wo soll ich fokussieren? Kurz und konkret.' },
            { label: '📊 Wochen-Review', prompt: 'Erstelle ein kurzes Wochen-Review. Was lief gut, was nicht, was sind die wichtigsten Learnings und Prioritäten für nächste Woche?' },
            { label: '💰 Income-Analyse', prompt: 'Analysiere meine Einkommenssituation. Welche Einkommensquelle performen gut, wo gibt es Potenzial? Was sollte ich priorisieren?' },
            { label: '🎯 Goal-Check', prompt: 'Wie stehe ich bei meinen Zielen? Bin ich auf Kurs? Was muss ich tun um meine Ziele zu erreichen? Sei direkt und ehrlich.' },
            { label: '🧠 Motivations-Push', prompt: 'Gib mir einen kurzen, knackigen Motivations-Push für heute. Bezug auf meine Ziele und aktuelle Situation. Max 3 Sätze.' },
          ].map(btn => (
            <button key={btn.label} onClick={() => askAi(btn.prompt)} disabled={aiLoading} style={{
              background: '#1a1a1a', color: '#d4d4d8', border: '1px solid #2a2a2a',
              padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500,
              cursor: aiLoading ? 'not-allowed' : 'pointer', opacity: aiLoading ? 0.5 : 1
            }}>
              {btn.label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: aiText ? 12 : 0 }}>
          <input
            value={aiPrompt}
            onChange={e => setAiPrompt(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && aiPrompt.trim()) { askAi(aiPrompt); setAiPrompt(''); } }}
            placeholder="Eigene Frage stellen..."
            style={{ flex: 1, background: '#0a0a0a', border: '1px solid #1f1f1f', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#fff', outline: 'none' }}
          />
          <button onClick={() => { if (aiPrompt.trim()) { askAi(aiPrompt); setAiPrompt(''); } }} disabled={aiLoading || !aiPrompt.trim()} style={{
            background: '#fff', color: '#000', border: 'none', padding: '8px 16px',
            borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: aiLoading ? 0.5 : 1
          }}>
            {aiLoading ? '⏳' : 'Senden'}
          </button>
        </div>
        {aiText && (
          <div style={{ background: '#0a0a0a', border: '1px solid #1f1f1f', borderRadius: 8, padding: 16, fontSize: 13, lineHeight: 1.7, color: '#d4d4d8', whiteSpace: 'pre-wrap' }}>
            {aiText}
          </div>
        )}
      </Card>

      {/* Notifications + Reset */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', alignItems: 'center' }}>
        <button onClick={enableNotifications} style={{
          background: notifEnabled ? '#14532d' : '#1a1a1a', color: notifEnabled ? '#22c55e' : '#71717a',
          border: `1px solid ${notifEnabled ? '#166534' : '#2a2a2a'}`, padding: '8px 16px',
          borderRadius: 8, fontSize: 12, cursor: 'pointer'
        }}>
          {notifEnabled ? '🔔 Notifications aktiv' : '🔕 Notifications aktivieren'}
        </button>
        {!resetConfirm ? (
          <button onClick={() => setResetConfirm(true)} style={{
            background: '#1a0a0a', color: '#71717a', border: '1px solid #2a1010',
            padding: '8px 16px', borderRadius: 8, fontSize: 12, cursor: 'pointer'
          }}>
            Alle Daten zurücksetzen
          </button>
        ) : (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: '#ef4444' }}>Wirklich alle Daten löschen?</span>
            <button onClick={resetAll} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 8, fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>Ja, löschen</button>
            <button onClick={() => setResetConfirm(false)} style={{ background: '#1a1a1a', color: '#a1a1aa', border: '1px solid #2a2a2a', padding: '8px 16px', borderRadius: 8, fontSize: 12, cursor: 'pointer' }}>Abbrechen</button>
          </div>
        )}
      </div>
    </div>
  );
}
