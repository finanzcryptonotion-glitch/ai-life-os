#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import Database from 'better-sqlite3';
import path from 'path';
import { execSync } from 'child_process';

const DB_PATH = path.join(process.env.HOME, '.ai-life-os', 'data.db');
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

const server = new Server(
  { name: 'ai-life-os', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

// ── Tool definitions ─────────────────────────────────────────────────────────

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    // Goals
    {
      name: 'list_goals',
      description: 'Alle Ziele abrufen. Optional nach Status filtern (active, completed, paused).',
      inputSchema: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['active', 'completed', 'paused'], description: 'Filter nach Status' }
        }
      }
    },
    {
      name: 'update_goal_progress',
      description: 'Fortschritt eines Ziels aktualisieren (0–100).',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'number' },
          progress: { type: 'number', minimum: 0, maximum: 100 },
          notes: { type: 'string' }
        },
        required: ['id', 'progress']
      }
    },
    {
      name: 'create_goal',
      description: 'Neues Ziel erstellen.',
      inputSchema: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          category: { type: 'string' },
          target_date: { type: 'string', description: 'ISO Datum YYYY-MM-DD' },
          priority: { type: 'string', enum: ['low', 'medium', 'high'] }
        },
        required: ['title']
      }
    },

    // Tasks
    {
      name: 'list_tasks',
      description: 'Tasks abrufen. Optional nach Status filtern.',
      inputSchema: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['todo', 'today', 'in_progress', 'completed', 'archived'] }
        }
      }
    },
    {
      name: 'create_task',
      description: 'Neuen Task erstellen.',
      inputSchema: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          category: { type: 'string' },
          priority: { type: 'string', enum: ['low', 'medium', 'high'] },
          due_date: { type: 'string' },
          estimated_minutes: { type: 'number' },
          status: { type: 'string', enum: ['todo', 'today', 'in_progress'] }
        },
        required: ['title']
      }
    },
    {
      name: 'update_task_status',
      description: 'Task-Status ändern.',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'number' },
          status: { type: 'string', enum: ['todo', 'today', 'in_progress', 'completed', 'archived'] }
        },
        required: ['id', 'status']
      }
    },

    // Trading
    {
      name: 'list_trading',
      description: 'Trading-Einträge abrufen (neueste zuerst).',
      inputSchema: {
        type: 'object',
        properties: {
          limit: { type: 'number', default: 14, description: 'Anzahl Einträge' }
        }
      }
    },
    {
      name: 'add_trading_entry',
      description: 'Neuen Trading-Eintrag hinzufügen (Tagesergebnis).',
      inputSchema: {
        type: 'object',
        properties: {
          date: { type: 'string', description: 'YYYY-MM-DD, Standard: heute' },
          account_balance: { type: 'number' },
          daily_pnl: { type: 'number' },
          win_rate: { type: 'number', description: '0–1 (z.B. 0.65 für 65%)' },
          notes: { type: 'string' },
          journal: { type: 'string' }
        },
        required: ['account_balance', 'daily_pnl']
      }
    },
    {
      name: 'trading_stats',
      description: 'Trading-Statistiken: Gesamt-PnL, Win Rate Durchschnitt, beste/schlechteste Tage.',
      inputSchema: {
        type: 'object',
        properties: {
          days: { type: 'number', default: 30 }
        }
      }
    },

    // Income
    {
      name: 'list_income',
      description: 'Einkommens-Einträge abrufen.',
      inputSchema: {
        type: 'object',
        properties: {
          days: { type: 'number', default: 30 },
          category: { type: 'string' }
        }
      }
    },
    {
      name: 'add_income',
      description: 'Einkommens-Eintrag hinzufügen.',
      inputSchema: {
        type: 'object',
        properties: {
          amount: { type: 'number' },
          category: { type: 'string', description: 'z.B. Trading, E-Commerce, Remote Job' },
          description: { type: 'string' },
          date: { type: 'string', description: 'YYYY-MM-DD, Standard: heute' }
        },
        required: ['amount', 'category']
      }
    },
    {
      name: 'income_summary',
      description: 'Einkommen-Zusammenfassung: heute, diese Woche, diesen Monat, nach Kategorie.',
      inputSchema: { type: 'object', properties: {} }
    },

    // Health
    {
      name: 'list_health',
      description: 'Health-Einträge abrufen.',
      inputSchema: {
        type: 'object',
        properties: { days: { type: 'number', default: 14 } }
      }
    },
    {
      name: 'add_health_entry',
      description: 'Health-Eintrag für heute oder ein Datum hinzufügen.',
      inputSchema: {
        type: 'object',
        properties: {
          date: { type: 'string' },
          workout: { type: 'string' },
          workout_duration: { type: 'number' },
          body_weight: { type: 'number' },
          sleep_hours: { type: 'number' },
          daily_score: { type: 'number', minimum: 0, maximum: 100 },
          notes: { type: 'string' }
        }
      }
    },

    // E-Commerce
    {
      name: 'ecommerce_summary',
      description: 'E-Commerce Zusammenfassung: Revenue, Profit, Orders der letzten N Tage.',
      inputSchema: {
        type: 'object',
        properties: { days: { type: 'number', default: 30 } }
      }
    },
    {
      name: 'sync_shopify',
      description: 'Shopify-Daten synchronisieren (letzten 60 Tage). Braucht shopify_token in Settings.',
      inputSchema: { type: 'object', properties: {} }
    },

    // Notes
    {
      name: 'list_notes',
      description: 'Notizen abrufen.',
      inputSchema: { type: 'object', properties: {} }
    },
    {
      name: 'create_note',
      description: 'Neue Notiz erstellen.',
      inputSchema: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          body: { type: 'string' }
        },
        required: ['title']
      }
    },

    // Dashboard
    {
      name: 'dashboard_summary',
      description: 'Vollständige Übersicht: aktive Goals, heutige Tasks, heutiges Einkommen, letzter Trade, Health-Score.',
      inputSchema: { type: 'object', properties: {} }
    },

    // Settings
    {
      name: 'get_settings',
      description: 'Aktuelle Settings abrufen (API Keys werden maskiert).',
      inputSchema: { type: 'object', properties: {} }
    },
    {
      name: 'update_setting',
      description: 'Setting setzen (z.B. shopify_token, ai_api_key).',
      inputSchema: {
        type: 'object',
        properties: {
          key: { type: 'string' },
          value: { type: 'string' }
        },
        required: ['key', 'value']
      }
    },

    // Calendar
    {
      name: 'list_events',
      description: 'Kalender-Events abrufen.',
      inputSchema: {
        type: 'object',
        properties: {
          from: { type: 'string', description: 'YYYY-MM-DD, Standard: heute' },
          days: { type: 'number', default: 7 }
        }
      }
    },
    {
      name: 'create_event',
      description: 'Neues Kalender-Event erstellen.',
      inputSchema: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          date: { type: 'string' },
          time: { type: 'string', description: 'HH:MM' },
          duration_minutes: { type: 'number' },
          category: { type: 'string' },
          location: { type: 'string' },
          notes: { type: 'string' }
        },
        required: ['title', 'date']
      }
    },
  ]
}));

// ── Tool handlers ─────────────────────────────────────────────────────────────

function today() {
  return new Date().toISOString().split('T')[0];
}

function daysAgo(n) {
  return new Date(Date.now() - n * 864e5).toISOString().split('T')[0];
}

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args = {} } = req.params;

  try {
    let result;

    switch (name) {
      // ── Goals ──────────────────────────────────────────────────────────────
      case 'list_goals': {
        const q = args.status
          ? db.prepare('SELECT * FROM goals WHERE status = ? ORDER BY priority DESC, created_at DESC').all(args.status)
          : db.prepare('SELECT * FROM goals ORDER BY status, priority DESC').all();
        result = q;
        break;
      }
      case 'update_goal_progress': {
        db.prepare('UPDATE goals SET progress = ?, notes = COALESCE(?, notes) WHERE id = ?')
          .run(args.progress, args.notes || null, args.id);
        result = db.prepare('SELECT * FROM goals WHERE id = ?').get(args.id);
        break;
      }
      case 'create_goal': {
        const r = db.prepare(
          'INSERT INTO goals (title, description, category, target_date, priority, status) VALUES (?, ?, ?, ?, ?, ?)'
        ).run(args.title, args.description || '', args.category || 'Personal', args.target_date || null, args.priority || 'medium', 'active');
        result = db.prepare('SELECT * FROM goals WHERE id = ?').get(r.lastInsertRowid);
        break;
      }

      // ── Tasks ──────────────────────────────────────────────────────────────
      case 'list_tasks': {
        const q = args.status
          ? db.prepare('SELECT * FROM tasks WHERE status = ? ORDER BY priority DESC, due_date ASC').all(args.status)
          : db.prepare('SELECT * FROM tasks ORDER BY status, priority DESC, due_date ASC').all();
        result = q;
        break;
      }
      case 'create_task': {
        const r = db.prepare(
          'INSERT INTO tasks (title, description, category, priority, due_date, estimated_minutes, status) VALUES (?, ?, ?, ?, ?, ?, ?)'
        ).run(args.title, args.description || '', args.category || 'General', args.priority || 'medium',
          args.due_date || today(), args.estimated_minutes || 60, args.status || 'todo');
        result = db.prepare('SELECT * FROM tasks WHERE id = ?').get(r.lastInsertRowid);
        break;
      }
      case 'update_task_status': {
        db.prepare('UPDATE tasks SET status = ? WHERE id = ?').run(args.status, args.id);
        result = db.prepare('SELECT * FROM tasks WHERE id = ?').get(args.id);
        break;
      }

      // ── Trading ────────────────────────────────────────────────────────────
      case 'list_trading': {
        const limit = args.limit || 14;
        result = db.prepare('SELECT * FROM trading_entries ORDER BY date DESC LIMIT ?').all(limit);
        break;
      }
      case 'add_trading_entry': {
        const r = db.prepare(
          'INSERT INTO trading_entries (account_balance, daily_pnl, win_rate, notes, journal, date) VALUES (?, ?, ?, ?, ?, ?)'
        ).run(args.account_balance, args.daily_pnl, args.win_rate || 0, args.notes || '', args.journal || '', args.date || today());
        result = db.prepare('SELECT * FROM trading_entries WHERE id = ?').get(r.lastInsertRowid);
        break;
      }
      case 'trading_stats': {
        const since = daysAgo(args.days || 30);
        const rows = db.prepare('SELECT * FROM trading_entries WHERE date >= ? ORDER BY date DESC').all(since);
        const totalPnl = rows.reduce((s, r) => s + r.daily_pnl, 0);
        const avgWinRate = rows.length ? rows.reduce((s, r) => s + r.win_rate, 0) / rows.length : 0;
        const winning = rows.filter(r => r.daily_pnl > 0);
        const losing = rows.filter(r => r.daily_pnl < 0);
        const best = rows.reduce((b, r) => r.daily_pnl > (b?.daily_pnl || -Infinity) ? r : b, null);
        const worst = rows.reduce((b, r) => r.daily_pnl < (b?.daily_pnl || Infinity) ? r : b, null);
        result = {
          days: rows.length,
          total_pnl: Math.round(totalPnl * 100) / 100,
          avg_win_rate: Math.round(avgWinRate * 1000) / 10 + '%',
          winning_days: winning.length,
          losing_days: losing.length,
          best_day: best,
          worst_day: worst,
          current_balance: rows[0]?.account_balance || 0
        };
        break;
      }

      // ── Income ─────────────────────────────────────────────────────────────
      case 'list_income': {
        const since = daysAgo(args.days || 30);
        const q = args.category
          ? db.prepare('SELECT * FROM income_entries WHERE date >= ? AND category = ? ORDER BY date DESC').all(since, args.category)
          : db.prepare('SELECT * FROM income_entries WHERE date >= ? ORDER BY date DESC').all(since);
        result = q;
        break;
      }
      case 'add_income': {
        const r = db.prepare(
          'INSERT INTO income_entries (amount, category, description, date) VALUES (?, ?, ?, ?)'
        ).run(args.amount, args.category, args.description || '', args.date || today());
        result = db.prepare('SELECT * FROM income_entries WHERE id = ?').get(r.lastInsertRowid);
        break;
      }
      case 'income_summary': {
        const t = today();
        const weekStart = daysAgo(7);
        const monthStart = t.slice(0, 7) + '-01';
        const all = db.prepare('SELECT * FROM income_entries WHERE date >= ?').all(monthStart);
        const todayTotal = all.filter(r => r.date === t).reduce((s, r) => s + r.amount, 0);
        const weekTotal = all.filter(r => r.date >= weekStart).reduce((s, r) => s + r.amount, 0);
        const monthTotal = all.reduce((s, r) => s + r.amount, 0);
        const byCategory = {};
        for (const r of all) {
          byCategory[r.category] = (byCategory[r.category] || 0) + r.amount;
        }
        result = { today: todayTotal, week: weekTotal, month: monthTotal, by_category: byCategory };
        break;
      }

      // ── Health ─────────────────────────────────────────────────────────────
      case 'list_health': {
        const since = daysAgo(args.days || 14);
        result = db.prepare('SELECT * FROM health_entries WHERE date >= ? ORDER BY date DESC').all(since);
        break;
      }
      case 'add_health_entry': {
        const r = db.prepare(
          'INSERT OR REPLACE INTO health_entries (date, workout, workout_duration, body_weight, sleep_hours, daily_score, notes) VALUES (?, ?, ?, ?, ?, ?, ?)'
        ).run(args.date || today(), args.workout || null, args.workout_duration || 0,
          args.body_weight || null, args.sleep_hours || null, args.daily_score || 0, args.notes || '');
        result = db.prepare('SELECT * FROM health_entries WHERE id = ?').get(r.lastInsertRowid);
        break;
      }

      // ── E-Commerce ─────────────────────────────────────────────────────────
      case 'ecommerce_summary': {
        const since = daysAgo(args.days || 30);
        const rows = db.prepare('SELECT * FROM ecommerce_entries WHERE date >= ? ORDER BY date DESC').all(since);
        const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0);
        const totalProfit = rows.reduce((s, r) => s + r.profit, 0);
        const totalOrders = rows.reduce((s, r) => s + r.orders, 0);
        const totalAdSpend = rows.reduce((s, r) => s + r.ad_spend, 0);
        result = {
          days: rows.length,
          total_revenue: Math.round(totalRevenue * 100) / 100,
          total_profit: Math.round(totalProfit * 100) / 100,
          total_orders: totalOrders,
          total_ad_spend: Math.round(totalAdSpend * 100) / 100,
          roas: totalAdSpend > 0 ? Math.round(totalRevenue / totalAdSpend * 100) / 100 : null,
          daily: rows.slice(0, 7)
        };
        break;
      }
      case 'sync_shopify': {
        const settings = db.prepare('SELECT key, value FROM settings').all();
        const s = Object.fromEntries(settings.map(r => [r.key, r.value]));
        const token = s['shopify_token'];
        const store = s['shopify_store'] || '4mm7xp-an';
        if (!token) {
          result = { error: 'Kein shopify_token in Settings. Bitte via update_setting setzen.' };
          break;
        }
        const baseUrl = `https://${store}.myshopify.com/admin/api/2024-01`;
        const headers = { 'X-Shopify-Access-Token': token, 'Content-Type': 'application/json' };
        const since = new Date(Date.now() - 60 * 864e5).toISOString();
        const res = await fetch(`${baseUrl}/orders.json?status=any&created_at_min=${since}&limit=250&fields=id,created_at,total_price,total_tax,total_discounts,total_shipping_price_set,financial_status,customer`, { headers });
        if (!res.ok) {
          const err = await res.json();
          result = { error: err.errors || 'Shopify API Fehler' };
          break;
        }
        const data = await res.json();
        const orders = data.orders || [];
        const byDate = {};
        for (const order of orders) {
          if (order.financial_status === 'refunded') continue;
          const date = order.created_at.split('T')[0];
          if (!byDate[date]) byDate[date] = { revenue: 0, orders: 0, customers: new Set() };
          byDate[date].revenue += parseFloat(order.total_price || '0');
          byDate[date].orders += 1;
          if (order.customer?.id) byDate[date].customers.add(String(order.customer.id));
        }
        const insert = db.prepare('INSERT OR REPLACE INTO ecommerce_entries (revenue, profit, ad_spend, orders, notes, date) VALUES (?, ?, 0, ?, ?, ?)');
        let synced = 0;
        for (const [date, d] of Object.entries(byDate)) {
          insert.run(d.revenue, Math.round(d.revenue * 0.45 * 100) / 100, d.orders, `${d.orders} Orders`, date);
          synced++;
        }
        result = { synced, orders: orders.length };
        break;
      }

      // ── Notes ──────────────────────────────────────────────────────────────
      case 'list_notes': {
        result = db.prepare('SELECT * FROM notes ORDER BY updated_at DESC').all();
        break;
      }
      case 'create_note': {
        const now = new Date().toISOString();
        const r = db.prepare('INSERT INTO notes (title, body, created_at, updated_at) VALUES (?, ?, ?, ?)').run(args.title, args.body || '', now, now);
        result = db.prepare('SELECT * FROM notes WHERE id = ?').get(r.lastInsertRowid);
        break;
      }

      // ── Events ─────────────────────────────────────────────────────────────
      case 'list_events': {
        const from = args.from || today();
        const to = new Date(new Date(from).getTime() + (args.days || 7) * 864e5).toISOString().split('T')[0];
        result = db.prepare('SELECT * FROM events WHERE date >= ? AND date < ? ORDER BY date, time').all(from, to);
        break;
      }
      case 'create_event': {
        const r = db.prepare(
          'INSERT INTO events (title, date, time, duration_minutes, category, location, notes) VALUES (?, ?, ?, ?, ?, ?, ?)'
        ).run(args.title, args.date, args.time || null, args.duration_minutes || 60,
          args.category || 'General', args.location || null, args.notes || '');
        result = db.prepare('SELECT * FROM events WHERE id = ?').get(r.lastInsertRowid);
        break;
      }

      // ── Dashboard ──────────────────────────────────────────────────────────
      case 'dashboard_summary': {
        const t = today();
        const weekStart = daysAgo(7);
        const monthStart = t.slice(0, 7) + '-01';
        const activeGoals = db.prepare('SELECT * FROM goals WHERE status = ?').all('active');
        const todayTasks = db.prepare("SELECT * FROM tasks WHERE status IN ('today','in_progress')").all();
        const overdueTasks = db.prepare("SELECT * FROM tasks WHERE due_date < ? AND status NOT IN ('completed','archived')").all(t);
        const incomeAll = db.prepare('SELECT * FROM income_entries WHERE date >= ?').all(monthStart);
        const incomeToday = incomeAll.filter(r => r.date === t).reduce((s, r) => s + r.amount, 0);
        const incomeWeek = incomeAll.filter(r => r.date >= weekStart).reduce((s, r) => s + r.amount, 0);
        const incomeMonth = incomeAll.reduce((s, r) => s + r.amount, 0);
        const lastTrade = db.prepare('SELECT * FROM trading_entries ORDER BY date DESC LIMIT 1').get();
        const lastHealth = db.prepare('SELECT * FROM health_entries ORDER BY date DESC LIMIT 1').get();
        const todayEvents = db.prepare('SELECT * FROM events WHERE date = ? ORDER BY time').all(t);
        result = {
          date: t,
          goals: { active: activeGoals.length, list: activeGoals },
          tasks: { today: todayTasks.length, overdue: overdueTasks.length, list: todayTasks },
          income: { today: incomeToday, week: incomeWeek, month: incomeMonth },
          trading: lastTrade,
          health: lastHealth,
          events_today: todayEvents
        };
        break;
      }

      // ── Settings ───────────────────────────────────────────────────────────
      case 'get_settings': {
        const rows = db.prepare('SELECT key, value FROM settings').all();
        const masked = Object.fromEntries(rows.map(r => [
          r.key,
          r.key.includes('token') || r.key.includes('key') ? (r.value ? '***' + r.value.slice(-4) : '(leer)') : r.value
        ]));
        result = masked;
        break;
      }
      case 'update_setting': {
        db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(args.key, args.value);
        result = { ok: true, key: args.key };
        break;
      }

      default:
        result = { error: `Unbekanntes Tool: ${name}` };
    }

    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
    };

  } catch (err) {
    return {
      content: [{ type: 'text', text: JSON.stringify({ error: String(err) }) }],
      isError: true
    };
  }
});

// ── Start ─────────────────────────────────────────────────────────────────────

const transport = new StdioServerTransport();
await server.connect(transport);
