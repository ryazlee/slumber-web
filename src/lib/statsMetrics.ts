import type { PeriodStats } from './compareStats';
import { formatMins } from './format';
import type { StatsMetric } from './statsTypes';

export function buildMonthMetrics(month: PeriodStats): StatsMetric[] {
  if (!month || month.postsCount === 0) return [];

  return [
    { label: 'Avg sleep', value: month.asleep != null ? formatMins(Math.round(month.asleep)) : '—' },
    { label: 'Avg wakes', value: month.awakeEvents != null ? String(month.awakeEvents) : '—' },
    { label: 'Dream rate', value: month.dreamRate != null ? `${month.dreamRate}%` : '—' },
    { label: 'Avg in bed', value: month.inBed != null ? formatMins(Math.round(month.inBed)) : '—' },
    { label: 'Avg bedtime', value: month.avgBedtime ?? '—' },
    { label: 'Avg wake-up', value: month.avgWakeTime ?? '—' },
  ];
}
