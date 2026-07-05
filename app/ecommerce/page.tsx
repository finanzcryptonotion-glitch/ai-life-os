'use client';
import { useEffect, useState } from 'react';
import type { EcommerceEntry } from '@/types';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

function fmt(n: number) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}

const empty = { revenue: '', profit: '', ad_spend: '', orders: '', conversion_rate: '', notes: '', date: new Date().toISOString().split('T')[0] };

export default function EcommercePage() {
  const [entries, setEntries] = useState<EcommerceEntry[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(empty);

  const load = () => fetch('/api/ecommerce').then(r => r.json()).then(setEntries);
  useEffect(() => { load(); }, []);

  const totals = entries.reduce((acc, e) => ({
    revenue: acc.revenue + e.revenue,
    profit: acc.profit + e.profit,
    ad_spend: acc.ad_spend + e.ad_spend,
    orders: acc.orders + e.orders,
  }), { revenue: 0, profit: 0, ad_spend: 0, orders: 0 });

  const roas = totals.ad_spend > 0 ? (totals.revenue / totals.ad_spend).toFixed(2) : '—';

  const chartData = [...entries].reverse().slice(0, 14).map(e => ({
    date: e.date.slice(5), revenue: e.revenue, profit: e.profit, ad_spend: e.ad_spend
  }));

  async function save() {
    await fetch('/api/ecommerce', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ revenue: Number(form.revenue), profit: Number(form.profit), ad_spend: Number(form.ad_spend), orders: Number(form.orders), conversion_rate: Number(form.conversion_rate), notes: form.notes, date: form.date })
    });
    setForm(empty); setShowForm(false); load();
  }

  const inp = { background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#fff', borderRadius: 8, padding: '8px 12px', fontSize: 13, width: '100%', outline: 'none' };
  const tooltipStyle = { background: '#111', border: '1px solid #1f1f1f', borderRadius: 8, fontSize: 12 };

  return (
    <div style={{ padding: 32, maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.03em' }}>E-Commerce</h1>
          <p style={{ color: '#a1a1aa', fontSize: 13, marginTop: 3 }}>Shopify Store Performance</p>
        </div>
        <button onClick={() => setShowForm(s => !s)} style={{ background: '#fff', color: '#000', border: 'none', padding: '10px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>+ Eintrag</button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Revenue', value: fmt(totals.revenue), color: '#22c55e' },
          { label: 'Profit', value: fmt(totals.profit), color: '#22c55e' },
          { label: 'Ad Spend', value: fmt(totals.ad_spend), color: '#ef4444' },
          { label: 'Orders', value: String(totals.orders), color: '#3b82f6' },
          { label: 'ROAS', value: String(roas), color: '#f97316' },
        ].map(s => (
          <div key={s.label} style={{ background: '#111', border: '1px solid #1f1f1f', borderRadius: 12, padding: 18 }}>
            <div style={{ fontSize: 10, color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color, letterSpacing: '-0.02em' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 24 }}>
        <div style={{ background: '#111', border: '1px solid #1f1f1f', borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 11, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>Revenue vs Profit (14 Tage)</div>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="date" tick={{ fill: '#52525b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#52525b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [fmt(Number(v))]} />
              <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} fill="#3b82f620" />
              <Area type="monotone" dataKey="profit" stroke="#22c55e" strokeWidth={2} fill="#22c55e20" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: '#111', border: '1px solid #1f1f1f', borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 11, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>Ad Spend</div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="date" tick={{ fill: '#52525b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#52525b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [fmt(Number(v))]} />
              <Bar dataKey="ad_spend" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div style={{ background: '#111', border: '1px solid #2a2a2a', borderRadius: 12, padding: 20, marginBottom: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {[
              { key: 'revenue', label: 'Revenue (€)' }, { key: 'profit', label: 'Profit (€)' },
              { key: 'ad_spend', label: 'Ad Spend (€)' }, { key: 'orders', label: 'Orders' },
              { key: 'conversion_rate', label: 'Conv. Rate (%)' }, { key: 'date', label: 'Datum', type: 'date' },
            ].map(f => (
              <div key={f.key}>
                <label style={{ fontSize: 11, color: '#a1a1aa', display: 'block', marginBottom: 4 }}>{f.label}</label>
                <input style={inp} type={f.type || 'number'} value={(form as Record<string, string>)[f.key]} onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))} />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            <button onClick={save} style={{ background: '#fff', color: '#000', border: 'none', padding: '9px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Speichern</button>
            <button onClick={() => setShowForm(false)} style={{ background: '#1a1a1a', color: '#fff', border: '1px solid #2a2a2a', padding: '9px 20px', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>Abbrechen</button>
          </div>
        </div>
      )}

      {/* Table */}
      <div style={{ background: '#111', border: '1px solid #1f1f1f', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr 1fr 1fr 80px 80px', gap: 0, padding: '10px 16px', borderBottom: '1px solid #1f1f1f' }}>
          {['Datum', 'Revenue', 'Profit', 'Ad Spend', 'Orders', 'ROAS'].map(h => (
            <div key={h} style={{ fontSize: 10, color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</div>
          ))}
        </div>
        {entries.slice(0, 20).map(e => (
          <div key={e.id} style={{ display: 'grid', gridTemplateColumns: '100px 1fr 1fr 1fr 80px 80px', gap: 0, padding: '12px 16px', borderBottom: '1px solid #1a1a1a', alignItems: 'center' }}>
            <div style={{ fontSize: 12, color: '#a1a1aa' }}>{new Date(e.date).toLocaleDateString('de-DE')}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#22c55e' }}>{fmt(e.revenue)}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: e.profit >= 0 ? '#22c55e' : '#ef4444' }}>{fmt(e.profit)}</div>
            <div style={{ fontSize: 13, color: '#ef4444' }}>{fmt(e.ad_spend)}</div>
            <div style={{ fontSize: 13, color: '#3b82f6' }}>{e.orders}</div>
            <div style={{ fontSize: 13, color: '#f97316' }}>{e.ad_spend > 0 ? (e.revenue / e.ad_spend).toFixed(2) : '—'}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
