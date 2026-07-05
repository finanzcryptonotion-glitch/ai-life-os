'use client';
import { useEffect, useState } from 'react';
import type { Goal } from '@/types';

const CATEGORIES = ['Business', 'Financial', 'Fitness', 'Personal', 'Learning', 'Relationships'];
const PRIORITIES = ['high', 'medium', 'low'];
const STATUSES = ['active', 'completed', 'paused'];

const emptyGoal = { title: '', description: '', category: 'Personal', target_date: '', status: 'active', priority: 'medium', progress: 0, notes: '' };

function priorityColor(p: string) {
  return p === 'high' ? '#ef4444' : p === 'medium' ? '#f97316' : '#71717a';
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [filter, setFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyGoal);
  const [editing, setEditing] = useState<Goal | null>(null);

  const load = () => fetch('/api/goals').then(r => r.json()).then(setGoals);
  useEffect(() => { load(); }, []);

  const filtered = filter === 'all' ? goals : goals.filter(g => g.status === filter || g.category === filter);

  async function save() {
    if (!form.title.trim()) return;
    if (editing) {
      await fetch(`/api/goals/${editing.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    } else {
      await fetch('/api/goals', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    }
    setForm(emptyGoal); setShowForm(false); setEditing(null); load();
  }

  async function del(id: number) {
    if (!confirm('Ziel löschen?')) return;
    await fetch(`/api/goals/${id}`, { method: 'DELETE' });
    load();
  }

  function startEdit(g: Goal) {
    setEditing(g);
    setForm({ title: g.title, description: g.description, category: g.category, target_date: g.target_date, status: g.status, priority: g.priority, progress: g.progress, notes: g.notes });
    setShowForm(true);
  }

  const inp = { background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#fff', borderRadius: 8, padding: '8px 12px', fontSize: 13, width: '100%', outline: 'none' };

  return (
    <div style={{ padding: 32, maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.03em' }}>Goals</h1>
          <p style={{ color: '#a1a1aa', fontSize: 13, marginTop: 3 }}>{goals.filter(g => g.status === 'active').length} aktive Ziele</p>
        </div>
        <button onClick={() => { setEditing(null); setForm(emptyGoal); setShowForm(true); }} style={{
          background: '#fff', color: '#000', border: 'none', padding: '10px 18px',
          borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer'
        }}>+ Neues Ziel</button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {['all', 'active', 'completed', ...CATEGORIES].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '5px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer', fontWeight: 500,
            background: filter === f ? '#fff' : '#1a1a1a',
            color: filter === f ? '#000' : '#a1a1aa',
            border: '1px solid ' + (filter === f ? '#fff' : '#2a2a2a'),
          }}>{f === 'all' ? 'Alle' : f}</button>
        ))}
      </div>

      {/* Form */}
      {showForm && (
        <div style={{ background: '#111', border: '1px solid #2a2a2a', borderRadius: 12, padding: 24, marginBottom: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>{editing ? 'Ziel bearbeiten' : 'Neues Ziel'}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={{ fontSize: 11, color: '#a1a1aa', display: 'block', marginBottom: 4 }}>Titel *</label>
              <input style={inp} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Ziel-Titel..." />
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={{ fontSize: 11, color: '#a1a1aa', display: 'block', marginBottom: 4 }}>Beschreibung</label>
              <textarea style={{ ...inp, height: 80, resize: 'vertical' }} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Details..." />
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#a1a1aa', display: 'block', marginBottom: 4 }}>Kategorie</label>
              <select style={inp} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#a1a1aa', display: 'block', marginBottom: 4 }}>Priorität</label>
              <select style={inp} value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#a1a1aa', display: 'block', marginBottom: 4 }}>Zieldatum</label>
              <input style={inp} type="date" value={form.target_date} onChange={e => setForm(f => ({ ...f, target_date: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#a1a1aa', display: 'block', marginBottom: 4 }}>Status</label>
              <select style={inp} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={{ fontSize: 11, color: '#a1a1aa', display: 'block', marginBottom: 4 }}>Fortschritt: {form.progress}%</label>
              <input type="range" min={0} max={100} value={form.progress} onChange={e => setForm(f => ({ ...f, progress: Number(e.target.value) }))} style={{ width: '100%', accentColor: '#22c55e' }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button onClick={save} style={{ background: '#fff', color: '#000', border: 'none', padding: '9px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              {editing ? 'Speichern' : 'Erstellen'}
            </button>
            <button onClick={() => { setShowForm(false); setEditing(null); }} style={{ background: '#1a1a1a', color: '#fff', border: '1px solid #2a2a2a', padding: '9px 20px', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {/* Goals Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
        {filtered.map(g => (
          <div key={g.id} style={{ background: '#111', border: '1px solid #1f1f1f', borderRadius: 12, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', gap: 6 }}>
                <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 20, background: '#1a1a1a', color: '#a1a1aa', border: '1px solid #2a2a2a' }}>{g.category}</span>
                <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 20, background: '#1a1a1a', color: priorityColor(g.priority), border: '1px solid #2a2a2a' }}>{g.priority}</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => startEdit(g)} style={{ background: 'none', border: 'none', color: '#a1a1aa', cursor: 'pointer', fontSize: 12, padding: '2px 6px' }}>✏️</button>
                <button onClick={() => del(g.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 12, padding: '2px 6px' }}>✕</button>
              </div>
            </div>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 6, lineHeight: 1.3 }}>{g.title}</h3>
            {g.description && <p style={{ fontSize: 12, color: '#71717a', marginBottom: 12, lineHeight: 1.5 }}>{g.description}</p>}
            <div style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontSize: 11, color: '#a1a1aa' }}>Fortschritt</span>
                <span style={{ fontSize: 11, color: '#22c55e', fontWeight: 600 }}>{g.progress}%</span>
              </div>
              <div style={{ background: '#1a1a1a', borderRadius: 4, height: 6, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${g.progress}%`, background: g.progress >= 70 ? '#22c55e' : g.progress >= 40 ? '#f97316' : '#3b82f6', borderRadius: 4 }} />
              </div>
            </div>
            {g.target_date && (
              <p style={{ fontSize: 11, color: '#52525b', marginTop: 8 }}>
                🎯 {new Date(g.target_date).toLocaleDateString('de-DE', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
