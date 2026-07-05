import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST() {
  const db = getDb();
  const settings = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[];
  const s = Object.fromEntries(settings.map(r => [r.key, r.value]));

  const token = s['shopify_token'];
  const store = s['shopify_store'] || '4mm7xp-an';

  if (!token) return NextResponse.json({ error: 'Kein Shopify Token konfiguriert' }, { status: 400 });

  const baseUrl = `https://${store}.myshopify.com/admin/api/2024-01`;
  const headers = { 'X-Shopify-Access-Token': token, 'Content-Type': 'application/json' };

  try {
    // Fetch last 60 days of orders
    const since = new Date(Date.now() - 60 * 864e5).toISOString();
    const res = await fetch(`${baseUrl}/orders.json?status=any&created_at_min=${since}&limit=250&fields=id,created_at,total_price,subtotal_price,total_tax,total_discounts,total_shipping_price_set,financial_status,customer`, { headers });

    if (!res.ok) {
      const err = await res.json();
      return NextResponse.json({ error: err.errors || 'Shopify API Fehler' }, { status: res.status });
    }

    const data = await res.json();
    const orders = data.orders || [];

    // Group by date and insert into ecommerce_entries
    const byDate: Record<string, { revenue: number; orders: number; tax: number; discounts: number; shipping: number; customers: Set<string> }> = {};

    for (const order of orders) {
      if (order.financial_status === 'refunded') continue;
      const date = order.created_at.split('T')[0];
      if (!byDate[date]) byDate[date] = { revenue: 0, orders: 0, tax: 0, discounts: 0, shipping: 0, customers: new Set() };

      byDate[date].revenue += parseFloat(order.total_price || '0');
      byDate[date].orders += 1;
      byDate[date].tax += parseFloat(order.total_tax || '0');
      byDate[date].discounts += parseFloat(order.total_discounts || '0');
      byDate[date].shipping += parseFloat(order.total_shipping_price_set?.shop_money?.amount || '0');
      if (order.customer?.id) byDate[date].customers.add(String(order.customer.id));
    }

    // Also sync to income_entries
    const insertIncome = db.prepare(`INSERT OR REPLACE INTO income_entries (amount, category, description, date) VALUES (?, 'E-Commerce', ?, ?)`);
    const insertEcom = db.prepare(`INSERT OR REPLACE INTO ecommerce_entries (revenue, profit, ad_spend, orders, conversion_rate, notes, date) VALUES (?, ?, 0, ?, 0, ?, ?)`);

    let synced = 0;
    for (const [date, d] of Object.entries(byDate)) {
      const net = d.revenue - d.tax - d.shipping;
      const notes = `${d.orders} Orders · ${d.customers.size} Käufer · Netto: €${net.toFixed(2)} · Rabatte: €${d.discounts.toFixed(2)}`;

      // Remove existing income entry for this date from Shopify
      db.prepare(`DELETE FROM income_entries WHERE date = ? AND category = 'E-Commerce' AND description LIKE 'Shopify%'`).run(date);
      insertIncome.run(d.revenue, `Shopify Orders (${d.orders}x)`, date);

      // Update ecommerce entry
      db.prepare(`DELETE FROM ecommerce_entries WHERE date = ? AND notes LIKE '%Orders%'`).run(date);
      insertEcom.run(d.revenue, net, d.orders, notes, date);
      synced++;
    }

    return NextResponse.json({ synced, orders: orders.length, message: `${orders.length} Orders aus ${synced} Tagen importiert` });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
