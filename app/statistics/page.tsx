'use client';
import { useEffect, useState } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

function fmt(n: number) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}

export default function StatisticsPage() {
  const [income, setIncome] = useState<{ date: string; amount: number; category: string }[]>([]);
  const [tasks, setTasks] = useState<{ status: string; created_at: string }[]>([]);
  const [goals, setGoals] = useState<{ progress: number; category: string; status: string }[]>([]);
  const [health, setHealth] = useState<{ date: string; body_weight: number; sleep_hours: number; daily_score: number }[]>([]);

  useEffect(() => {
    Promise.all([
      fetch('/api/income').then(r => r.json()),
      fetch('/api/tasks').then(r => r.json()),
      fetch('/api/goals').then(r => r.json()),
      fetch('/api/health').then(r => r.json()),
    ]).then(([i, t, g, h]) => { setIncome(i); setTasks(t); setGoals(g); setHealth(h); });
  }, []);

  const incomeChart = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(Date.now() - (29 - i) * 864e5).toISOString().split('T')[0];
    return { date: d.slice(5), total: income.filter(e => e.date === d).reduce((s, e) => s + e.amount, 0) };
  });

  const taskChart = ['todo', 'today', 'in_progress', 'completed', 'archived'].map(s => ({
    name: s, count: tasks.filter(t => t.status === s).length
  }));

  const goalChart = goals.map(g => ({ name: g.category.slice(0, 8), progress: g.progress }));

  const weightChart = [...health].reverse().slice(0, 14).map(h => ({
    date: h.date.slice(5), weight: h.body_weight, sleep: h.sleep_hours, score: h.daily_score
  }));

  const totalIncome = income.reduce((s, e) => s + e.amount, 0);
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const avgGoalProgress = goals.length ? Math.round(goals.reduce((s, g) => s + g.progress, 0) / goals.length) : 0;
  const avgSleep = health.length ? (health.reduce((s, h) => s + h.sleep_hours, 0) / health.length).toFixed(1) : '0';

  const tooltipStyle = { background: '#111', border: '1px solid #1f1f1f', borderRadius: 8, fontSize: 12 };
  const axisStyle = { fill: '#52525b', fontSize: 10 };

  return (
    <div style={{ padding: 32, maxWidth: 1100, margin: '0 auto' }}>
      <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 8 }}>Statistics</h1>
      <p style={{ color: '#a1a1aa', fontSize: 13, marginBottom: 28 }}>Deine Gesamt-Performance auf einen Blick</p>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Gesamteinkommen', value: fmt(totalIncome), color: '#22c55e' },
          { label: 'Tasks erledigt', value: String(completedTasks), color: '#3b82f6' },
          { label: 'Ø Goal Progress', value: `${avgGoalProgress}%`, color: '#f97316' },
          { label: 'Ø Schlaf', value: `${avgSleep}h`, color: '#a855f7' },
        ].map(s => (
          <div key={s.label} style={{ background: '#111', border: '1px solid #1f1f1f', borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 11, color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: s.color, letterSpacing: '-0.02em' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ background: '#111', border: '1px solid #1f1f1f', borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 11, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>Einkommen (30 Tage)</div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={incomeChart} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs><linearGradient id="ig" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} /><stop offset="95%" stopColor="#22c55e" stopOpacity={0} /></linearGradient></defs>
              <XAxis dataKey="date" tick={axisStyle} axisLine={false} tickLine={false} interval={6} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [fmt(Number(v))]} />
              <Area type="monotone" dataKey="total" stroke="#22c55e" strokeWidth={2} fill="url(#ig)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: '#111', border: '1px solid #1f1f1f', borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 11, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>Tasks nach Status</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={taskChart} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: '#111', border: '1px solid #1f1f1f', borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 11, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>Körpergewicht (14 Tage)</div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={weightChart} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="date" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${Number(v)}kg`]} />
              <Line type="monotone" dataKey="weight" stroke="#f97316" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: '#111', border: '1px solid #1f1f1f', borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 11, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>Goal Progress</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={goalChart} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} domain={[0, 100]} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${Number(v)}%`]} />
              <Bar dataKey="progress" fill="#a855f7" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
