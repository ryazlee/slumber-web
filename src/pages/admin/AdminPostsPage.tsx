import { useEffect, useState } from 'react';
import AdminPosts from '../../components/admin/AdminPosts';
import { loadAnalyticsFilters, saveAnalyticsFilters } from '../../lib/analyticsFilterState';
import { rangeForPreset, type DateRange, type RangePreset } from '../../lib/analyticsRange';

function initialFilters(): { preset: RangePreset; range: DateRange; appVersion: string } {
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

export default function AdminPostsPage() {
  const [filters, setFilters] = useState(initialFilters);
  const { preset, range, appVersion } = filters;

  useEffect(() => {
    saveAnalyticsFilters(filters);
  }, [filters]);

  return (
    <AdminPosts
      range={range}
      preset={preset}
      appVersion={appVersion}
      onPresetChange={(next) => setFilters((prev) => ({ ...prev, preset: next }))}
      onRangeChange={(next) => setFilters((prev) => ({ ...prev, range: next }))}
      onAppVersionChange={(next) => setFilters((prev) => ({ ...prev, appVersion: next }))}
    />
  );
}
