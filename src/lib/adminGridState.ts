import type { GridInitialState } from '@mui/x-data-grid';
import { loadPersistedJson, savePersistedJson } from './persistedState';

const STORAGE_PREFIX = 'slumber:admin-grid:';

export function gridStateStorageKey(persistKey: string): string {
  return `${STORAGE_PREFIX}${persistKey}`;
}

export function loadAdminGridState(persistKey: string): GridInitialState | null {
  return loadPersistedJson<GridInitialState>(gridStateStorageKey(persistKey));
}

export function saveAdminGridState(persistKey: string, state: GridInitialState): void {
  savePersistedJson(gridStateStorageKey(persistKey), state);
}

export function mergeGridInitialState(
  defaults: GridInitialState,
  persisted: GridInitialState | null,
): GridInitialState {
  if (!persisted) return defaults;

  return {
    ...defaults,
    ...persisted,
    pagination: {
      ...defaults.pagination,
      ...persisted.pagination,
      paginationModel: {
        ...defaults.pagination?.paginationModel,
        ...persisted.pagination?.paginationModel,
      },
    },
    columns: {
      ...defaults.columns,
      ...persisted.columns,
      columnVisibilityModel: {
        ...defaults.columns?.columnVisibilityModel,
        ...persisted.columns?.columnVisibilityModel,
      },
    },
    sorting: persisted.sorting ?? defaults.sorting,
    filter: persisted.filter ?? defaults.filter,
    density: persisted.density ?? defaults.density,
  };
}
