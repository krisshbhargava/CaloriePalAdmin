'use client';

import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import type { DailyAnalytics, UserAnalytics } from '@/models/analytics';

const C = {
  primary: '#6366F1',
  green: '#10B981',
  amber: '#F59E0B',
  red: '#EF4444',
  indigo2: '#818CF8',
};

const CHART_H = 250;

function SectionTitle({ children }: { children: string }) {
  return (
    <p className="text-xs font-bold uppercase tracking-widest opacity-40 mt-1" style={{ color: 'var(--fg)' }}>
      {children}
    </p>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="flex-1 min-w-[300px] rounded-2xl p-5"
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
    >
      <p className="text-sm font-semibold mb-4" style={{ color: 'var(--fg)' }}>{title}</p>
      {children}
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="flex flex-col items-center justify-center gap-1.5 rounded-xl" style={{ height: CHART_H, background: 'var(--surface)' }}>
      <span className="text-sm font-semibold opacity-35" style={{ color: 'var(--fg)' }}>No data yet</span>
      <span className="text-xs opacity-30" style={{ color: 'var(--fg)' }}>Starts populating when users log meals</span>
    </div>
  );
}

function shortDate(iso: string) {
  const [, m, d] = iso.split('-');
  return `${Number(m)}/${Number(d)}`;
}

function allZero(data: Record<string, unknown>[], key: string) {
  return data.every((d) => (d[key] as number) === 0);
}

type Props = { daily: DailyAnalytics[]; users: UserAnalytics[] };

export function ActivityCharts({ daily, users }: Props) {
  const axisColor = '#9CA3AF';
  const gridColor = 'var(--border)';
  const xAxisProps = {
    tick: { fontSize: 10, fill: axisColor },
    angle: -35 as const,
    textAnchor: 'end' as const,
    height: 48,
  };
  const yAxisProps = { tick: { fontSize: 11, fill: axisColor }, width: 30 };

  const dauData = daily.map((d) => ({ date: shortDate(d.date), dau: d.activeUsers.length }));
  const mealsData = daily.map((d) => ({ date: shortDate(d.date), meals: d.mealsLogged }));
  const funnelData = daily.map((d) => ({
    date: shortDate(d.date),
    Completed: d.sessionsCompleted,
    Abandoned: d.sessionsAbandoned,
    'In Progress': Math.max(0, d.sessionsStarted - d.sessionsCompleted - d.sessionsAbandoned),
  }));
  const calData = daily.map((d) => ({
    date: shortDate(d.date),
    avg: d.mealsLogged > 0 ? Math.round(d.totalCalories / d.mealsLogged) : 0,
  }));
  const clarData = daily.map((d) => ({
    date: shortDate(d.date),
    rate: d.sessionsStarted > 0
      ? Math.round((d.clarificationsTotal / d.sessionsStarted) * 10) / 10
      : 0,
  }));

  const totalVoice = daily.reduce((s, d) => s + d.voiceModeSessions, 0);
  const totalStarted = daily.reduce((s, d) => s + d.sessionsStarted, 0);
  const inputPie = [
    { name: 'Text', value: Math.max(0, totalStarted - totalVoice) },
    { name: 'Voice', value: totalVoice },
  ];
  const inputPieHasData = inputPie.some((p) => p.value > 0);

  const recentUsers = [...users].slice(0, 10);

  return (
    <div className="flex flex-col gap-4">
      {/* Engagement */}
      <SectionTitle>Engagement</SectionTitle>
      <div className="flex gap-4 flex-wrap">
        <ChartCard title="Daily Active Users">
          {allZero(dauData, 'dau') ? <EmptyChart /> : (
            <ResponsiveContainer width="100%" height={CHART_H}>
              <LineChart data={dauData}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="date" {...xAxisProps} />
                <YAxis {...yAxisProps} allowDecimals={false} />
                <Tooltip formatter={(v: number) => [`${v} users`, 'DAU']} />
                <Line type="monotone" dataKey="dau" stroke={C.primary} strokeWidth={2} dot={false} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Meals Logged Per Day">
          {allZero(mealsData, 'meals') ? <EmptyChart /> : (
            <ResponsiveContainer width="100%" height={CHART_H}>
              <BarChart data={mealsData}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="date" {...xAxisProps} />
                <YAxis {...yAxisProps} allowDecimals={false} />
                <Tooltip formatter={(v: number) => [`${v} meals`, 'Logged']} />
                <Bar dataKey="meals" fill={C.indigo2} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* AI Session Funnel */}
      <SectionTitle>AI Session Funnel</SectionTitle>
      <div className="flex gap-4 flex-wrap">
        <ChartCard title="Session Outcomes (last 30 days)">
          {allZero(funnelData, 'Completed') && allZero(funnelData, 'Abandoned') ? <EmptyChart /> : (
            <ResponsiveContainer width="100%" height={CHART_H}>
              <BarChart data={funnelData}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="date" {...xAxisProps} />
                <YAxis {...yAxisProps} allowDecimals={false} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12, color: axisColor }} />
                <Bar dataKey="Completed" stackId="a" fill={C.green} />
                <Bar dataKey="In Progress" stackId="a" fill={C.amber} />
                <Bar dataKey="Abandoned" stackId="a" fill={C.red} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Avg Clarifications Per Session">
          {allZero(clarData, 'rate') ? <EmptyChart /> : (
            <ResponsiveContainer width="100%" height={CHART_H}>
              <LineChart data={clarData}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="date" {...xAxisProps} />
                <YAxis {...yAxisProps} />
                <Tooltip formatter={(v: number) => [`${v}`, 'Clarifications / session']} />
                <Line type="monotone" dataKey="rate" stroke={C.amber} strokeWidth={2} dot={false} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Nutrition & Input */}
      <SectionTitle>Nutrition &amp; Input</SectionTitle>
      <div className="flex gap-4 flex-wrap">
        <ChartCard title="Avg Calories Per Meal">
          {allZero(calData, 'avg') ? <EmptyChart /> : (
            <ResponsiveContainer width="100%" height={CHART_H}>
              <LineChart data={calData}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="date" {...xAxisProps} />
                <YAxis {...yAxisProps} width={40} />
                <Tooltip formatter={(v: number) => [`${v} kcal`, 'Avg per meal']} />
                <Line type="monotone" dataKey="avg" stroke={C.green} strokeWidth={2} dot={false} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Input Method (30-day)">
          {!inputPieHasData ? <EmptyChart /> : (
            <ResponsiveContainer width="100%" height={CHART_H}>
              <PieChart>
                <Pie
                  data={inputPie}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${Math.round((percent ?? 0) * 100)}%`}
                  labelLine={false}
                >
                  <Cell fill={C.primary} />
                  <Cell fill={C.amber} />
                </Pie>
                <Tooltip formatter={(v: number) => [`${v} sessions`]} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Recent Users */}
      <SectionTitle>Recent Users</SectionTitle>
      <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <div className="grid grid-cols-6 px-4 py-3 text-xs font-bold uppercase tracking-wide opacity-45" style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', color: 'var(--fg)' }}>
          {['User', 'Last Active', 'Total Meals', 'Sessions', 'Completed', 'Active Days'].map((h) => (
            <span key={h}>{h}</span>
          ))}
        </div>
        {recentUsers.length === 0 ? (
          <p className="text-center text-sm opacity-40 p-5" style={{ color: 'var(--fg)' }}>
            No user data yet — starts recording on next session
          </p>
        ) : recentUsers.map((u) => (
          <div key={u.uid} className="grid grid-cols-6 px-4 py-3 text-sm" style={{ borderBottom: '1px solid var(--border)', color: 'var(--fg)' }}>
            <span className="truncate">{u.email ?? (u.uid ? `${u.uid.slice(0, 10)}…` : 'unknown')}</span>
            <span>{u.lastActive?.slice(0, 10) ?? '—'}</span>
            <span>{u.totalMeals ?? 0}</span>
            <span>{u.totalSessions ?? 0}</span>
            <span>{u.totalSessionsCompleted ?? 0}</span>
            <span>{u.activeDates?.length ?? 0}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
