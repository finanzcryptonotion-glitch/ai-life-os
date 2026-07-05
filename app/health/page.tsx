'use client';
import { useEffect, useState } from 'react';
import type { HealthEntry } from '@/types';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const HABIT_OPTIONS = ['Wasser 3L', 'Protein-Ziel', 'Training', 'Kein Zucker', 'Meditation', 'Früh aufstehen', 'Cold Shower'];
const empty = { date: new Date().toISOString().split('T')[0], workout: '', workout_duration: 0, body_weight: '', sleep_hours: '', habits: [] as string[], daily_score: 0, notes: '' };

export default function HealthPage() {
  const [entries, setEntries] = useState<HealthEntry[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(empty);

  const load = () => fetch('/api/health').then(r => r.json()).then(setEntries);
  useEffect(() => { load(); }, []);

  const latest = entries[0];
  const avgWeight = entries.filter(e => e.body_weight).length ? (entries.filter(e => e.body_weight).reduce((s, e) => s + e.body_weight, 0) / entries.filter(e => e.body_weight).length).toFixed(1) : '—';
  const avgSleep = entries.filter(e => e.sleep_hours).length ? (entries.filter(e => e.sleep_hours).reduce((s, e) => s + e.sleep_hours, 0) / entries.filter(e => e.sleep_hours).length).toFixed(1) : '—';
  const trainDays = entries.filter(e => e.workout).length;

  const chartData = [...entries].reverse().slice(0, 14).map(e => ({
    date: e.date.slice(5), weight: e.body_weight, sleep: e.sleep_hours, score: e.daily_score
  }));

  async function save() {
    await fetch('/api/health', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, body_weight: form.body_weight ? Number(form.body_weight) : null, sleep_hours: form.sleep_hours ? Number(form.sleep_hours) : null })
    });
    setForm(empty); setShowForm(false); load();
  }

  function toggleHabit(h: string) {
    setForm(f => ({ ...f, habits: f.habits.includes(h) ? f.habits.filter(x => x !== h) : [...f.habits, h] }));
  }

  const inp = { background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#fff', borderRadius: 8, padding: '8px 12px', fontSize: 13, width: '100%', outline: 'none' };
  const tooltipStyle = { background: '#111', border: '1px solid #1f1f1f', borderRadius: 8, fontSize: 12 };

  return (
    <div style={{ padding: 32, maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.03em' }}>Health</h1>
          <p style={{ color: '#a1a1aa', fontSize: 13, marginTop: 3 }}>Training · Gewicht · Schlaf · Habits</p>
        </div>
        <button onClick={() => setShowForm(s => !s)} style={{ background: '#fff', color: '#000', border: 'none', padding: '10px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>+ Tageseintrag</button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Aktuell', value: latest?.body_weight ? `${latest.body_weight}kg` : '—', color: '#f97316' },
          { label: 'Ø Gewicht', value: `${avgWeight}kg`, color: '#fff' },
          { label: 'Ø Schlaf', value: `${avgSleep}h`, color: '#3b82f6' },
          { label: 'Trainingstage', value: String(trainDays), color: '#22c55e' },
        ].map(s => (
          <div key={s.label} style={{ background: '#111', border: '1px solid #1f1f1f', borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 10, color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: s.color, letterSpacing: '-0.02em' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div style={{ background: '#111', border: '1px solid #1f1f1f', borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 11, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>Gewicht (kg)</div>
          <ResponsiveContainer width="100%" height={130}>
            <LineChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="date" tick={{ fill: '#52525b', fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#52525b', fontSize: 9 }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${Number(v)}kg`]} />
              <Line type="monotone" dataKey="weight" stroke="#f97316" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: '#111', border: '1px solid #1f1f1f', borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 11, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>Schlaf (h)</div>
          <ResponsiveContainer width="100%" height={130}>
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="date" tick={{ fill: '#52525b', fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#52525b', fontSize: 9 }} axisLine={false} tickLine={false} domain={[0, 10]} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${Number(v)}h`]} />
              <Bar dataKey="sleep" fill="#3b82f6" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: '#111', border: '1px solid #1f1f1f', borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 11, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>Daily Score</div>
          <ResponsiveContainer width="100%" height={130}>
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="date" tick={{ fill: '#52525b', fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#52525b', fontSize: 9 }} axisLine={false} tickLine={false} domain={[0, 100]} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${Number(v)}/100`]} />
              <Bar dataKey="score" fill="#22c55e" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div style={{ background: '#111', border: '1px solid #2a2a2a', borderRadius: 12, padding: 20, marginBottom: 24 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Tageseintrag</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            <div><label style={{ fontSize: 11, color: '#a1a1aa', display: 'block', marginBottom: 4 }}>Datum</label><input style={inp} type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></div>
            <div><label style={{ fontSize: 11, color: '#a1a1aa', display: 'block', marginBottom: 4 }}>Training</label><input style={inp} value={form.workout} onChange={e => setForm(f => ({ ...f, workout: e.target.value }))} placeholder="z.B. Push Day" /></div>
            <div><label style={{ fontSize: 11, color: '#a1a1aa', display: 'block', marginBottom: 4 }}>Dauer (Min)</label><input style={inp} type="number" value={form.workout_duration} onChange={e => setForm(f => ({ ...f, workout_duration: Number(e.target.value) }))} /></div>
            <div><label style={{ fontSize: 11, color: '#a1a1aa', display: 'block', marginBottom: 4 }}>Körpergewicht (kg)</label><input style={inp} type="number" step="0.1" value={form.body_weight} onChange={e => setForm(f => ({ ...f, body_weight: e.target.value }))} /></div>
            <div><label style={{ fontSize: 11, color: '#a1a1aa', display: 'block', marginBottom: 4 }}>Schlaf (h)</label><input style={inp} type="number" step="0.5" value={form.sleep_hours} onChange={e => setForm(f => ({ ...f, sleep_hours: e.target.value }))} /></div>
            <div><label style={{ fontSize: 11, color: '#a1a1aa', display: 'block', marginBottom: 4 }}>Daily Score (/100)</label><input style={inp} type="number" min={0} max={100} value={form.daily_score} onChange={e => setForm(f => ({ ...f, daily_score: Number(e.target.value) }))} /></div>
          </div>
          <div style={{ marginTop: 14 }}>
            <label style={{ fontSize: 11, color: '#a1a1aa', display: 'block', marginBottom: 8 }}>Habits</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {HABIT_OPTIONS.map(h => (
                <button key={h} onClick={() => toggleHabit(h)} style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer', background: form.habits.includes(h) ? '#22c55e20' : '#1a1a1a', color: form.habits.includes(h) ? '#22c55e' : '#a1a1aa', border: '1px solid ' + (form.habits.includes(h) ? '#22c55e40' : '#2a2a2a') }}>{h}</button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button onClick={save} style={{ background: '#fff', color: '#000', border: 'none', padding: '9px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Speichern</button>
            <button onClick={() => setShowForm(false)} style={{ background: '#1a1a1a', color: '#fff', border: '1px solid #2a2a2a', padding: '9px 20px', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>Abbrechen</button>
          </div>
        </div>
      )}

      {/* History */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {entries.slice(0, 14).map(e => {
          const habits = JSON.parse(e.habits || '[]') as string[];
          return (
            <div key={e.id} style={{ background: '#111', border: '1px solid #1f1f1f', borderRadius: 10, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{ minWidth: 80 }}>
                <div style={{ fontSize: 12, color: '#a1a1aa' }}>{new Date(e.date).toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' })}</div>
              </div>
              <div style={{ flex: 1, display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                {e.workout && <span style={{ fontSize: 12, color: '#22c55e' }}>💪 {e.workout} ({e.workout_duration}min)</span>}
                {e.body_weight && <span style={{ fontSize: 12, color: '#f97316' }}>⚖️ {e.body_weight}kg</span>}
                {e.sleep_hours && <span style={{ fontSize: 12, color: '#3b82f6' }}>😴 {e.sleep_hours}h</span>}
                {habits.map(h => <span key={h} style={{ fontSize: 11, color: '#71717a' }}>✓ {h}</span>)}
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: e.daily_score >= 80 ? '#22c55e' : e.daily_score >= 60 ? '#f97316' : '#ef4444' }}>{e.daily_score}/100</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
