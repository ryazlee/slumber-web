import type { DateRange, RangePreset } from './analyticsRange';
import { loadPersistedJson, savePersistedJson } from './persistedState';

const STORAGE_KEY = 'slumber:admin-analytics-filters';

export type AnalyticsFilterState = {
  preset: RangePreset;
  range: DateRange;
  appVersion: string;
};

export function loadAnalyticsFilters(): AnalyticsFilterState | null {
  return loadPersistedJson<AnalyticsFilterState>(STORAGE_KEY);
}

export function saveAnalyticsFilters(state: AnalyticsFilterState): void {
  savePersistedJson(STORAGE_KEY, state);
}
