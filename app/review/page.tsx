'use client';
import { useState } from 'react';
import { Brain, CheckCircle, Target, ChevronRight } from 'lucide-react';

export default function ReviewPage() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    review: string;
    next_week_focus: string[];
    executed: string[];
  } | null>(null);
  const [error, setError] = useState('');

  async function generate() {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userInput: input }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); }
      else { setResult(data); }
    } catch { setError('Verbindungsfehler'); }
    setLoading(false);
  }

  return (
    <div style={{ padding: 32, maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 6 }}>
          Wochenreview
        </h1>
        <p style={{ color: '#a1a1aa', fontSize: 14 }}>
          Die KI analysiert deine Woche, erstellt ein Review und passt Tasks & Goals automatisch an.
        </p>
      </div>

      {/* Input */}
      <div style={{ background: '#111', border: '1px solid #1f1f1f', borderRadius: 12, padding: 24, marginBottom: 20 }}>
        <label style={{ fontSize: 12, color: '#a1a1aa', display: 'block', marginBottom: 10 }}>
          Dein persönlicher Input (optional) — Was lief diese Woche? Worüber bist du zufrieden, was hat nicht geklappt?
        </label>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="z.B. Trading lief diese Woche gut, 3 profitable Tage. Shopify hatte weniger Sales als erwartet. Habe das Workout-Ziel verfehlt weil ich krank war. Will nächste Woche mehr Fokus auf Meta Ads legen..."
          rows={5}
          style={{
            width: '100%', background: '#0a0a0a', border: '1px solid #1f1f1f',
            borderRadius: 8, padding: 14, fontSize: 13, color: '#fff',
            outline: 'none', resize: 'vertical', lineHeight: 1.6, boxSizing: 'border-box'
          }}
        />
        <div style={{ marginTop: 14, display: 'flex', gap: 12, alignItems: 'center' }}>
          <button
            onClick={generate}
            disabled={loading}
            style={{
              background: loading ? '#1a1a1a' : '#fff', color: '#000', border: 'none',
              padding: '11px 24px', borderRadius: 8, fontSize: 14, fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1,
              display: 'flex', alignItems: 'center', gap: 8
            }}>
            <Brain size={16} />
            {loading ? 'KI analysiert...' : 'Review generieren'}
          </button>
          <span style={{ fontSize: 12, color: '#52525b' }}>
            Liest automatisch: Tasks, Goals, Income, Trading, Health der letzten 7 Tage
          </span>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{ background: '#1a0a0a', border: '1px solid #2a1010', borderRadius: 10, padding: 16, marginBottom: 20, color: '#ef4444', fontSize: 13 }}>
          ❌ {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ background: '#111', border: '1px solid #1f1f1f', borderRadius: 12, padding: 32, textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🧠</div>
          <p style={{ color: '#a1a1aa', fontSize: 14 }}>KI analysiert deine Woche und passt Tasks & Goals an...</p>
        </div>
      )}

      {/* Result */}
      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Review Text */}
          <div style={{ background: '#111', border: '1px solid #1f1f1f', borderRadius: 12, padding: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
              <Brain size={15} color="#a1a1aa" />
              <span style={{ fontSize: 11, fontWeight: 600, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.06em' }}>KI Review</span>
            </div>
            <div style={{ fontSize: 14, lineHeight: 1.8, color: '#d4d4d8', whiteSpace: 'pre-wrap' }}>
              {result.review}
            </div>
          </div>

          {/* Next Week Focus */}
          {result.next_week_focus?.length > 0 && (
            <div style={{ background: '#0a1a0a', border: '1px solid #1a3a1a', borderRadius: 12, padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <Target size={15} color="#22c55e" />
                <span style={{ fontSize: 11, fontWeight: 600, color: '#22c55e', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Fokus nächste Woche</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {result.next_week_focus.map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <ChevronRight size={14} color="#22c55e" style={{ marginTop: 2, flexShrink: 0 }} />
                    <span style={{ fontSize: 14, color: '#d4d4d8' }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Executed Actions */}
          {result.executed?.length > 0 && (
            <div style={{ background: '#0a0f1a', border: '1px solid #1a2a3a', borderRadius: 12, padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <CheckCircle size={15} color="#3b82f6" />
                <span style={{ fontSize: 11, fontWeight: 600, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Automatisch ausgeführt</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {result.executed.map((e, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#3b82f6', flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: '#a1a1aa' }}>{e}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
