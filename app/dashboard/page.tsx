'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { fetchDailyAnalytics, fetchAllUserAnalytics, fetchMealHistory } from '@/lib/firestore';
import { KpiCard } from '@/components/kpi-card';
import { ActivityCharts } from '@/components/charts';
import type { DailyAnalytics, UserAnalytics } from '@/models/analytics';

const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

function formatDuration(totalSeconds: number): string {
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

function SkeletonBlock({ w, h }: { w: string; h: number }) {
  return <div className="animate-pulse rounded-xl" style={{ width: w, height: h, background: 'var(--border)' }} />;
}

function DashboardSkeleton() {
  return (
    <>
      <div className="flex flex-wrap gap-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2 rounded-2xl p-5 flex-1 min-w-[140px]" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <SkeletonBlock w="60px" h={36} />
            <SkeletonBlock w="90px" h={12} />
            <SkeletonBlock w="70px" h={10} />
          </div>
        ))}
      </div>
      <div className="flex gap-4 flex-wrap">
        {[0, 1].map((i) => (
          <div key={i} className="flex-1 min-w-[300px] rounded-2xl overflow-hidden" style={{ background: 'var(--card)' }}>
            <SkeletonBlock w="100%" h={290} />
          </div>
        ))}
      </div>
    </>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);
  const [daily, setDaily] = useState<DailyAnalytics[]>([]);
  const [users, setUsers] = useState<UserAnalytics[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      if (!user || !ADMIN_EMAILS.includes(user.email?.toLowerCase() ?? '')) {
        router.replace('/login');
      } else {
        setAuthed(true);
      }
    });
  }, [router]);

  const loadData = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([fetchDailyAnalytics(30), fetchMealHistory(30), fetchAllUserAnalytics()])
      .then(([analytics, mealHistory, userStats]) => {
        const merged = analytics.map((d) => {
          const hist = mealHistory.get(d.date);
          return {
            ...d,
            mealsLogged: hist ? hist.meals : d.mealsLogged,
            totalCalories: hist ? hist.calories : d.totalCalories,
            activeUsers: hist ? [...hist.uids] : d.activeUsers,
          };
        });
        setDaily(merged);
        setUsers(userStats);
        const allUids = new Set([...mealHistory.values()].flatMap((v) => [...v.uids]));
        setTotalUsers(Math.max(userStats.length, allUids.size));
      })
      .catch((e: Error) => setError(e?.message ?? 'Failed to load analytics'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (authed) loadData();
  }, [authed, loadData, refreshKey]);

  // Derived KPIs
  const today = daily[daily.length - 1];
  const dauToday = today?.activeUsers.length ?? 0;
  const mealsToday = today?.mealsLogged ?? 0;
  const completedTotal = daily.reduce((s, d) => s + d.sessionsCompleted, 0);
  const startedTotal = daily.reduce((s, d) => s + d.sessionsStarted, 0);
  const aiSuccessRate = startedTotal > 0 ? Math.round((completedTotal / startedTotal) * 100) : 0;
  const totalMeals30 = daily.reduce((s, d) => s + d.mealsLogged, 0);
  const activeDays = daily.filter((d) => d.mealsLogged > 0).length;
  const avgMealsDay = activeDays > 0 ? (totalMeals30 / activeDays).toFixed(1) : '—';
  const totalDuration = daily.reduce((s, d) => s + d.totalSessionDuration, 0);
  const avgDuration = completedTotal > 0 ? formatDuration(Math.round(totalDuration / completedTotal)) : '—';
  const retainedUsers = users.filter((u) => (u.activeDates?.length ?? 0) >= 2).length;
  const retentionRate = totalUsers > 0 ? Math.round((retainedUsers / totalUsers) * 100) : 0;
  const premiumTaps30 = daily.reduce((s, d) => s + d.premiumUpsellClicks, 0);
  const voiceToggles30 = daily.reduce((s, d) => s + d.voiceToggles, 0);

  if (!authed) return null;

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <div className="max-w-[1200px] mx-auto px-5 py-8 flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold" style={{ color: 'var(--fg)' }}>Operations Dashboard</h1>
            <p className="text-xs opacity-40 mt-0.5" style={{ color: 'var(--fg)' }}>Last 30 days · live Firestore</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setRefreshKey((k) => k + 1)}
              disabled={loading}
              className="px-3 py-1.5 rounded-xl text-sm font-semibold disabled:opacity-40"
              style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--fg)' }}
            >
              ↺ Refresh
            </button>
            <button
              onClick={() => signOut(auth).then(() => router.replace('/login'))}
              className="px-3 py-1.5 rounded-xl text-sm font-semibold"
              style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--fg)' }}
            >
              Sign out
            </button>
          </div>
        </div>

        {error ? (
          <p className="text-red-500 text-sm">{error}</p>
        ) : loading ? (
          <DashboardSkeleton />
        ) : (
          <>
            {/* KPIs */}
            <div className="flex flex-wrap gap-3">
              <KpiCard label="Total Users" value={totalUsers} sub="ever logged a meal" />
              <KpiCard label="DAU Today" value={dauToday} sub="unique active" accent="#10B981" />
              <KpiCard label="Meals Today" value={mealsToday} sub="logged" accent="#818CF8" />
              <KpiCard label="AI Success" value={aiSuccessRate > 0 ? `${aiSuccessRate}%` : '—'} sub="30-day completion" accent="#F59E0B" />
              <KpiCard label="Avg Meals/Day" value={avgMealsDay} sub="on active days" accent="#6366F1" />
              <KpiCard label="Avg Session" value={avgDuration} sub="to log a meal" accent="#10B981" />
              <KpiCard label="Retention" value={retentionRate > 0 ? `${retentionRate}%` : '—'} sub="users on 2+ days" accent="#F43F5E" />
              <KpiCard label="Premium Taps" value={premiumTaps30} sub="30-day upsell hits" accent="#8B5CF6" />
              <KpiCard label="Voice Toggles" value={voiceToggles30} sub="30-day enables" accent="#06B6D4" />
            </div>

            {/* Charts */}
            <ActivityCharts daily={daily} users={users} />
          </>
        )}
      </div>
    </div>
  );
}
