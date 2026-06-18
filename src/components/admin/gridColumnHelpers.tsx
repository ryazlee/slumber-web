import type { GridColDef } from '@mui/x-data-grid';
import { dateColumn } from './dateColumn';

export function renderIdCode(value: unknown) {
  return value ? <code className="admin-code">{String(value)}</code> : '—';
}

export function idCodeColumn<T extends Record<string, unknown>>(
  field: string,
  headerName: string,
  overrides: Partial<GridColDef<T>> = {},
): GridColDef<T> {
  return {
    field,
    headerName,
    flex: 1.1,
    minWidth: 200,
    renderCell: ({ value }) => renderIdCode(value),
    ...overrides,
  };
}

export function usernameColumn<T extends Record<string, unknown>>(
  headerName = 'Username',
  overrides: Partial<GridColDef<T>> = {},
): GridColDef<T> {
  const field = (overrides.field ?? 'username') as Extract<keyof T, string>;
  const { field: _field, ...rest } = overrides;
  return {
    field,
    headerName,
    flex: 1,
    minWidth: 120,
    valueGetter: (_value, row) => String(row[field] ?? ''),
    valueFormatter: (value) => (value ? `@${value}` : '—'),
    ...rest,
  };
}

export function emailColumn<T extends Record<string, unknown>>(
  headerName = 'Email',
  overrides: Partial<GridColDef<T>> = {},
): GridColDef<T> {
  const field = (overrides.field ?? 'email') as Extract<keyof T, string>;
  const { field: _field, ...rest } = overrides;
  return {
    field,
    headerName,
    flex: 1.5,
    minWidth: 180,
    valueGetter: (_value, row) => String(row[field] ?? '').trim(),
    valueFormatter: (value) => (value ? String(value) : '—'),
    ...rest,
  };
}

export function sleepDateColumn<T extends Record<string, unknown>>(
  field: string,
  headerName = 'Sleep date',
  width = 120,
): GridColDef<T> {
  return {
    field,
    headerName,
    type: 'date',
    width,
    valueGetter: (_value, row) => {
      const raw = row[field];
      return raw ? new Date(`${String(raw)}T12:00:00`) : null;
    },
    valueFormatter: (value: Date | null) => {
      if (value == null) return '—';
      return value.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    },
  };
}

export function loggedAtColumn<T extends Record<string, unknown>>(
  field: string,
  headerName: string,
  overrides: Partial<GridColDef<T>> = {},
): GridColDef<T> {
  return {
    ...dateColumn(field, headerName, overrides.flex ?? 1),
    ...overrides,
  };
}

export const gridActionsColumn = {
  sortable: false,
  filterable: false,
  disableColumnMenu: true,
} as const;
