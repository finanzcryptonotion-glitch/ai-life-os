'use client';
import { useEffect, useState } from 'react';
import type { TradingEntry } from '@/types';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';

function fmt(n: number) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}

const empty = { account_balance: '', daily_pnl: '', win_rate: '', notes: '', journal: '', date: new Date().toISOString().split('T')[0] };

export default function TradingPage() {
  const [entries, setEntries] = useState<TradingEntry[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(empty);
  const [selected, setSelected] = useState<TradingEntry | null>(null);

  const load = () => fetch('/api/trading').then(r => r.json()).then((data: TradingEntry[]) => { setEntries(data); if (data.length) setSelected(data[0]); });
  useEffect(() => { load(); }, []);

  const latest = entries[0];
  const totalPnL = entries.reduce((s, e) => s + e.daily_pnl, 0);
  const wins = entries.filter(e => e.daily_pnl > 0).length;
  const avgWinRate = entries.length ? (wins / entries.length * 100).toFixed(0) : '0';

  const balanceChart = [...entries].reverse().map(e => ({ date: e.date.slice(5), balance: e.account_balance }));
  const pnlChart = [...entries].reverse().slice(0, 14).map(e => ({ date: e.date.slice(5), pnl: e.daily_pnl }));

  async function save() {
    await fetch('/api/trading', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ account_balance: Number(form.account_balance), daily_pnl: Number(form.daily_pnl), win_rate: Number(form.win_rate), notes: form.notes, journal: form.journal, date: form.date })
    });
    setForm(empty); setShowForm(false); load();
  }

  const inp = { background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#fff', borderRadius: 8, padding: '8px 12px', fontSize: 13, width: '100%', outline: 'none' };

  return (
    <div style={{ padding: 32, maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.03em' }}>Trading</h1>
          <p style={{ color: '#a1a1aa', fontSize: 13, marginTop: 3 }}>NQ Futures · ICT/SMC Strategy</p>
        </div>
        <button onClick={() => setShowForm(s => !s)} style={{ background: '#fff', color: '#000', border: 'none', padding: '10px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>+ Journal Eintrag</button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Account Balance', value: latest ? fmt(latest.account_balance) : '—', color: '#fff' },
          { label: 'Gesamt P&L', value: fmt(totalPnL), color: totalPnL >= 0 ? '#22c55e' : '#ef4444' },
          { label: 'Win Rate (ges.)', value: `${avgWinRate}%`, color: Number(avgWinRate) >= 60 ? '#22c55e' : '#f97316' },
          { label: 'Trades analysiert', value: String(entries.length), color: '#3b82f6' },
        ].map(s => (
          <div key={s.label} style={{ background: '#111', border: '1px solid #1f1f1f', borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 10, color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: s.color, letterSpacing: '-0.02em' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 24 }}>
        <div style={{ background: '#111', border: '1px solid #1f1f1f', borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 11, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>Account Balance Verlauf</div>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={balanceChart} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
              <defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} /><stop offset="95%" stopColor="#22c55e" stopOpacity={0} /></linearGradient></defs>
              <XAxis dataKey="date" tick={{ fill: '#52525b', fontSize: 10 }} axisLine={false} tickLine={false} interval={2} />
              <YAxis tick={{ fill: '#52525b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#111', border: '1px solid #1f1f1f', borderRadius: 8, fontSize: 12 }} formatter={(v) => [fmt(Number(v))]} />
              <Area type="monotone" dataKey="balance" stroke="#22c55e" strokeWidth={2} fill="url(#bg)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: '#111', border: '1px solid #1f1f1f', borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 11, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>Daily P&L</div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={pnlChart} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="date" tick={{ fill: '#52525b', fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#52525b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#111', border: '1px solid #1f1f1f', borderRadius: 8, fontSize: 12 }} formatter={(v) => [fmt(Number(v))]} />
              <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                {pnlChart.map((entry, i) => <Cell key={i} fill={entry.pnl >= 0 ? '#22c55e' : '#ef4444'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div style={{ background: '#111', border: '1px solid #2a2a2a', borderRadius: 12, padding: 20, marginBottom: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {[
              { key: 'account_balance', label: 'Account Balance (€)' }, { key: 'daily_pnl', label: 'Daily P&L (€)' },
              { key: 'win_rate', label: 'Win Rate (0–1, z.B. 0.65)' }, { key: 'date', label: 'Datum', type: 'date' },
            ].map(f => (
              <div key={f.key}>
                <label style={{ fontSize: 11, color: '#a1a1aa', display: 'block', marginBottom: 4 }}>{f.label}</label>
                <input style={inp} type={f.type || 'number'} step="any" value={(form as Record<string, string>)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
              </div>
            ))}
            <div style={{ gridColumn: '1/-1' }}>
              <label style={{ fontSize: 11, color: '#a1a1aa', display: 'block', marginBottom: 4 }}>Journal Notiz</label>
              <textarea style={{ ...inp, height: 80, resize: 'vertical' }} value={form.journal} onChange={e => setForm(p => ({ ...p, journal: e.target.value }))} placeholder="Was lief gut? Was war das Setup? Learnings..." />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            <button onClick={save} style={{ background: '#fff', color: '#000', border: 'none', padding: '9px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Speichern</button>
            <button onClick={() => setShowForm(false)} style={{ background: '#1a1a1a', color: '#fff', border: '1px solid #2a2a2a', padding: '9px 20px', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>Abbrechen</button>
          </div>
        </div>
      )}

      {/* Journal */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <h3 style={{ fontSize: 12, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Trading History</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {entries.slice(0, 14).map(e => (
              <div key={e.id} onClick={() => setSelected(e)} style={{ background: selected?.id === e.id ? '#1a1a1a' : '#111', border: `1px solid ${selected?.id === e.id ? '#2a2a2a' : '#1f1f1f'}`, borderRadius: 8, padding: '12px 14px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 12, color: '#a1a1aa' }}>{new Date(e.date).toLocaleDateString('de-DE')}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginTop: 2 }}>{fmt(e.account_balance)}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: e.daily_pnl >= 0 ? '#22c55e' : '#ef4444' }}>{e.daily_pnl >= 0 ? '+' : ''}{fmt(e.daily_pnl)}</div>
                  <div style={{ fontSize: 11, color: '#52525b' }}>WR: {(e.win_rate * 100).toFixed(0)}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h3 style={{ fontSize: 12, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Journal</h3>
          {selected ? (
            <div style={{ background: '#111', border: '1px solid #1f1f1f', borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 13, color: '#a1a1aa', marginBottom: 8 }}>{new Date(selected.date).toLocaleDateString('de-DE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div><div style={{ fontSize: 10, color: '#52525b', textTransform: 'uppercase' }}>Balance</div><div style={{ fontSize: 18, fontWeight: 700 }}>{fmt(selected.account_balance)}</div></div>
                <div><div style={{ fontSize: 10, color: '#52525b', textTransform: 'uppercase' }}>P&L</div><div style={{ fontSize: 18, fontWeight: 700, color: selected.daily_pnl >= 0 ? '#22c55e' : '#ef4444' }}>{fmt(selected.daily_pnl)}</div></div>
              </div>
              {selected.journal ? (
                <div style={{ background: '#0a0a0a', border: '1px solid #1f1f1f', borderRadius: 8, padding: 14, fontSize: 13, lineHeight: 1.7, color: '#d4d4d8', whiteSpace: 'pre-wrap' }}>{selected.journal}</div>
              ) : <p style={{ color: '#52525b', fontSize: 13 }}>Keine Journal-Notiz für diesen Tag.</p>}
            </div>
          ) : <p style={{ color: '#52525b', fontSize: 13 }}>Eintrag auswählen.</p>}
        </div>
      </div>
    </div>
  );
}
