import { loadPersistedJson, savePersistedJson } from './persistedState';

export type ComparePeriodKey = 'today' | 'week' | 'month' | 'allTime';

export type ComparePersistedState = {
  people: string[];
  metrics: string[];
  period: ComparePeriodKey;
};

const STORAGE_KEY = 'slumber:web-compare';

export function loadCompareState(): ComparePersistedState | null {
  return loadPersistedJson<ComparePersistedState>(STORAGE_KEY);
}

export function saveCompareState(state: ComparePersistedState): void {
  savePersistedJson(STORAGE_KEY, state);
}
