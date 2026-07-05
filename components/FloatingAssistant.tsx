'use client';
import { useState, useRef, useEffect } from 'react';
import { Brain, Mic, MicOff, X, Send, ChevronDown } from 'lucide-react';

export default function FloatingAssistant() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [listening, setListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [mode, setMode] = useState<'chat' | 'action'>('action');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recRef = useRef<any>(null);

  useEffect(() => { return () => recRef.current?.stop(); }, []);

  function startListening() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setResult('Browser unterstützt keine Spracheingabe.'); return; }
    const rec = new SR();
    rec.lang = 'de-DE';
    rec.continuous = false;
    rec.interimResults = true;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (e: any) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setText(Array.from(e.results).map((r: any) => r[0].transcript).join(''));
    };
    rec.onend = () => setListening(false);
    recRef.current = rec;
    rec.start();
    setListening(true);
    setText('');
    setResult('');
  }

  function stopListening() { recRef.current?.stop(); setListening(false); }

  async function send() {
    if (!text.trim()) return;
    setLoading(true);
    setResult('');
    const endpoint = mode === 'action' ? '/api/voice' : '/api/ai';
    const body = mode === 'action' ? { text } : { prompt: text };
    try {
      const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      setResult(data.summary || data.content || data.error || 'Fehler');
      if (mode === 'action' && data.executed?.length) {
        setTimeout(() => window.location.reload(), 1800);
      }
    } catch { setResult('Verbindungsfehler'); }
    setText('');
    setLoading(false);
  }

  return (
    <>
      {/* Floating Button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          style={{
            position: 'fixed', bottom: 28, right: 28, zIndex: 1000,
            width: 52, height: 52, borderRadius: '50%', border: 'none',
            background: '#fff', cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'transform 0.15s'
          }}>
          <Brain size={22} color="#000" />
        </button>
      )}

      {/* Panel */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 28, right: 28, zIndex: 1000,
          width: 380, background: '#111', border: '1px solid #1f1f1f',
          borderRadius: 16, boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #1f1f1f', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Brain size={16} color="#a1a1aa" />
            <span style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>KI-Assistent</span>
            {/* Mode Toggle */}
            <div style={{ display: 'flex', background: '#1a1a1a', borderRadius: 6, padding: 2, gap: 2 }}>
              {(['action', 'chat'] as const).map(m => (
                <button key={m} onClick={() => setMode(m)} style={{
                  padding: '4px 10px', borderRadius: 4, border: 'none', fontSize: 11, fontWeight: 500,
                  background: mode === m ? '#2a2a2a' : 'transparent',
                  color: mode === m ? '#fff' : '#71717a', cursor: 'pointer'
                }}>
                  {m === 'action' ? 'Aktion' : 'Chat'}
                </button>
              ))}
            </div>
            <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#71717a', padding: 2 }}>
              <X size={15} />
            </button>
          </div>

          {/* Quick Actions (only in action mode) */}
          {mode === 'action' && (
            <div style={{ padding: '10px 12px', borderBottom: '1px solid #1f1f1f', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {[
                { label: '📋 Tagesplan', prompt: 'Erstelle mir einen optimalen Tagesplan für heute. Top 3 Prioritäten, kurz und konkret.' },
                { label: '📊 Wochen-Review', prompt: 'Erstelle ein kurzes Wochen-Review: Was lief gut, was nicht, Prioritäten für nächste Woche.' },
                { label: '🎯 Goal-Check', prompt: 'Wie stehe ich bei meinen Zielen? Bin ich auf Kurs? Sei direkt und ehrlich.' },
                { label: '💰 Income-Check', prompt: 'Analysiere meine Einkommenssituation. Was performat gut, wo ist Potenzial?' },
              ].map(q => (
                <button key={q.label} onClick={() => { setMode('chat'); setText(''); setLoading(true); setResult('');
                  fetch('/api/ai', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: q.prompt }) })
                    .then(r => r.json()).then(d => { setResult(d.content || d.error || 'Fehler'); setLoading(false); });
                }} style={{
                  background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#d4d4d8',
                  padding: '5px 10px', borderRadius: 6, fontSize: 11, cursor: 'pointer'
                }}>
                  {q.label}
                </button>
              ))}
            </div>
          )}

          {/* Result */}
          {(result || loading) && (
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #1f1f1f', fontSize: 13, lineHeight: 1.6, color: '#d4d4d8', maxHeight: 220, overflowY: 'auto', whiteSpace: 'pre-wrap' }}>
              {loading ? '⏳ Denke nach...' : result}
            </div>
          )}

          {/* Mode hint */}
          {!result && !loading && (
            <div style={{ padding: '10px 16px', fontSize: 12, color: '#52525b' }}>
              {mode === 'action'
                ? '💬 Sage z.B. "Task: Meta Ads analysieren, heute" oder "Termin: Zahnarzt Donnerstag 10 Uhr"'
                : '💬 Stelle eine Frage zu deinen Zielen, Income oder Trading.'}
            </div>
          )}

          {/* Input */}
          <div style={{ padding: '10px 12px', display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <button
              onClick={listening ? stopListening : startListening}
              style={{
                width: 36, height: 36, borderRadius: 8, border: 'none',
                background: listening ? '#ef4444' : '#1a1a1a', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }}>
              {listening ? <MicOff size={15} color="#fff" /> : <Mic size={15} color="#71717a" />}
            </button>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder={listening ? '🎙 Höre zu...' : 'Tippen oder Mikrofon...'}
              rows={2}
              style={{
                flex: 1, background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#fff',
                borderRadius: 8, padding: '8px 12px', fontSize: 13, outline: 'none',
                resize: 'none', lineHeight: 1.5, fontFamily: 'inherit'
              }}
            />
            <button
              onClick={send}
              disabled={loading || !text.trim()}
              style={{
                width: 36, height: 36, borderRadius: 8, border: 'none',
                background: text.trim() ? '#fff' : '#1a1a1a', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                opacity: loading ? 0.5 : 1
              }}>
              <Send size={14} color={text.trim() ? '#000' : '#52525b'} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
