import { addDaysToDateISO, getLocalDateISO } from './dates';
import { enrichSleepPostRows } from './feed';
import {
  filterWearableSleepRows,
  type ManualSleepRowFlags,
} from './sleepPostCustom';
import { supabase } from './supabase';
import {
  averageBedtimeMinutes,
  averageWakeTimeMinutes,
  extractBedtimeMinutes,
  extractWakeTimeMinutes,
  formatSleepClockMinutes,
} from './sleepTimeStats';
import type { LifetimeStats, MonthBest, TopNight, UserStats } from './statsTypes';
import type { SleepSessionData } from './types';

type SleepPostRow = ManualSleepRowFlags & {
  id: string;
  sleep_date: string;
  asleep_minutes: number | null;
  deep_minutes: number | null;
  rem_minutes: number | null;
  core_minutes: number | null;
  bedtime?: string | null;
  wake_time?: string | null;
  session_breakdown?: SleepSessionData[] | null;
};

type PRRow = {
  record_type: string;
  value: number;
  achieved_at: string;
  post_id: string | null;
  scope: string | null;
};

function avg(arr: number[]): number {
  return arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
}

function buildTopNight(r: SleepPostRow): TopNight {
  return {
    postId: r.id,
    sleepDate: r.sleep_date,
    asleepMinutes: r.asleep_minutes ?? 0,
    deepMinutes: r.deep_minutes ?? 0,
    remMinutes: r.rem_minutes ?? 0,
    coreMinutes: r.core_minutes ?? 0,
  };
}

function findPR(prs: PRRow[], type: string) {
  const r = prs.find((p) => p.record_type === type && p.scope === 'all_time');
  return r ? { value: r.value, date: r.achieved_at, postId: r.post_id } : null;
}

export async function fetchUserStats(userId: string): Promise<UserStats> {
  const sevenDaysAgo = addDaysToDateISO(getLocalDateISO(), -7);

  const [streakRes, prsRes, recentRes] = await Promise.all([
    supabase.from('streaks').select('current_streak, longest_streak').eq('user_id', userId).maybeSingle(),
    supabase.from('personal_records').select('record_type, value, achieved_at, post_id, scope').eq('user_id', userId),
    supabase.from('sleep_posts').select('*, profiles(username, avatar_url, user_roles)')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .gte('sleep_date', sevenDaysAgo)
      .order('sleep_date', { ascending: false }),
  ]);

  const wearableRows = filterWearableSleepRows(recentRes.data ?? []);
  const weeklyPosts = await enrichSleepPostRows(wearableRows);
  const prs = (prsRes.data ?? []) as PRRow[];

  return {
    currentStreak: streakRes.data?.current_streak ?? 0,
    longestStreak: streakRes.data?.longest_streak ?? 0,
    weeklyPosts,
    avgAsleepMinutes: avg(weeklyPosts.map((p) => p.asleepMinutes)),
    prLongestSleep: findPR(prs, 'longest_sleep'),
    prMostDeep: findPR(prs, 'most_deep_sleep'),
    prMostRem: findPR(prs, 'most_rem'),
    prMostCore: findPR(prs, 'most_core_sleep'),
  };
}

async function fetchLifetimeData(userId: string) {
  const cols = 'id, sleep_date, asleep_minutes, deep_minutes, rem_minutes, core_minutes, is_custom, source_device';
  const baseFilter = () => supabase.from('sleep_posts').select(cols)
    .eq('user_id', userId)
    .is('deleted_at', null)
    .not('asleep_minutes', 'is', null);

  const [bestRes, deepRes, remRes, coreRes, allRes, monthlyRes] = await Promise.all([
    baseFilter().order('asleep_minutes', { ascending: false }).limit(3),
    baseFilter().gt('deep_minutes', 0).order('deep_minutes', { ascending: false }).limit(3),
    baseFilter().gt('rem_minutes', 0).order('rem_minutes', { ascending: false }).limit(3),
    baseFilter().gt('core_minutes', 0).order('core_minutes', { ascending: false }).limit(3),
    supabase.from('sleep_posts').select('asleep_minutes, bedtime, wake_time, session_breakdown, is_custom, source_device')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .not('asleep_minutes', 'is', null),
    supabase.from('sleep_posts').select(`${cols}, bedtime, wake_time, session_breakdown`)
      .eq('user_id', userId)
      .is('deleted_at', null)
      .not('asleep_minutes', 'is', null)
      .order('sleep_date', { ascending: false })
      .limit(400),
  ]);

  return {
    bestNights: filterWearableSleepRows((bestRes.data ?? []) as SleepPostRow[]).map(buildTopNight),
    mostDeepNights: filterWearableSleepRows((deepRes.data ?? []) as SleepPostRow[]).map(buildTopNight),
    mostRemNights: filterWearableSleepRows((remRes.data ?? []) as SleepPostRow[]).map(buildTopNight),
    mostCoreNights: filterWearableSleepRows((coreRes.data ?? []) as SleepPostRow[]).map(buildTopNight),
    allRows: filterWearableSleepRows((allRes.data ?? []) as SleepPostRow[]),
    monthlyRows: filterWearableSleepRows((monthlyRes.data ?? []) as SleepPostRow[]),
  };
}

function computeAggregateMetrics(
  rows: Pick<SleepPostRow, 'asleep_minutes' | 'bedtime' | 'wake_time' | 'session_breakdown'>[],
) {
  const totalNights = rows.length;
  if (totalNights === 0) {
    return { totalNights: 0, avgAsleepMinutes: 0, avgBedtime: null, avgWakeTime: null };
  }

  const avgAsleepMinutes = Math.round(rows.reduce((s, r) => s + (r.asleep_minutes ?? 0), 0) / totalNights);
  const bedtimeMins = rows
    .map((r) => extractBedtimeMinutes(r.bedtime, r.session_breakdown))
    .filter((v): v is number => v !== null);
  const wakeTimeMins = rows
    .map((r) => extractWakeTimeMinutes(r.wake_time, r.session_breakdown))
    .filter((v): v is number => v !== null);
  const avgBedtimeMin = averageBedtimeMinutes(bedtimeMins);
  const avgWakeTimeMin = averageWakeTimeMinutes(wakeTimeMins);

  return {
    totalNights,
    avgAsleepMinutes,
    avgBedtime: avgBedtimeMin != null ? formatSleepClockMinutes(avgBedtimeMin) : null,
    avgWakeTime: avgWakeTimeMin != null ? formatSleepClockMinutes(avgWakeTimeMin) : null,
  };
}

function computeMonthlyBests(rows: SleepPostRow[]): MonthBest[] {
  type MonthAccum = MonthBest & { bedtimeSums: number[]; wakeTimeSums: number[] };
  const monthMap = new Map<string, MonthAccum>();

  for (const r of rows) {
    const month = r.sleep_date.slice(0, 7);
    const existing = monthMap.get(month);
    const bt = extractBedtimeMinutes(r.bedtime, r.session_breakdown);
    const wt = extractWakeTimeMinutes(r.wake_time, r.session_breakdown);

    if (!existing) {
      monthMap.set(month, {
        month,
        label: new Date(`${month}-15T12:00:00`).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        asleepMinutes: r.asleep_minutes ?? 0,
        deepMinutes: r.deep_minutes ?? 0,
        remMinutes: r.rem_minutes ?? 0,
        coreMinutes: r.core_minutes ?? 0,
        avgBedtime: null,
        avgWakeTime: null,
        bedtimeSums: bt != null ? [bt] : [],
        wakeTimeSums: wt != null ? [wt] : [],
      });
    } else {
      if (bt != null) existing.bedtimeSums.push(bt);
      if (wt != null) existing.wakeTimeSums.push(wt);
      monthMap.set(month, {
        ...existing,
        asleepMinutes: Math.max(existing.asleepMinutes, r.asleep_minutes ?? 0),
        deepMinutes: Math.max(existing.deepMinutes, r.deep_minutes ?? 0),
        remMinutes: Math.max(existing.remMinutes, r.rem_minutes ?? 0),
        coreMinutes: Math.max(existing.coreMinutes, r.core_minutes ?? 0),
      });
    }
  }

  return [...monthMap.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([, v]) => {
      const btAvg = averageBedtimeMinutes(v.bedtimeSums);
      const wtAvg = averageWakeTimeMinutes(v.wakeTimeSums);
      return {
        month: v.month,
        label: v.label,
        asleepMinutes: v.asleepMinutes,
        deepMinutes: v.deepMinutes,
        remMinutes: v.remMinutes,
        coreMinutes: v.coreMinutes,
        avgBedtime: btAvg != null ? formatSleepClockMinutes(btAvg) : null,
        avgWakeTime: wtAvg != null ? formatSleepClockMinutes(wtAvg) : null,
      };
    });
}

export async function fetchLifetimeStats(userId: string): Promise<LifetimeStats> {
  const data = await fetchLifetimeData(userId);
  return {
    ...computeAggregateMetrics(data.allRows),
    bestNights: data.bestNights,
    mostDeepNights: data.mostDeepNights,
    mostRemNights: data.mostRemNights,
    mostCoreNights: data.mostCoreNights,
    monthlyBests: computeMonthlyBests(data.monthlyRows),
  };
}
