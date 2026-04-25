import {
  collection,
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { db } from './firebase';
import type { DailyAnalytics, UserAnalytics } from '@/models/analytics';

export async function fetchDailyAnalytics(days: number): Promise<DailyAnalytics[]> {
  const dateKeys: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dateKeys.push(d.toISOString().slice(0, 10));
  }
  const snaps = await Promise.all(dateKeys.map((key) => getDoc(doc(db, 'analytics_daily', key))));
  return snaps.map((snap, idx) => ({
    date: dateKeys[idx],
    mealsLogged: 0,
    sessionsStarted: 0,
    sessionsCompleted: 0,
    sessionsAbandoned: 0,
    clarificationsTotal: 0,
    voiceModeSessions: 0,
    voiceToggles: 0,
    premiumUpsellClicks: 0,
    totalCalories: 0,
    totalSessionDuration: 0,
    activeUsers: [],
    ...snap.data(),
  }));
}

export async function fetchAllUserAnalytics(): Promise<UserAnalytics[]> {
  const snap = await getDocs(query(collection(db, 'analytics_users'), orderBy('lastActive', 'desc')));
  return snap.docs.map((d) => d.data() as UserAnalytics);
}

type MealDayAggregate = { meals: number; calories: number; uids: Set<string> };

export async function fetchMealHistory(days: number): Promise<Map<string, MealDayAggregate>> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffISO = cutoff.toISOString();

  const snap = await getDocs(
    query(collectionGroup(db, 'meals'), where('timestamp', '>=', cutoffISO))
  );

  const map = new Map<string, MealDayAggregate>();
  snap.docs.forEach((d) => {
    const data = d.data() as { timestamp: string; calories: number };
    const dateKey = data.timestamp.slice(0, 10);
    const uid = d.ref.parent.parent?.id ?? 'unknown';
    const existing = map.get(dateKey) ?? { meals: 0, calories: 0, uids: new Set<string>() };
    existing.meals += 1;
    existing.calories += data.calories ?? 0;
    existing.uids.add(uid);
    map.set(dateKey, existing);
  });

  return map;
}
