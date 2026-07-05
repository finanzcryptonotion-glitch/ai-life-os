import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST() {
  const db = getDb();
  const settings = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[];
  const s = Object.fromEntries(settings.map(r => [r.key, r.value]));

  const token = s['meta_token'];
  const adAccountId = s['meta_ad_account_id'];

  if (!token) return NextResponse.json({ error: 'Kein meta_token konfiguriert' }, { status: 400 });
  if (!adAccountId) return NextResponse.json({ error: 'Keine meta_ad_account_id konfiguriert' }, { status: 400 });

  const since = new Date(Date.now() - 60 * 864e5).toISOString().split('T')[0];
  const until = new Date().toISOString().split('T')[0];

  const url = `https://graph.facebook.com/v19.0/${adAccountId}/insights?fields=date_start,spend,impressions,clicks,reach,actions,action_values&time_increment=1&time_range={"since":"${since}","until":"${until}"}&access_token=${token}`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (data.error) {
      return NextResponse.json({ error: data.error.message }, { status: 400 });
    }

    const rows = data.data || [];
    let synced = 0;

    const upsertEcom = db.prepare(`
      INSERT INTO ecommerce_entries (date, ad_spend, revenue, profit, orders, notes)
      VALUES (?, ?, COALESCE((SELECT revenue FROM ecommerce_entries WHERE date = ? LIMIT 1), 0),
              COALESCE((SELECT profit FROM ecommerce_entries WHERE date = ? LIMIT 1), 0),
              COALESCE((SELECT orders FROM ecommerce_entries WHERE date = ? LIMIT 1), 0),
              ?)
      ON CONFLICT(date) DO UPDATE SET
        ad_spend = excluded.ad_spend,
        notes = excluded.notes
    `);

    for (const row of rows) {
      const date = row.date_start;
      const spend = parseFloat(row.spend || '0');
      if (spend === 0) continue;

      const purchases = row.actions?.find((a: { action_type: string }) => a.action_type === 'purchase');
      const purchaseValue = row.action_values?.find((a: { action_type: string }) => a.action_type === 'purchase');
      const revenue = parseFloat(purchaseValue?.value || '0');
      const orders = parseInt(purchases?.value || '0');
      const notes = `Meta Ads: €${spend.toFixed(2)} Spend · ${row.impressions || 0} Impressions · ${row.clicks || 0} Clicks${orders > 0 ? ` · ${orders} Käufe` : ''}`;

      try {
        upsertEcom.run(date, spend, date, date, date, notes);
        synced++;
      } catch {
        // date conflict — update only ad_spend
        db.prepare(`UPDATE ecommerce_entries SET ad_spend = ?, notes = ? WHERE date = ?`).run(spend, notes, date);
        synced++;
      }
    }

    return NextResponse.json({
      synced,
      days: rows.length,
      message: `${synced} Tage Meta Ads Daten importiert`
    });

  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
