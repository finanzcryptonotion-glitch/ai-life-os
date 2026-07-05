'use client';
import { useEffect, useState } from 'react';
import type { CalendarEvent } from '@/types';

const CATEGORIES = ['General', 'Trading', 'Business', 'Health', 'Personal'];
const CAT_COLORS: Record<string, string> = { Trading: '#3b82f6', Business: '#f97316', Health: '#22c55e', Personal: '#a855f7', General: '#71717a' };
const empty = { title: '', date: new Date().toISOString().split('T')[0], time: '09:00', duration_minutes: 60, category: 'General', location: '', notes: '' };

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState<CalendarEvent | null>(null);
  const today = new Date().toISOString().split('T')[0];

  const load = () => fetch('/api/events').then(r => r.json()).then(setEvents);
  useEffect(() => { load(); }, []);

  const upcoming = events.filter(e => e.date >= today).slice(0, 20);
  const past = events.filter(e => e.date < today).slice(0, 10);

  async function save() {
    if (!form.title.trim() || !form.date) return;
    if (editing) {
      await fetch(`/api/events/${editing.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    } else {
      await fetch('/api/events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    }
    setForm(empty); setShowForm(false); setEditing(null); load();
  }

  async function del(id: number) {
    await fetch(`/api/events/${id}`, { method: 'DELETE' });
    load();
  }

  function startEdit(e: CalendarEvent) {
    setEditing(e);
    setForm({ title: e.title, date: e.date, time: e.time, duration_minutes: e.duration_minutes, category: e.category, location: e.location, notes: e.notes });
    setShowForm(true);
  }

  const inp = { background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#fff', borderRadius: 8, padding: '8px 12px', fontSize: 13, width: '100%', outline: 'none' };

  function EventRow({ e }: { e: CalendarEvent }) {
    const isToday = e.date === today;
    return (
      <div style={{ background: '#111', border: `1px solid ${isToday ? '#1e3a5f' : '#1f1f1f'}`, borderRadius: 10, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 3, height: 40, borderRadius: 2, background: CAT_COLORS[e.category] || '#71717a', flexShrink: 0 }} />
        <div style={{ minWidth: 80 }}>
          <div style={{ fontSize: 12, color: '#3b82f6', fontWeight: 600 }}>{e.time || '—'}</div>
          <div style={{ fontSize: 11, color: '#52525b' }}>{e.duration_minutes}min</div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 500 }}>{e.title}</div>
          <div style={{ fontSize: 11, color: '#52525b', marginTop: 2 }}>
            {new Date(e.date).toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' })}
            {e.location ? ` · ${e.location}` : ''}
          </div>
        </div>
        <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 20, background: '#1a1a1a', color: CAT_COLORS[e.category], border: '1px solid #2a2a2a' }}>{e.category}</span>
        <button onClick={() => startEdit(e)} style={{ background: 'none', border: 'none', color: '#a1a1aa', cursor: 'pointer', fontSize: 14 }}>✏️</button>
        <button onClick={() => del(e.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 14 }}>✕</button>
      </div>
    );
  }

  return (
    <div style={{ padding: 32, maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.03em' }}>Calendar</h1>
          <p style={{ color: '#a1a1aa', fontSize: 13, marginTop: 3 }}>{events.filter(e => e.date === today).length} Termine heute</p>
        </div>
        <button onClick={() => { setEditing(null); setForm({ ...empty, date: today }); setShowForm(true); }} style={{ background: '#fff', color: '#000', border: 'none', padding: '10px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>+ Neuer Termin</button>
      </div>

      {showForm && (
        <div style={{ background: '#111', border: '1px solid #2a2a2a', borderRadius: 12, padding: 24, marginBottom: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>{editing ? 'Termin bearbeiten' : 'Neuer Termin'}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={{ fontSize: 11, color: '#a1a1aa', display: 'block', marginBottom: 4 }}>Titel *</label>
              <input style={inp} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Termin-Titel..." />
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#a1a1aa', display: 'block', marginBottom: 4 }}>Datum *</label>
              <input style={inp} type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#a1a1aa', display: 'block', marginBottom: 4 }}>Uhrzeit</label>
              <input style={inp} type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#a1a1aa', display: 'block', marginBottom: 4 }}>Dauer (Min)</label>
              <input style={inp} type="number" value={form.duration_minutes} onChange={e => setForm(f => ({ ...f, duration_minutes: Number(e.target.value) }))} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#a1a1aa', display: 'block', marginBottom: 4 }}>Kategorie</label>
              <select style={inp} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={{ fontSize: 11, color: '#a1a1aa', display: 'block', marginBottom: 4 }}>Ort</label>
              <input style={inp} value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Ort / Link..." />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button onClick={save} style={{ background: '#fff', color: '#000', border: 'none', padding: '9px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{editing ? 'Speichern' : 'Erstellen'}</button>
            <button onClick={() => { setShowForm(false); setEditing(null); }} style={{ background: '#1a1a1a', color: '#fff', border: '1px solid #2a2a2a', padding: '9px 20px', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>Abbrechen</button>
          </div>
        </div>
      )}

      <h2 style={{ fontSize: 14, fontWeight: 600, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Kommende Termine</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 32 }}>
        {upcoming.length === 0 && <p style={{ color: '#52525b', fontSize: 13 }}>Keine kommenden Termine.</p>}
        {upcoming.map(e => <EventRow key={e.id} e={e} />)}
      </div>

      {past.length > 0 && (
        <>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: '#3f3f46', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Vergangene Termine</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, opacity: 0.6 }}>
            {past.map(e => <EventRow key={e.id} e={e} />)}
          </div>
        </>
      )}
    </div>
  );
}
