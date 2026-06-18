import { useEffect, useState } from 'react';
import { loadAnalyticsFilters, saveAnalyticsFilters } from '../lib/analyticsFilterState';
import { rangeForPreset, type DateRange, type RangePreset } from '../lib/analyticsRange';
import type { AdminAnalyticsScreenProps } from '../components/admin/adminAnalyticsTypes';

type AnalyticsFilterState = {
  preset: RangePreset;
  range: DateRange;
  appVersion: string;
};

function initialFilters(): AnalyticsFilterState {
  const saved = loadAnalyticsFilters();
  if (saved?.range?.start && saved.range.end) {
    return {
      preset: saved.preset ?? '30',
      range: saved.range,
      appVersion: saved.appVersion ?? '',
    };
  }
  return {
    preset: '30',
    range: rangeForPreset('30'),
    appVersion: '',
  };
}

/** Persists analytics date-range filters and exposes screen props for Posts / Analytics. */
export function useAnalyticsFilterPageState(): AdminAnalyticsScreenProps {
  const [filters, setFilters] = useState(initialFilters);
  const { preset, range, appVersion } = filters;

  useEffect(() => {
    saveAnalyticsFilters(filters);
  }, [filters]);

  return {
    range,
    preset,
    appVersion,
    onPresetChange: (next) => setFilters((prev) => ({ ...prev, preset: next })),
    onRangeChange: (next) => setFilters((prev) => ({ ...prev, range: next })),
    onAppVersionChange: (next) => setFilters((prev) => ({ ...prev, appVersion: next })),
  };
}
