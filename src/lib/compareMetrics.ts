import { formatMins } from './format';
import type { PeriodStats } from './compareStats';
import { parseClockToMinutes } from './timeline';

export type CompareMetricCategory =
  | 'activity'
  | 'schedule'
  | 'duration'
  | 'stages'
  | 'mix';

export type CompareMetricDef = {
  id: string;
  kind: 'time' | 'mins' | 'pct' | 'count';
  key: keyof NonNullable<PeriodStats>;
  label: string;
  colorVar?: string;
  category: CompareMetricCategory;
  defaultSelected: boolean;
  lessIsBetter?: boolean;
};

export const COMPARE_METRIC_CATEGORIES: { key: CompareMetricCategory; label: string }[] = [
  { key: 'activity', label: 'Activity' },
  { key: 'schedule', label: 'Schedule' },
  { key: 'duration', label: 'Duration' },
  { key: 'stages', label: 'Stages' },
  { key: 'mix', label: 'Stage mix' },
];

export const ALL_COMPARE_METRICS: CompareMetricDef[] = [
  { id: 'postsCount', kind: 'count', key: 'postsCount', label: 'Posts', category: 'activity', defaultSelected: true },
  { id: 'dreamsCount', kind: 'count', key: 'dreamsCount', label: 'Dreams', category: 'activity', defaultSelected: true },
  { id: 'dreamRate', kind: 'pct', key: 'dreamRate', label: 'Dream rate', category: 'activity', defaultSelected: false },
  { id: 'avgBedtime', kind: 'time', key: 'avgBedtime', label: 'Bedtime', category: 'schedule', defaultSelected: true },
  { id: 'avgWakeTime', kind: 'time', key: 'avgWakeTime', label: 'Wake-up', category: 'schedule', defaultSelected: true },
  { id: 'asleep', kind: 'mins', key: 'asleep', label: 'Sleep', category: 'duration', defaultSelected: true },
  { id: 'inBed', kind: 'mins', key: 'inBed', label: 'In bed', category: 'duration', defaultSelected: true },
  { id: 'bestNight', kind: 'mins', key: 'bestNight', label: 'Best night', category: 'duration', defaultSelected: false },
  { id: 'core', kind: 'mins', key: 'core', label: 'Core', colorVar: 'var(--core)', category: 'stages', defaultSelected: true },
  { id: 'deep', kind: 'mins', key: 'deep', label: 'Deep', colorVar: 'var(--deep)', category: 'stages', defaultSelected: true },
  { id: 'rem', kind: 'mins', key: 'rem', label: 'REM', colorVar: 'var(--rem)', category: 'stages', defaultSelected: true },
  { id: 'awake', kind: 'mins', key: 'awake', label: 'Awake', colorVar: 'var(--awake)', category: 'stages', defaultSelected: true, lessIsBetter: true },
  { id: 'awakeEvents', kind: 'count', key: 'awakeEvents', label: 'Avg wakes', colorVar: 'var(--awake)', category: 'stages', defaultSelected: true, lessIsBetter: true },
  { id: 'corePct', kind: 'pct', key: 'corePct', label: 'Core %', colorVar: 'var(--core)', category: 'mix', defaultSelected: false },
  { id: 'deepPct', kind: 'pct', key: 'deepPct', label: 'Deep %', colorVar: 'var(--deep)', category: 'mix', defaultSelected: false },
  { id: 'remPct', kind: 'pct', key: 'remPct', label: 'REM %', colorVar: 'var(--rem)', category: 'mix', defaultSelected: false },
  { id: 'awakePct', kind: 'pct', key: 'awakePct', label: 'Awake %', colorVar: 'var(--awake)', category: 'mix', defaultSelected: false, lessIsBetter: true },
];

export const DEFAULT_COMPARE_METRIC_IDS = ALL_COMPARE_METRICS
  .filter((m) => m.defaultSelected)
  .map((m) => m.id);

export const ALL_COMPARE_METRIC_IDS = ALL_COMPARE_METRICS.map((m) => m.id);

const METRIC_BY_ID = new Map(ALL_COMPARE_METRICS.map((m) => [m.id, m]));

export function getCompareMetrics(selectedIds: string[]): CompareMetricDef[] {
  return selectedIds
    .map((id) => METRIC_BY_ID.get(id))
    .filter((m): m is CompareMetricDef => !!m);
}

export function formatCompareStat(metric: CompareMetricDef, stats: PeriodStats | null): string {
  if (!stats) return '—';
  const v = stats[metric.key];
  if (v === null || v === undefined) return '—';
  if (metric.kind === 'time') return (v as string) || '—';
  if (metric.kind === 'pct') return `${v}%`;
  if (metric.kind === 'count') return String(v);
  return formatMins(v as number);
}

function timeStatToMinutes(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed || trimmed === '—') return null;
  return parseClockToMinutes(trimmed);
}

export function compareStatNumericValue(
  metric: CompareMetricDef,
  stats: PeriodStats | null,
): number | null {
  if (!stats) return null;
  const v = stats[metric.key];
  if (v === null || v === undefined) return null;
  if (metric.kind === 'time') return timeStatToMinutes(v as string);
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  return null;
}

export function getCompareMetricLeaderIds(
  participantIds: string[],
  statsById: Record<string, PeriodStats | null>,
  metric: CompareMetricDef,
): Set<string> {
  const entries: { id: string; value: number }[] = [];
  for (const id of participantIds) {
    const value = compareStatNumericValue(metric, statsById[id] ?? null);
    if (value !== null) entries.push({ id, value });
  }
  if (entries.length === 0) return new Set();

  const best = metric.lessIsBetter
    ? Math.min(...entries.map((e) => e.value))
    : Math.max(...entries.map((e) => e.value));

  return new Set(entries.filter((e) => e.value === best).map((e) => e.id));
}
