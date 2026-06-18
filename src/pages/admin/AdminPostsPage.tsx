import { useEffect, useState } from 'react';
import AdminPosts from '../../components/admin/AdminPosts';
import { loadAnalyticsFilters, saveAnalyticsFilters } from '../../lib/analyticsFilterState';
import { rangeForPreset, type DateRange, type RangePreset } from '../../lib/analyticsRange';

const POSTS_LIST_LIMIT_KEY = 'slumber:admin-posts-list-limit';

function loadPostsListLimit(): number {
  try {
    const raw = localStorage.getItem(POSTS_LIST_LIMIT_KEY);
    const n = raw ? Number(raw) : 200;
    return [50, 100, 200].includes(n) ? n : 200;
  } catch {
    return 200;
  }
}

function savePostsListLimit(limit: number): void {
  try {
    localStorage.setItem(POSTS_LIST_LIMIT_KEY, String(limit));
  } catch {
    // ignore
  }
}

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
  const [listLimit, setListLimit] = useState(loadPostsListLimit);
  const { preset, range, appVersion } = filters;

  useEffect(() => {
    saveAnalyticsFilters(filters);
  }, [filters]);

  useEffect(() => {
    savePostsListLimit(listLimit);
  }, [listLimit]);

  return (
    <AdminPosts
      range={range}
      preset={preset}
      appVersion={appVersion}
      listLimit={listLimit}
      onPresetChange={(next) => setFilters((prev) => ({ ...prev, preset: next }))}
      onRangeChange={(next) => setFilters((prev) => ({ ...prev, range: next }))}
      onAppVersionChange={(next) => setFilters((prev) => ({ ...prev, appVersion: next }))}
      onListLimitChange={setListLimit}
    />
  );
}
