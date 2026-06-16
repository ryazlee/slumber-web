import type { PeriodStats } from './compareStats';
import { formatMins } from './format';
import { stageColor } from './stageColors';
import type { StatsMetric } from './statsTypes';

export function buildMonthMetrics(month: PeriodStats): StatsMetric[] {
  if (!month || month.postsCount === 0) return [];

  return [
    { label: 'Avg sleep', value: month.asleep != null ? formatMins(month.asleep) : '—', accent: 'var(--accent)' },
    { label: 'Deep', value: month.deepPct != null ? `${month.deepPct}%` : '—', accent: stageColor('deep') },
    { label: 'REM', value: month.remPct != null ? `${month.remPct}%` : '—', accent: stageColor('rem') },
    { label: 'Avg wakes', value: month.awakeEvents != null ? String(month.awakeEvents) : '—', accent: stageColor('awake') },
    { label: 'Dream rate', value: month.dreamRate != null ? `${month.dreamRate}%` : '—' },
    { label: 'Best night', value: month.bestNight != null ? formatMins(month.bestNight) : '—' },
    { label: 'Avg in bed', value: month.inBed != null ? formatMins(month.inBed) : '—' },
    { label: 'Avg bedtime', value: month.avgBedtime ?? '—' },
    { label: 'Avg wake-up', value: month.avgWakeTime ?? '—' },
  ];
}
