'use client';
import { useEffect, useState } from 'react';
import type { IncomeEntry } from '@/types';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';

const CATEGORIES = ['E-Commerce', 'Trading', 'Remote Job', 'Other'];
const CAT_COLORS: Record<string, string> = { 'E-Commerce': '#3b82f6', Trading: '#22c55e', 'Remote Job': '#f97316', Other: '#a855f7' };

function fmt(n: number) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}

export default function IncomePage() {
  const [entries, setEntries] = useState<IncomeEntry[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ amount: '', category: 'E-Commerce', description: '', date: new Date().toISOString().split('T')[0] });
  const [filterCat, setFilterCat] = useState('all');

  const load = () => fetch('/api/income').then(r => r.json()).then(setEntries);
  useEffect(() => { load(); }, []);

  const today = new Date().toISOString().split('T')[0];
  const weekStart = new Date(Date.now() - 7 * 864e5).toISOString().split('T')[0];
  const monthStart = new Date().toISOString().slice(0, 7) + '-01';

  const totalToday = entries.filter(e => e.date === today).reduce((s, e) => s + e.amount, 0);
  const totalWeek = entries.filter(e => e.date >= weekStart).reduce((s, e) => s + e.amount, 0);
  const totalMonth = entries.filter(e => e.date >= monthStart).reduce((s, e) => s + e.amount, 0);
  const totalAll = entries.reduce((s, e) => s + e.amount, 0);

  const byCategory = CATEGORIES.map(c => ({
    name: c,
    total: entries.filter(e => e.category === c).reduce((s, e) => s + e.amount, 0)
  }));

  const chartData = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(Date.now() - (29 - i) * 864e5).toISOString().split('T')[0];
    const total = entries.filter(e => e.date === d).reduce((s, e) => s + e.amount, 0);
    return { date: d.slice(5), total };
  });

  const filtered = filterCat === 'all' ? entries : entries.filter(e => e.category === filterCat);

  async function save() {
    if (!form.amount || !form.date) return;
    await fetch('/api/income', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, amount: Number(form.amount) }) });
    setForm({ amount: '', category: 'E-Commerce', description: '', date: today });
    setShowForm(false); load();
  }

  async function del(id: number) {
    await fetch(`/api/income/${id}`, { method: 'DELETE' });
    load();
  }

  const inp = { background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#fff', borderRadius: 8, padding: '8px 12px', fontSize: 13, width: '100%', outline: 'none' };

  return (
    <div style={{ padding: 32, maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.03em' }}>Income</h1>
          <p style={{ color: '#a1a1aa', fontSize: 13, marginTop: 3 }}>Einkommensübersicht</p>
        </div>
        <button onClick={() => setShowForm(s => !s)} style={{ background: '#fff', color: '#000', border: 'none', padding: '10px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>+ Eintrag</button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Heute', value: fmt(totalToday), color: totalToday >= 0 ? '#22c55e' : '#ef4444' },
          { label: 'Diese Woche', value: fmt(totalWeek), color: totalWeek >= 0 ? '#22c55e' : '#ef4444' },
          { label: 'Dieser Monat', value: fmt(totalMonth), color: totalMonth >= 0 ? '#22c55e' : '#ef4444' },
          { label: 'Gesamt', value: fmt(totalAll), color: '#fff' },
        ].map(s => (
          <div key={s.label} style={{ background: '#111', border: '1px solid #1f1f1f', borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 11, color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: s.color, letterSpacing: '-0.02em' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 24 }}>
        <div style={{ background: '#111', border: '1px solid #1f1f1f', borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 11, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>30-Tage Verlauf</div>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fill: '#52525b', fontSize: 10 }} axisLine={false} tickLine={false} interval={4} />
              <YAxis tick={{ fill: '#52525b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#111', border: '1px solid #1f1f1f', borderRadius: 8, fontSize: 12 }} formatter={(v) => [fmt(Number(v))]} />
              <Area type="monotone" dataKey="total" stroke="#22c55e" strokeWidth={2} fill="url(#g)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: '#111', border: '1px solid #1f1f1f', borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 11, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>Nach Quelle</div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={byCategory} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fill: '#52525b', fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#52525b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#111', border: '1px solid #1f1f1f', borderRadius: 8, fontSize: 12 }} formatter={(v) => [fmt(Number(v))]} />
              <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                {byCategory.map((entry) => <Cell key={entry.name} fill={CAT_COLORS[entry.name]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div style={{ background: '#111', border: '1px solid #2a2a2a', borderRadius: 12, padding: 20, marginBottom: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, alignItems: 'end' }}>
            <div>
              <label style={{ fontSize: 11, color: '#a1a1aa', display: 'block', marginBottom: 4 }}>Betrag (€) *</label>
              <input style={inp} type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0.00" />
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#a1a1aa', display: 'block', marginBottom: 4 }}>Kategorie</label>
              <select style={inp} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#a1a1aa', display: 'block', marginBottom: 4 }}>Datum</label>
              <input style={inp} type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#a1a1aa', display: 'block', marginBottom: 4 }}>Beschreibung</label>
              <input style={inp} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional..." />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            <button onClick={save} style={{ background: '#fff', color: '#000', border: 'none', padding: '9px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Speichern</button>
            <button onClick={() => setShowForm(false)} style={{ background: '#1a1a1a', color: '#fff', border: '1px solid #2a2a2a', padding: '9px 20px', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>Abbrechen</button>
          </div>
        </div>
      )}

      {/* Filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {['all', ...CATEGORIES].map(c => (
          <button key={c} onClick={() => setFilterCat(c)} style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer', background: filterCat === c ? '#fff' : '#1a1a1a', color: filterCat === c ? '#000' : '#a1a1aa', border: '1px solid ' + (filterCat === c ? '#fff' : '#2a2a2a') }}>
            {c === 'all' ? 'Alle' : c}
          </button>
        ))}
      </div>

      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {filtered.slice(0, 50).map(e => (
          <div key={e.id} style={{ background: '#111', border: '1px solid #1f1f1f', borderRadius: 8, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 3, height: 32, borderRadius: 2, background: CAT_COLORS[e.category], flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{e.description || e.category}</div>
              <div style={{ fontSize: 11, color: '#52525b', marginTop: 2 }}>
                {e.category} · {new Date(e.date).toLocaleDateString('de-DE')}
              </div>
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: e.amount >= 0 ? '#22c55e' : '#ef4444' }}>{fmt(e.amount)}</div>
            <button onClick={() => del(e.id)} style={{ background: 'none', border: 'none', color: '#3f3f46', cursor: 'pointer', fontSize: 14 }}>✕</button>
          </div>
        ))}
      </div>
    </div>
  );
}
