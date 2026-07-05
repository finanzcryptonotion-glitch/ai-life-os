'use client';
import { useEffect, useState } from 'react';
import { Plus, Check, Flame, X } from 'lucide-react';

type Habit = { id: number; title: string; description: string; color: string; target_days: number };
type Log = { habit_id: number; date: string; completed: number };

const COLORS = ['#3b82f6', '#22c55e', '#f97316', '#a855f7', '#ef4444', '#06b6d4', '#eab308'];

function getLast7Days() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - (6 - i) * 864e5);
    return { date: d.toISOString().split('T')[0], label: d.toLocaleDateString('de-DE', { weekday: 'short' }) };
  });
}

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', color: '#3b82f6', target_days: 7 });
  const today = new Date().toISOString().split('T')[0];
  const days = getLast7Days();

  const load = () => fetch('/api/habits').then(r => r.json()).then(d => { setHabits(d.habits || []); setLogs(d.logs || []); });
  useEffect(() => { load(); }, []);

  const isLogged = (habitId: number, date: string) => logs.some(l => l.habit_id === habitId && l.date === date && l.completed);

  async function toggle(habit_id: number, date: string) {
    const done = isLogged(habit_id, date);
    await fetch('/api/habits/log', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ habit_id, date, completed: !done }) });
    load();
  }

  async function addHabit() {
    if (!form.title.trim()) return;
    await fetch('/api/habits', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    setForm({ title: '', description: '', color: '#3b82f6', target_days: 7 });
    setShowForm(false);
    load();
  }

  function getStreak(habitId: number) {
    let streak = 0;
    const d = new Date();
    while (true) {
      const date = d.toISOString().split('T')[0];
      if (!isLogged(habitId, date)) break;
      streak++;
      d.setDate(d.getDate() - 1);
    }
    return streak;
  }

  function getWeekScore(habitId: number) {
    return days.filter(d => isLogged(habitId, d.date)).length;
  }

  const inp = { background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#fff', borderRadius: 8, padding: '9px 12px', fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box' as const };

  return (
    <div style={{ padding: 32, maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 4 }}>Habit Tracker</h1>
          <p style={{ color: '#a1a1aa', fontSize: 13 }}>Konsistenz schlägt Intensität.</p>
        </div>
        <button onClick={() => setShowForm(s => !s)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', color: '#000', border: 'none', padding: '10px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          <Plus size={15} /> Habit hinzufügen
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <div style={{ background: '#111', border: '1px solid #1f1f1f', borderRadius: 12, padding: 24, marginBottom: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div>
              <label style={{ fontSize: 11, color: '#a1a1aa', display: 'block', marginBottom: 6 }}>Habit Name</label>
              <input style={inp} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="z.B. Wasser 3L trinken" onKeyDown={e => e.key === 'Enter' && addHabit()} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#a1a1aa', display: 'block', marginBottom: 6 }}>Beschreibung</label>
              <input style={inp} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional" />
            </div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, color: '#a1a1aa', display: 'block', marginBottom: 8 }}>Farbe</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {COLORS.map(c => (
                <div key={c} onClick={() => setForm(f => ({ ...f, color: c }))} style={{ width: 28, height: 28, borderRadius: '50%', background: c, cursor: 'pointer', border: form.color === c ? '3px solid #fff' : '3px solid transparent', transition: 'border 0.15s' }} />
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={addHabit} style={{ background: '#fff', color: '#000', border: 'none', padding: '9px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Hinzufügen</button>
            <button onClick={() => setShowForm(false)} style={{ background: 'transparent', color: '#71717a', border: '1px solid #2a2a2a', padding: '9px 16px', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>Abbrechen</button>
          </div>
        </div>
      )}

      {habits.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#52525b' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🎯</div>
          <p>Noch keine Habits. Füge dein erstes hinzu!</p>
        </div>
      ) : (
        <div style={{ background: '#111', border: '1px solid #1f1f1f', borderRadius: 12, overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr repeat(7, 44px) 80px 60px', gap: 0, padding: '12px 20px', borderBottom: '1px solid #1f1f1f', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Habit</span>
            {days.map(d => (
              <div key={d.date} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: d.date === today ? '#3b82f6' : '#52525b', fontWeight: d.date === today ? 700 : 400 }}>{d.label}</div>
              </div>
            ))}
            <span style={{ fontSize: 11, color: '#52525b', textAlign: 'center' }}>Woche</span>
            <span style={{ fontSize: 11, color: '#52525b', textAlign: 'center' }}>Streak</span>
          </div>

          {/* Rows */}
          {habits.map(h => {
            const streak = getStreak(h.id);
            const weekScore = getWeekScore(h.id);
            return (
              <div key={h.id} style={{ display: 'grid', gridTemplateColumns: '1fr repeat(7, 44px) 80px 60px', gap: 0, padding: '14px 20px', borderBottom: '1px solid #0f0f0f', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: h.color, flexShrink: 0 }} />
                    {h.title}
                  </div>
                  {h.description && <div style={{ fontSize: 11, color: '#52525b', marginTop: 2, marginLeft: 16 }}>{h.description}</div>}
                </div>
                {days.map(d => {
                  const done = isLogged(h.id, d.date);
                  return (
                    <div key={d.date} style={{ display: 'flex', justifyContent: 'center' }}>
                      <button onClick={() => toggle(h.id, d.date)} style={{
                        width: 32, height: 32, borderRadius: 8, border: 'none', cursor: 'pointer',
                        background: done ? h.color : '#1a1a1a',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.15s'
                      }}>
                        {done && <Check size={14} color="#fff" strokeWidth={2.5} />}
                      </button>
                    </div>
                  );
                })}
                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: weekScore >= 5 ? '#22c55e' : weekScore >= 3 ? '#f97316' : '#71717a' }}>
                    {weekScore}/7
                  </span>
                </div>
                <div style={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                  {streak > 0 && <Flame size={13} color="#f97316" />}
                  <span style={{ fontSize: 13, fontWeight: 600, color: streak > 0 ? '#f97316' : '#52525b' }}>{streak}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
