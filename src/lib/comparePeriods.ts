import type { ComparePeriods } from './compareStats';
import type { ComparePeriodKey } from './compareState';

export type { ComparePeriodKey };

export const COMPARE_PERIODS: { key: ComparePeriodKey; label: string }[] = [
  { key: 'today', label: 'Last night' },
  { key: 'week', label: '7d' },
  { key: 'month', label: '30d' },
  { key: 'allTime', label: 'All' },
];

export const COMPARE_PERIOD_HEADLINE: Record<ComparePeriodKey, string> = {
  today: 'Last night',
  week: 'Past 7 days',
  month: 'Past 30 days',
  allTime: 'All time',
};

export type ComparePeriodStatsKey = keyof ComparePeriods;
