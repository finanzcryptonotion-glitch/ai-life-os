'use client';
import { useEffect, useState } from 'react';
import type { Note } from '@/types';

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selected, setSelected] = useState<Note | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ title: '', body: '' });
  const [search, setSearch] = useState('');

  const load = () => fetch('/api/notes').then(r => r.json()).then((data: Note[]) => { setNotes(data); if (data.length && !selected) setSelected(data[0]); });
  useEffect(() => { load(); }, []);

  const filtered = notes.filter(n => n.title.toLowerCase().includes(search.toLowerCase()) || n.body?.toLowerCase().includes(search.toLowerCase()));

  async function save() {
    if (!form.title.trim()) return;
    if (selected && editing) {
      const updated = await fetch(`/api/notes/${selected.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) }).then(r => r.json());
      setSelected(updated);
    } else {
      const created = await fetch('/api/notes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) }).then(r => r.json());
      setSelected(created);
    }
    setEditing(false); load();
  }

  async function del(id: number) {
    if (!confirm('Notiz löschen?')) return;
    await fetch(`/api/notes/${id}`, { method: 'DELETE' });
    setSelected(null); load();
  }

  function newNote() {
    setSelected(null);
    setForm({ title: '', body: '' });
    setEditing(true);
  }

  function startEdit(n: Note) {
    setForm({ title: n.title, body: n.body || '' });
    setEditing(true);
  }

  const inp = { background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#fff', borderRadius: 8, padding: '8px 12px', fontSize: 13, width: '100%', outline: 'none' };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 0px)', overflow: 'hidden' }}>
      {/* Sidebar */}
      <div style={{ width: 280, borderRight: '1px solid #1f1f1f', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '24px 16px 16px', borderBottom: '1px solid #1f1f1f' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h1 style={{ fontSize: 18, fontWeight: 700 }}>Notes</h1>
            <button onClick={newNote} style={{ background: '#fff', color: '#000', border: 'none', width: 28, height: 28, borderRadius: 6, fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
          </div>
          <input style={inp} placeholder="Suchen..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
          {filtered.map(n => (
            <div key={n.id} onClick={() => { setSelected(n); setEditing(false); }} style={{
              padding: '12px', borderRadius: 8, cursor: 'pointer', marginBottom: 4,
              background: selected?.id === n.id ? '#1a1a1a' : 'transparent',
              border: `1px solid ${selected?.id === n.id ? '#2a2a2a' : 'transparent'}`,
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.title}</div>
              <div style={{ fontSize: 11, color: '#52525b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.body?.slice(0, 60) || '—'}</div>
              <div style={{ fontSize: 10, color: '#3f3f46', marginTop: 4 }}>{new Date(n.updated_at).toLocaleDateString('de-DE')}</div>
            </div>
          ))}
          {filtered.length === 0 && <p style={{ color: '#52525b', fontSize: 12, padding: 12 }}>Keine Notizen.</p>}
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {editing ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 28, gap: 16 }}>
            <input style={{ ...inp, fontSize: 22, fontWeight: 700, background: 'transparent', border: 'none', borderBottom: '1px solid #1f1f1f', borderRadius: 0, padding: '0 0 12px 0' }}
              placeholder="Titel..." value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            <textarea style={{ ...inp, flex: 1, resize: 'none', background: 'transparent', border: 'none', fontSize: 14, lineHeight: 1.7, padding: 0, fontFamily: 'inherit' }}
              placeholder="Schreib hier deine Notiz..." value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} />
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={save} style={{ background: '#fff', color: '#000', border: 'none', padding: '9px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Speichern</button>
              <button onClick={() => setEditing(false)} style={{ background: '#1a1a1a', color: '#fff', border: '1px solid #2a2a2a', padding: '9px 20px', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>Abbrechen</button>
            </div>
          </div>
        ) : selected ? (
          <div style={{ flex: 1, overflowY: 'auto', padding: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em' }}>{selected.title}</h2>
                <p style={{ fontSize: 12, color: '#52525b', marginTop: 4 }}>
                  Erstellt: {new Date(selected.created_at).toLocaleDateString('de-DE')} · Geändert: {new Date(selected.updated_at).toLocaleDateString('de-DE')}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => startEdit(selected)} style={{ background: '#1a1a1a', color: '#fff', border: '1px solid #2a2a2a', padding: '7px 14px', borderRadius: 7, fontSize: 12, cursor: 'pointer' }}>✏️ Bearbeiten</button>
                <button onClick={() => del(selected.id)} style={{ background: '#1a0a0a', color: '#ef4444', border: '1px solid #2a1010', padding: '7px 14px', borderRadius: 7, fontSize: 12, cursor: 'pointer' }}>Löschen</button>
              </div>
            </div>
            <div style={{ fontSize: 14, lineHeight: 1.8, color: '#d4d4d8', whiteSpace: 'pre-wrap' }}>{selected.body || '(Leer)'}</div>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
            <p style={{ color: '#52525b', fontSize: 14 }}>Notiz auswählen oder neu erstellen</p>
            <button onClick={newNote} style={{ background: '#fff', color: '#000', border: 'none', padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>+ Neue Notiz</button>
          </div>
        )}
      </div>
    </div>
  );
}
