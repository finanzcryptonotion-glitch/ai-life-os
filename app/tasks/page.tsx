'use client';
import { useEffect, useState } from 'react';
import type { Task } from '@/types';

const STATUSES = ['todo', 'today', 'in_progress', 'completed', 'archived'];
const STATUS_LABELS: Record<string, string> = { todo: 'Todo', today: 'Heute', in_progress: 'In Progress', completed: 'Erledigt', archived: 'Archiviert' };
const STATUS_COLORS: Record<string, string> = { todo: '#71717a', today: '#3b82f6', in_progress: '#f97316', completed: '#22c55e', archived: '#3f3f46' };
const PRIORITIES = ['high', 'medium', 'low'];
const PRIORITY_COLORS: Record<string, string> = { high: '#ef4444', medium: '#f97316', low: '#71717a' };

const empty = { title: '', description: '', category: 'General', priority: 'medium', due_date: '', estimated_minutes: 60, goal_id: null as number | null, status: 'todo' };

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState<Task | null>(null);
  const [activeStatus, setActiveStatus] = useState('all');

  const load = () => fetch('/api/tasks').then(r => r.json()).then(setTasks);
  useEffect(() => { load(); }, []);

  const filtered = activeStatus === 'all' ? tasks : tasks.filter(t => t.status === activeStatus);

  async function save() {
    if (!form.title.trim()) return;
    if (editing) {
      await fetch(`/api/tasks/${editing.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    } else {
      await fetch('/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    }
    setForm(empty); setShowForm(false); setEditing(null); load();
  }

  async function del(id: number) {
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
    load();
  }

  async function updateStatus(task: Task, status: string) {
    await fetch(`/api/tasks/${task.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...task, status }) });
    load();
  }

  function startEdit(t: Task) {
    setEditing(t);
    setForm({ title: t.title, description: t.description, category: t.category, priority: t.priority, due_date: t.due_date, estimated_minutes: t.estimated_minutes, goal_id: t.goal_id, status: t.status });
    setShowForm(true);
  }

  const inp = { background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#fff', borderRadius: 8, padding: '8px 12px', fontSize: 13, width: '100%', outline: 'none' };
  const today = new Date().toISOString().split('T')[0];

  return (
    <div style={{ padding: 32, maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.03em' }}>Tasks</h1>
          <p style={{ color: '#a1a1aa', fontSize: 13, marginTop: 3 }}>
            {tasks.filter(t => t.status === 'today' || t.status === 'in_progress').length} aktiv · {tasks.filter(t => t.status === 'completed').length} erledigt
          </p>
        </div>
        <button onClick={() => { setEditing(null); setForm(empty); setShowForm(true); }} style={{ background: '#fff', color: '#000', border: 'none', padding: '10px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>+ Neue Aufgabe</button>
      </div>

      {/* Status Filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {['all', ...STATUSES].map(s => (
          <button key={s} onClick={() => setActiveStatus(s)} style={{
            padding: '5px 14px', borderRadius: 20, fontSize: 12, cursor: 'pointer', fontWeight: 500,
            background: activeStatus === s ? '#fff' : '#1a1a1a',
            color: activeStatus === s ? '#000' : (s !== 'all' ? STATUS_COLORS[s] : '#a1a1aa'),
            border: '1px solid ' + (activeStatus === s ? '#fff' : '#2a2a2a'),
          }}>{s === 'all' ? 'Alle' : STATUS_LABELS[s]}</button>
        ))}
      </div>

      {/* Form */}
      {showForm && (
        <div style={{ background: '#111', border: '1px solid #2a2a2a', borderRadius: 12, padding: 24, marginBottom: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>{editing ? 'Aufgabe bearbeiten' : 'Neue Aufgabe'}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={{ fontSize: 11, color: '#a1a1aa', display: 'block', marginBottom: 4 }}>Titel *</label>
              <input style={inp} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Aufgabe..." />
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#a1a1aa', display: 'block', marginBottom: 4 }}>Priorität</label>
              <select style={inp} value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#a1a1aa', display: 'block', marginBottom: 4 }}>Status</label>
              <select style={inp} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#a1a1aa', display: 'block', marginBottom: 4 }}>Fällig am</label>
              <input style={inp} type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#a1a1aa', display: 'block', marginBottom: 4 }}>Dauer (Min)</label>
              <input style={inp} type="number" value={form.estimated_minutes} onChange={e => setForm(f => ({ ...f, estimated_minutes: Number(e.target.value) }))} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button onClick={save} style={{ background: '#fff', color: '#000', border: 'none', padding: '9px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              {editing ? 'Speichern' : 'Erstellen'}
            </button>
            <button onClick={() => { setShowForm(false); setEditing(null); }} style={{ background: '#1a1a1a', color: '#fff', border: '1px solid #2a2a2a', padding: '9px 20px', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>Abbrechen</button>
          </div>
        </div>
      )}

      {/* Tasks List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.length === 0 && <p style={{ color: '#52525b', fontSize: 13, textAlign: 'center', padding: 40 }}>Keine Aufgaben gefunden.</p>}
        {filtered.map(t => {
          const overdue = t.due_date && t.due_date < today && !['completed', 'archived'].includes(t.status);
          return (
            <div key={t.id} style={{ background: '#111', border: `1px solid ${overdue ? '#2a1010' : '#1f1f1f'}`, borderRadius: 10, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: STATUS_COLORS[t.status], flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 500, color: t.status === 'completed' ? '#52525b' : '#fff', textDecoration: t.status === 'completed' ? 'line-through' : 'none' }}>{t.title}</div>
                <div style={{ fontSize: 11, color: '#52525b', marginTop: 3, display: 'flex', gap: 10 }}>
                  <span style={{ color: PRIORITY_COLORS[t.priority] }}>{t.priority}</span>
                  {t.due_date && <span style={{ color: overdue ? '#ef4444' : '#52525b' }}>📅 {new Date(t.due_date).toLocaleDateString('de-DE')}</span>}
                  <span>⏱ {t.estimated_minutes}min</span>
                </div>
              </div>
              <select value={t.status} onChange={e => updateStatus(t, e.target.value)} style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: STATUS_COLORS[t.status], borderRadius: 6, padding: '4px 8px', fontSize: 11, cursor: 'pointer', outline: 'none' }}>
                {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>
              <button onClick={() => startEdit(t)} style={{ background: 'none', border: 'none', color: '#a1a1aa', cursor: 'pointer', fontSize: 14, padding: '2px 6px' }}>✏️</button>
              <button onClick={() => del(t.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 14, padding: '2px 6px' }}>✕</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
