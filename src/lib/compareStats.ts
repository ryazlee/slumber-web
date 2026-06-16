import { addDaysToDateISO, getLastNightSleepDateISO, getLocalDateISO } from './dates';
import {
  filterWearableSleepRows,
  isManualSleepRow,
} from './sleepPostCustom';
import { supabase } from './supabase';
import { parseClockToMinutes, formatClockMinutes } from './timeline';

export type PeriodStats = {
  asleep: number | null;
  deep: number | null;
  rem: number | null;
  core: number | null;
  awake: number | null;
  awakeEvents: number | null;
  inBed: number | null;
  avgBedtime: string | null;
  avgWakeTime: string | null;
  postsCount: number;
  dreamsCount: number;
  dreamRate: number | null;
  deepPct: number | null;
  remPct: number | null;
  corePct: number | null;
  awakePct: number | null;
  bestNight: number | null;
} | null;

export type ComparePeriods = {
  today: PeriodStats;
  week: PeriodStats;
  month: PeriodStats;
  allTime: PeriodStats;
};

type SleepRow = {
  sleep_date: string;
  asleep_minutes: number;
  deep_minutes: number | null;
  rem_minutes: number | null;
  core_minutes: number | null;
  awake_minutes: number | null;
  awake_events: number | null;
  in_bed_minutes: number | null;
  bedtime: string | null;
  wake_time: string | null;
  dream_log: string | null;
  is_custom?: boolean | null;
  source_device?: string | null;
};

function parseTimeToMinutes(s: string | null | undefined): number | null {
  if (!s || s === '—') return null;
  return parseClockToMinutes(s);
}

function minutesToTimeStr(total: number): string {
  return formatClockMinutes(total);
}

function avgTimeMinutes(values: number[], isBedtime: boolean): number | null {
  if (values.length === 0) return null;
  const adjusted = isBedtime ? values.map((v) => (v < 720 ? v + 1440 : v)) : values;
  return Math.round(adjusted.reduce((a, b) => a + b, 0) / adjusted.length);
}

const POST_COLS = 'sleep_date, asleep_minutes, deep_minutes, rem_minutes, core_minutes, awake_minutes, awake_events, in_bed_minutes, bedtime, wake_time, dream_log, is_custom, source_device';

export async function fetchComparePeriods(userId: string): Promise<ComparePeriods> {
  const todayLocal = getLocalDateISO();
  const lastNightDate = getLastNightSleepDateISO();
  const d7 = addDaysToDateISO(todayLocal, -7);
  const d30 = addDaysToDateISO(todayLocal, -30);

  const [todayRes, allRes] = await Promise.all([
    supabase.from('sleep_posts').select(POST_COLS)
      .eq('user_id', userId)
      .eq('sleep_date', lastNightDate)
      .is('deleted_at', null)
      .maybeSingle(),
    supabase.from('sleep_posts').select(POST_COLS)
      .eq('user_id', userId)
      .is('deleted_at', null)
      .not('asleep_minutes', 'is', null),
  ]);

  const rows = filterWearableSleepRows((allRes.data ?? []) as SleepRow[]);

  const hasDream = (r: Pick<SleepRow, 'dream_log'>) => !!r.dream_log?.trim();
  const countDreams = (subset: SleepRow[]) => subset.filter(hasDream).length;

  const pctOf = (subset: SleepRow[], numKey: keyof SleepRow, denomKey: keyof SleepRow) => {
    let num = 0;
    let denom = 0;
    for (const r of subset) {
      const n = (r[numKey] as number | null) ?? 0;
      const d = (r[denomKey] as number | null) ?? 0;
      if (d > 0 && n >= 0) {
        num += n;
        denom += d;
      }
    }
    return denom > 0 ? Math.round((num / denom) * 100) : null;
  };

  const stagePct = (subset: SleepRow[], stage: 'deep_minutes' | 'rem_minutes' | 'core_minutes') =>
    pctOf(subset, stage, 'asleep_minutes');

  const dreamRatePct = (subset: SleepRow[]) =>
    subset.length ? Math.round((countDreams(subset) / subset.length) * 100) : null;

  const bestNightMins = (subset: SleepRow[]) => {
    const values = subset.map((r) => r.asleep_minutes).filter((v) => v > 0);
    return values.length ? Math.max(...values) : null;
  };

  const avgN = (arr: number[]) => (arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null);
  const avgWakes = (subset: SleepRow[]) => {
    if (subset.length === 0) return null;
    const total = subset.reduce((s, r) => s + (r.awake_events ?? 0), 0);
    return Math.round(total / subset.length);
  };
  const col = (subset: SleepRow[], key: keyof SleepRow) =>
    avgN(subset.map((r) => (r[key] as number | null) ?? 0).filter((v) => v > 0));

  const build = (subset: SleepRow[]): PeriodStats => {
    if (subset.length === 0) return null;
    const bedtimeMins = subset.map((r) => parseTimeToMinutes(r.bedtime)).filter((v): v is number => v !== null);
    const wakeTimeMins = subset.map((r) => parseTimeToMinutes(r.wake_time)).filter((v): v is number => v !== null);
    const btAvg = avgTimeMinutes(bedtimeMins, true);
    const wtAvg = avgTimeMinutes(wakeTimeMins, false);
    return {
      asleep: col(subset, 'asleep_minutes'),
      deep: col(subset, 'deep_minutes'),
      rem: col(subset, 'rem_minutes'),
      core: col(subset, 'core_minutes'),
      awake: col(subset, 'awake_minutes'),
      awakeEvents: avgWakes(subset),
      inBed: col(subset, 'in_bed_minutes'),
      avgBedtime: btAvg != null ? minutesToTimeStr(btAvg) : null,
      avgWakeTime: wtAvg != null ? minutesToTimeStr(wtAvg) : null,
      postsCount: subset.length,
      dreamsCount: countDreams(subset),
      dreamRate: dreamRatePct(subset),
      deepPct: stagePct(subset, 'deep_minutes'),
      remPct: stagePct(subset, 'rem_minutes'),
      corePct: stagePct(subset, 'core_minutes'),
      awakePct: pctOf(subset, 'awake_minutes', 'in_bed_minutes'),
      bestNight: bestNightMins(subset),
    };
  };

  const week = rows.filter((r) => r.sleep_date >= d7);
  const month = rows.filter((r) => r.sleep_date >= d30);
  const tRaw = todayRes.data as SleepRow | null;
  const t = tRaw && !isManualSleepRow(tRaw) ? tRaw : null;

  return {
    today: t ? {
      asleep: t.asleep_minutes,
      deep: t.deep_minutes,
      rem: t.rem_minutes,
      core: t.core_minutes,
      awake: t.awake_minutes,
      awakeEvents: t.awake_events ?? 0,
      inBed: t.in_bed_minutes,
      avgBedtime: t.bedtime ?? null,
      avgWakeTime: t.wake_time ?? null,
      postsCount: 1,
      dreamsCount: hasDream(t) ? 1 : 0,
      dreamRate: hasDream(t) ? 100 : 0,
      deepPct: stagePct([t], 'deep_minutes'),
      remPct: stagePct([t], 'rem_minutes'),
      corePct: stagePct([t], 'core_minutes'),
      awakePct: pctOf([t], 'awake_minutes', 'in_bed_minutes'),
      bestNight: t.asleep_minutes > 0 ? t.asleep_minutes : null,
    } : {
      asleep: null,
      deep: null,
      rem: null,
      core: null,
      awake: null,
      awakeEvents: null,
      inBed: null,
      avgBedtime: null,
      avgWakeTime: null,
      postsCount: 0,
      dreamsCount: 0,
      dreamRate: null,
      deepPct: null,
      remPct: null,
      corePct: null,
      awakePct: null,
      bestNight: null,
    },
    week: build(week),
    month: build(month),
    allTime: build(rows),
  };
}
