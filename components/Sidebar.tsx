'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import {
  LayoutDashboard, Target, CheckSquare, Calendar, TrendingUp,
  BarChart2, ShoppingBag, LineChart, Heart, FileText, Settings, Zap, Mic, MicOff, ClipboardList, Flame, Wallet
} from 'lucide-react';

const nav = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/goals', label: 'Goals', icon: Target },
  { href: '/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/income', label: 'Income', icon: TrendingUp },
  { href: '/statistics', label: 'Statistics', icon: BarChart2 },
  { href: '/ecommerce', label: 'E-Commerce', icon: ShoppingBag },
  { href: '/trading', label: 'Trading', icon: LineChart },
  { href: '/health', label: 'Health', icon: Heart },
  { href: '/notes', label: 'Notes', icon: FileText },
  { href: '/habits', label: 'Habits', icon: Flame },
  { href: '/budget', label: 'Budget', icon: Wallet },
  { href: '/review', label: 'Wochenreview', icon: ClipboardList },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const path = usePathname();
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    return () => { recognitionRef.current?.stop(); };
  }, []);

  function startListening() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setResult('Browser unterstützt keine Spracheingabe.'); return; }
    const rec = new SR();
    rec.lang = 'de-DE';
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (e: any) => {
      const t = Array.from(e.results).map((r: any) => r[0].transcript).join('');
      setTranscript(t);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => { setListening(false); setResult('Mikrofon-Fehler.'); };
    recognitionRef.current = rec;
    rec.start();
    setListening(true);
    setTranscript('');
    setResult('');
  }

  function stopListening() {
    recognitionRef.current?.stop();
    setListening(false);
  }

  async function send() {
    if (!transcript.trim()) return;
    setLoading(true);
    setResult('');
    try {
      const res = await fetch('/api/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: transcript }),
      });
      const data = await res.json();
      setResult(data.summary || data.error || 'Fehler');
      setTranscript('');
      if (data.executed?.length) {
        setTimeout(() => window.location.reload(), 1500);
      }
    } catch { setResult('Verbindungsfehler'); }
    setLoading(false);
  }

  return (
    <aside style={{
      width: 220, minWidth: 220, height: '100vh', background: '#0a0a0a',
      borderRight: '1px solid #1f1f1f', display: 'flex', flexDirection: 'column',
      padding: '24px 0', position: 'sticky', top: 0
    }}>
      {/* Logo */}
      <div style={{ padding: '0 20px 28px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Zap size={16} color="#000" fill="#000" />
        </div>
        <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.01em' }}>AI Life OS</span>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, padding: '0 10px' }}>
        {nav.map(({ href, label, icon: Icon }) => {
          const active = path === href;
          return (
            <Link key={href} href={href} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px',
              borderRadius: 8, textDecoration: 'none', fontSize: 13.5, fontWeight: 500,
              color: active ? '#fff' : '#71717a',
              background: active ? '#1a1a1a' : 'transparent',
              transition: 'all 0.15s',
            }}>
              <Icon size={16} strokeWidth={active ? 2.2 : 1.8} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Voice Button */}
      <div style={{ padding: '16px 10px 0', borderTop: '1px solid #1f1f1f' }}>
        <button
          onClick={() => setOpen(o => !o)}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 12px', borderRadius: 8, border: 'none',
            background: open ? '#1a1a1a' : 'transparent',
            color: open ? '#fff' : '#71717a', cursor: 'pointer', fontSize: 13.5, fontWeight: 500
          }}>
          <Mic size={16} />
          Spracheingabe
        </button>

        {open && (
          <div style={{ marginTop: 8, background: '#111', border: '1px solid #1f1f1f', borderRadius: 10, padding: 12 }}>
            {/* Transcript */}
            <div style={{
              minHeight: 48, background: '#0a0a0a', border: '1px solid #1f1f1f',
              borderRadius: 8, padding: 10, fontSize: 12, color: transcript ? '#fff' : '#52525b',
              marginBottom: 8, lineHeight: 1.5
            }}>
              {transcript || (listening ? '🎙 Höre zu...' : 'Drücke den Mic-Button und sprich.')}
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={listening ? stopListening : startListening}
                style={{
                  flex: 1, padding: '8px 0', borderRadius: 8, border: 'none',
                  background: listening ? '#ef4444' : '#fff', color: listening ? '#fff' : '#000',
                  fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                }}>
                {listening ? <><MicOff size={13} /> Stop</> : <><Mic size={13} /> Sprechen</>}
              </button>
              {transcript && (
                <button
                  onClick={send}
                  disabled={loading}
                  style={{
                    flex: 1, padding: '8px 0', borderRadius: 8, border: 'none',
                    background: '#22c55e', color: '#000', fontSize: 12, fontWeight: 600,
                    cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1
                  }}>
                  {loading ? '⏳' : '✓ Ausführen'}
                </button>
              )}
            </div>

            {/* Result */}
            {result && (
              <div style={{
                marginTop: 8, padding: '8px 10px', background: '#0a1a0a',
                border: '1px solid #1a3a1a', borderRadius: 8,
                fontSize: 12, color: '#22c55e', lineHeight: 1.5
              }}>
                {result}
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ padding: '12px 20px 0' }}>
        <p style={{ fontSize: 11, color: '#3f3f46', textAlign: 'center' }}>Fritz · AI Life OS</p>
      </div>
    </aside>
  );
}
