import { NextResponse } from 'next/server';
import { query, run } from '@/lib/db';

export async function POST() {
  const rows = await query('SELECT key, value FROM settings') as { key: string; value: string }[];
  const s = Object.fromEntries(rows.map(r => [r.key, r.value]));

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

    if (data.error) return NextResponse.json({ error: data.error.message }, { status: 400 });

    const metaRows = data.data || [];
    let synced = 0;

    for (const row of metaRows) {
      const date = row.date_start;
      const spend = parseFloat(row.spend || '0');
      if (spend === 0) continue;

      const purchases = row.actions?.find((a: { action_type: string }) => a.action_type === 'purchase');
      const orders = parseInt(purchases?.value || '0');
      const notes = `Meta Ads: €${spend.toFixed(2)} Spend · ${row.impressions || 0} Impressions · ${row.clicks || 0} Clicks${orders > 0 ? ` · ${orders} Käufe` : ''}`;

      // Get existing ecom entry for this date if any
      const existing = await query('SELECT * FROM ecommerce_entries WHERE date = ?', [date]);
      if (existing.length > 0) {
        await run('UPDATE ecommerce_entries SET ad_spend = ?, notes = ? WHERE date = ?', [spend, notes, date]);
      } else {
        await run('INSERT INTO ecommerce_entries (date, ad_spend, revenue, profit, orders, notes) VALUES (?, ?, 0, 0, 0, ?)',
          [date, spend, notes]);
      }
      synced++;
    }

    return NextResponse.json({ synced, days: metaRows.length, message: `${synced} Tage Meta Ads Daten importiert` });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
