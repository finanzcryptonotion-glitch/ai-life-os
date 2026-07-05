'use client';
import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

type Category = { id: number; name: string; type: string; monthly_budget: number; color: string; icon: string };
type Entry = { id: number; category_id: number; amount: number; description: string; date: string; type: string };

function fmt(n: number) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}

const DEFAULT_CATS = [
  { name: 'Miete', type: 'expense', monthly_budget: 1200, color: '#ef4444', icon: '🏠' },
  { name: 'Essen', type: 'expense', monthly_budget: 400, color: '#f97316', icon: '🍔' },
  { name: 'Transport', type: 'expense', monthly_budget: 200, color: '#eab308', icon: '🚗' },
  { name: 'Fitness', type: 'expense', monthly_budget: 100, color: '#22c55e', icon: '💪' },
  { name: 'Software/Tools', type: 'expense', monthly_budget: 150, color: '#3b82f6', icon: '💻' },
  { name: 'Sonstiges', type: 'expense', monthly_budget: 300, color: '#71717a', icon: '📦' },
];

export default function BudgetPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [showEntry, setShowEntry] = useState(false);
  const [showCat, setShowCat] = useState(false);
  const [entryForm, setEntryForm] = useState({ category_id: '', amount: '', description: '', date: new Date().toISOString().split('T')[0], type: 'expense' });
  const [catForm, setCatForm] = useState({ name: '', monthly_budget: '', color: '#ef4444', icon: '💰', type: 'expense' });

  const load = () => fetch('/api/budget').then(r => r.json()).then(d => { setCategories(d.categories || []); setEntries(d.entries || []); });
  useEffect(() => { load(); }, []);

  async function addDefaults() {
    for (const c of DEFAULT_CATS) {
      await fetch('/api/budget', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...c, _type: 'category' }) });
    }
    load();
  }

  async function addEntry() {
    if (!entryForm.amount || !entryForm.category_id) return;
    await fetch('/api/budget', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...entryForm, amount: Number(entryForm.amount), category_id: Number(entryForm.category_id) }) });
    setEntryForm({ category_id: '', amount: '', description: '', date: new Date().toISOString().split('T')[0], type: 'expense' });
    setShowEntry(false);
    load();
  }

  async function addCategory() {
    if (!catForm.name.trim()) return;
    await fetch('/api/budget', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...catForm, monthly_budget: Number(catForm.monthly_budget), _type: 'category' }) });
    setCatForm({ name: '', monthly_budget: '', color: '#ef4444', icon: '💰', type: 'expense' });
    setShowCat(false);
    load();
  }

  async function deleteEntry(id: number) {
    await fetch('/api/budget', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    load();
  }

  const totalExpenses = entries.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0);
  const totalBudget = categories.filter(c => c.type === 'expense').reduce((s, c) => s + c.monthly_budget, 0);
  const remaining = totalBudget - totalExpenses;

  const chartData = categories.filter(c => c.type === 'expense').map(c => {
    const spent = entries.filter(e => e.category_id === c.id).reduce((s, e) => s + e.amount, 0);
    return { name: c.icon + ' ' + c.name, spent, budget: c.monthly_budget, color: c.color };
  }).filter(d => d.budget > 0 || d.spent > 0);

  const inp = { background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#fff', borderRadius: 8, padding: '9px 12px', fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box' as const };

  return (
    <div style={{ padding: 32, maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 4 }}>Budget Planer</h1>
          <p style={{ color: '#a1a1aa', fontSize: 13 }}>{new Date().toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {categories.length === 0 && (
            <button onClick={addDefaults} style={{ background: '#1a1a1a', color: '#a1a1aa', border: '1px solid #2a2a2a', padding: '10px 16px', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>
              Standard-Kategorien laden
            </button>
          )}
          <button onClick={() => setShowCat(s => !s)} style={{ background: '#1a1a1a', color: '#a1a1aa', border: '1px solid #2a2a2a', padding: '10px 16px', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>
            + Kategorie
          </button>
          <button onClick={() => setShowEntry(s => !s)} style={{ background: '#fff', color: '#000', border: 'none', padding: '10px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={14} /> Ausgabe eintragen
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Monatsbudget', value: fmt(totalBudget), color: '#a1a1aa' },
          { label: 'Ausgegeben', value: fmt(totalExpenses), color: '#ef4444' },
          { label: 'Verbleibend', value: fmt(remaining), color: remaining >= 0 ? '#22c55e' : '#ef4444' },
        ].map(s => (
          <div key={s.label} style={{ background: '#111', border: '1px solid #1f1f1f', borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 11, color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Category Form */}
      {showCat && (
        <div style={{ background: '#111', border: '1px solid #1f1f1f', borderRadius: 12, padding: 20, marginBottom: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px 120px', gap: 12, marginBottom: 12 }}>
            <div><label style={{ fontSize: 11, color: '#a1a1aa', display: 'block', marginBottom: 5 }}>Name</label><input style={inp} value={catForm.name} onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))} placeholder="Kategorie" /></div>
            <div><label style={{ fontSize: 11, color: '#a1a1aa', display: 'block', marginBottom: 5 }}>Monatsbudget (€)</label><input style={inp} type="number" value={catForm.monthly_budget} onChange={e => setCatForm(f => ({ ...f, monthly_budget: e.target.value }))} placeholder="500" /></div>
            <div><label style={{ fontSize: 11, color: '#a1a1aa', display: 'block', marginBottom: 5 }}>Icon</label><input style={inp} value={catForm.icon} onChange={e => setCatForm(f => ({ ...f, icon: e.target.value }))} placeholder="🍔" /></div>
            <div><label style={{ fontSize: 11, color: '#a1a1aa', display: 'block', marginBottom: 5 }}>Farbe</label><input style={{ ...inp, padding: '5px' }} type="color" value={catForm.color} onChange={e => setCatForm(f => ({ ...f, color: e.target.value }))} /></div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={addCategory} style={{ background: '#fff', color: '#000', border: 'none', padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Speichern</button>
            <button onClick={() => setShowCat(false)} style={{ background: 'transparent', color: '#71717a', border: '1px solid #2a2a2a', padding: '8px 14px', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>Abbrechen</button>
          </div>
        </div>
      )}

      {/* Entry Form */}
      {showEntry && (
        <div style={{ background: '#111', border: '1px solid #1f1f1f', borderRadius: 12, padding: 20, marginBottom: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 1fr 140px', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontSize: 11, color: '#a1a1aa', display: 'block', marginBottom: 5 }}>Kategorie</label>
              <select style={inp} value={entryForm.category_id} onChange={e => setEntryForm(f => ({ ...f, category_id: e.target.value }))}>
                <option value="">Wählen...</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
            </div>
            <div><label style={{ fontSize: 11, color: '#a1a1aa', display: 'block', marginBottom: 5 }}>Betrag (€)</label><input style={inp} type="number" value={entryForm.amount} onChange={e => setEntryForm(f => ({ ...f, amount: e.target.value }))} placeholder="0" /></div>
            <div><label style={{ fontSize: 11, color: '#a1a1aa', display: 'block', marginBottom: 5 }}>Beschreibung</label><input style={inp} value={entryForm.description} onChange={e => setEntryForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional" /></div>
            <div><label style={{ fontSize: 11, color: '#a1a1aa', display: 'block', marginBottom: 5 }}>Datum</label><input style={inp} type="date" value={entryForm.date} onChange={e => setEntryForm(f => ({ ...f, date: e.target.value }))} /></div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={addEntry} style={{ background: '#fff', color: '#000', border: 'none', padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Eintragen</button>
            <button onClick={() => setShowEntry(false)} style={{ background: 'transparent', color: '#71717a', border: '1px solid #2a2a2a', padding: '8px 14px', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>Abbrechen</button>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Category Overview */}
        <div style={{ background: '#111', border: '1px solid #1f1f1f', borderRadius: 12, padding: 24 }}>
          <h2 style={{ fontSize: 13, fontWeight: 600, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 18 }}>Kategorien</h2>
          {chartData.length === 0 ? <p style={{ color: '#52525b', fontSize: 13 }}>Keine Kategorien. Lade Standard-Kategorien oder erstelle eigene.</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {chartData.map(d => {
                const pct = d.budget > 0 ? Math.min((d.spent / d.budget) * 100, 100) : 0;
                const over = d.budget > 0 && d.spent > d.budget;
                return (
                  <div key={d.name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{d.name}</span>
                      <span style={{ fontSize: 12, color: over ? '#ef4444' : '#a1a1aa' }}>{fmt(d.spent)} / {fmt(d.budget)}</span>
                    </div>
                    <div style={{ background: '#1a1a1a', borderRadius: 4, height: 5 }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: over ? '#ef4444' : d.color, borderRadius: 4, transition: 'width 0.4s' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Entries */}
        <div style={{ background: '#111', border: '1px solid #1f1f1f', borderRadius: 12, padding: 24 }}>
          <h2 style={{ fontSize: 13, fontWeight: 600, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 18 }}>Letzte Ausgaben</h2>
          {entries.length === 0 ? <p style={{ color: '#52525b', fontSize: 13 }}>Noch keine Einträge diesen Monat.</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 400, overflowY: 'auto' }}>
              {entries.slice(0, 20).map(e => {
                const cat = categories.find(c => c.id === e.category_id);
                return (
                  <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #0f0f0f' }}>
                    <span style={{ fontSize: 16 }}>{cat?.icon || '💰'}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{e.description || cat?.name || 'Ausgabe'}</div>
                      <div style={{ fontSize: 11, color: '#52525b' }}>{new Date(e.date).toLocaleDateString('de-DE')} · {cat?.name}</div>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#ef4444' }}>-{fmt(e.amount)}</span>
                    <button onClick={() => deleteEntry(e.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3f3f46', padding: 4 }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
