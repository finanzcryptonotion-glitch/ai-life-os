'use client';
import { useEffect, useState } from 'react';

const MODELS = ['claude-sonnet-5', 'claude-opus-4-8', 'claude-haiku-4-5-20251001', 'claude-3-5-sonnet-20241022'];

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    ai_api_key: '', ai_model: 'claude-3-5-sonnet-20241022',
    user_name: 'Fritz', currency: 'EUR',
    shopify_token: '', shopify_store: '4mm7xp-an',
    meta_token: '', meta_ad_account_id: '',
    notif_minutes: '15',
  });
  const [saved, setSaved] = useState(false);
  const [syncStatus, setSyncStatus] = useState('');
  const [metaSyncStatus, setMetaSyncStatus] = useState('');

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(data => setSettings(s => ({ ...s, ...data })));
  }, []);

  async function save() {
    await fetch('/api/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings) });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  async function syncShopify() {
    setSyncStatus('⏳ Synchronisiere...');
    try {
      const res = await fetch('/api/shopify/sync', { method: 'POST' });
      const data = await res.json();
      if (data.error) setSyncStatus('❌ ' + data.error);
      else setSyncStatus(`✅ ${data.synced} Bestellungen importiert`);
    } catch {
      setSyncStatus('❌ Verbindungsfehler');
    }
    setTimeout(() => setSyncStatus(''), 5000);
  }

  const inp = { background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#fff', borderRadius: 8, padding: '10px 14px', fontSize: 13, width: '100%', outline: 'none' };

  return (
    <div style={{ padding: 32, maxWidth: 700, margin: '0 auto' }}>
      <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 8 }}>Settings</h1>
      <p style={{ color: '#a1a1aa', fontSize: 13, marginBottom: 32 }}>Konfiguriere dein AI Life OS</p>

      {/* Profil */}
      <section style={{ background: '#111', border: '1px solid #1f1f1f', borderRadius: 12, padding: 24, marginBottom: 20 }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Profil</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={{ fontSize: 11, color: '#a1a1aa', display: 'block', marginBottom: 6 }}>Dein Name</label>
            <input style={inp} value={settings.user_name} onChange={e => setSettings(s => ({ ...s, user_name: e.target.value }))} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: '#a1a1aa', display: 'block', marginBottom: 6 }}>Währung</label>
            <select style={inp} value={settings.currency} onChange={e => setSettings(s => ({ ...s, currency: e.target.value }))}>
              <option value="EUR">EUR (€)</option>
              <option value="USD">USD ($)</option>
            </select>
          </div>
        </div>
      </section>

      {/* KI */}
      <section style={{ background: '#111', border: '1px solid #1f1f1f', borderRadius: 12, padding: 24, marginBottom: 20 }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>KI-Assistent</h2>
        <p style={{ fontSize: 12, color: '#52525b', marginBottom: 16 }}>API Key wird lokal gespeichert.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 11, color: '#a1a1aa', display: 'block', marginBottom: 6 }}>Anthropic API Key</label>
            <input style={inp} type="password" value={settings.ai_api_key} onChange={e => setSettings(s => ({ ...s, ai_api_key: e.target.value }))} placeholder="sk-ant-..." />
          </div>
          <div>
            <label style={{ fontSize: 11, color: '#a1a1aa', display: 'block', marginBottom: 6 }}>Modell</label>
            <select style={inp} value={settings.ai_model} onChange={e => setSettings(s => ({ ...s, ai_model: e.target.value }))}>
              {MODELS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>
      </section>

      {/* Shopify */}
      <section style={{ background: '#111', border: '1px solid #1f1f1f', borderRadius: 12, padding: 24, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <h2 style={{ fontSize: 14, fontWeight: 600 }}>🛍 Shopify Auto-Sync</h2>
          <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: settings.shopify_token ? '#0a1a0a' : '#1a1a1a', color: settings.shopify_token ? '#22c55e' : '#52525b', border: '1px solid ' + (settings.shopify_token ? '#1a3a1a' : '#2a2a2a') }}>
            {settings.shopify_token ? '● Verbunden' : '○ Nicht verbunden'}
          </span>
        </div>
        <p style={{ fontSize: 12, color: '#52525b', marginBottom: 16 }}>Importiert automatisch Orders, Revenue, Käufer & Nettobetrag aus deinem Shopify Store.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ fontSize: 11, color: '#a1a1aa', display: 'block', marginBottom: 6 }}>Store Name</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
              <input style={{ ...inp, borderRadius: '8px 0 0 8px', borderRight: 'none' }} value={settings.shopify_store} onChange={e => setSettings(s => ({ ...s, shopify_store: e.target.value }))} placeholder="dein-store" />
              <span style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderLeft: 'none', padding: '10px 12px', fontSize: 12, color: '#52525b', borderRadius: '0 8px 8px 0', whiteSpace: 'nowrap' }}>.myshopify.com</span>
            </div>
          </div>
          <div>
            <label style={{ fontSize: 11, color: '#a1a1aa', display: 'block', marginBottom: 6 }}>Admin API Access Token</label>
            <input style={inp} type="password" value={settings.shopify_token} onChange={e => setSettings(s => ({ ...s, shopify_token: e.target.value }))} placeholder="shpat_..." />
          </div>
        </div>
        {settings.shopify_token && (
          <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={syncShopify} style={{ background: '#0a2a0a', color: '#22c55e', border: '1px solid #1a3a1a', padding: '9px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              🔄 Jetzt synchronisieren
            </button>
            {syncStatus && <span style={{ fontSize: 13, color: syncStatus.startsWith('✅') ? '#22c55e' : syncStatus.startsWith('❌') ? '#ef4444' : '#a1a1aa' }}>{syncStatus}</span>}
          </div>
        )}
        <div style={{ marginTop: 14, padding: '10px 14px', background: '#0a0a0a', border: '1px solid #1f1f1f', borderRadius: 8, fontSize: 11, color: '#52525b', lineHeight: 1.6 }}>
          Benötigte Scopes: <code style={{ color: '#a1a1aa' }}>read_orders, read_products, read_customers</code>
        </div>
      </section>

      {/* Notifications */}
      <section style={{ background: '#111', border: '1px solid #1f1f1f', borderRadius: 12, padding: 24, marginBottom: 20 }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>🔔 Benachrichtigungen</h2>
        <p style={{ fontSize: 12, color: '#52525b', marginBottom: 16 }}>Wie viele Minuten vor einem Termin soll die Benachrichtigung erscheinen?</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <select style={{ ...inp, width: 'auto' }} value={settings.notif_minutes} onChange={e => setSettings(s => ({ ...s, notif_minutes: e.target.value }))}>
            {[5, 10, 15, 20, 30, 45, 60].map(m => <option key={m} value={String(m)}>{m} Minuten vorher</option>)}
          </select>
        </div>
      </section>

      {/* Meta Ads */}
      <section style={{ background: '#111', border: '1px solid #1f1f1f', borderRadius: 12, padding: 24, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <h2 style={{ fontSize: 14, fontWeight: 600 }}>📱 Meta Ads Auto-Sync</h2>
          <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: settings.meta_token ? '#0a1a0a' : '#1a1a1a', color: settings.meta_token ? '#22c55e' : '#52525b', border: '1px solid ' + (settings.meta_token ? '#1a3a1a' : '#2a2a2a') }}>
            {settings.meta_token ? '● Verbunden' : '○ Nicht verbunden'}
          </span>
        </div>
        <p style={{ fontSize: 12, color: '#52525b', marginBottom: 16 }}>Importiert Ad Spend, Impressions, Clicks und Käufe aus deinem Meta Ad Manager.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ fontSize: 11, color: '#a1a1aa', display: 'block', marginBottom: 6 }}>Access Token</label>
            <input style={inp} type="password" value={settings.meta_token} onChange={e => setSettings(s => ({ ...s, meta_token: e.target.value }))} placeholder="EAAxxxx..." />
          </div>
          <div>
            <label style={{ fontSize: 11, color: '#a1a1aa', display: 'block', marginBottom: 6 }}>Ad Account ID</label>
            <input style={inp} value={settings.meta_ad_account_id} onChange={e => setSettings(s => ({ ...s, meta_ad_account_id: e.target.value }))} placeholder="act_123456789" />
          </div>
        </div>
        {settings.meta_token && (
          <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={async () => {
              setMetaSyncStatus('⏳ Synchronisiere...');
              const res = await fetch('/api/meta/sync', { method: 'POST' });
              const data = await res.json();
              setMetaSyncStatus(data.error ? '❌ ' + data.error : '✅ ' + data.message);
              setTimeout(() => setMetaSyncStatus(''), 5000);
            }} style={{ background: '#0a2a0a', color: '#22c55e', border: '1px solid #1a3a1a', padding: '9px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              🔄 Jetzt synchronisieren
            </button>
            {metaSyncStatus && <span style={{ fontSize: 13, color: metaSyncStatus.startsWith('✅') ? '#22c55e' : metaSyncStatus.startsWith('❌') ? '#ef4444' : '#a1a1aa' }}>{metaSyncStatus}</span>}
          </div>
        )}
        <div style={{ marginTop: 14, padding: '10px 14px', background: '#0a0a0a', border: '1px solid #1f1f1f', borderRadius: 8, fontSize: 11, color: '#52525b', lineHeight: 1.6 }}>
          Token holen: <strong style={{ color: '#a1a1aa' }}>developers.facebook.com/tools/explorer</strong> → App auswählen → Permissions: <code style={{ color: '#a1a1aa' }}>ads_read, read_insights</code> → Token generieren
        </div>
      </section>

      {/* Info */}
      <section style={{ background: '#0a0f0a', border: '1px solid #1a2a1a', borderRadius: 12, padding: 20, marginBottom: 24 }}>
        <h3 style={{ fontSize: 13, fontWeight: 600, color: '#22c55e', marginBottom: 8 }}>Datenspeicherung</h3>
        <p style={{ fontSize: 12, color: '#a1a1aa', lineHeight: 1.7 }}>
          Alle Daten lokal gespeichert unter:<br />
          <code style={{ background: '#111', padding: '2px 6px', borderRadius: 4, fontSize: 11 }}>~/.ai-life-os/data.db</code><br />
          Keine Cloud, keine Subscription.
        </p>
      </section>

      <button onClick={save} style={{ background: saved ? '#22c55e' : '#fff', color: '#000', border: 'none', padding: '12px 28px', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'background 0.3s' }}>
        {saved ? '✓ Gespeichert!' : 'Einstellungen speichern'}
      </button>
    </div>
  );
}
