import type { ReactNode } from 'react';
import type { GridColDef } from '@mui/x-data-grid';
import { dateColumn } from './dateColumn';
import AdminCopyButton from './AdminCopyButton';

export function renderIdCode(value: unknown) {
  return value ? <code className="admin-code">{String(value)}</code> : '—';
}

/** Narrow id with a copy control. Not a flex column, so it does not crowd the scan. */
export function idCodeColumn<T extends Record<string, unknown>>(
  field: string,
  headerName: string,
  overrides: Partial<GridColDef<T>> = {},
): GridColDef<T> {
  return {
    field,
    headerName,
    width: 168,
    flex: 0,
    sortable: false,
    renderCell: ({ value }) => (
      <span className="admin-id-cell">
        {renderIdCode(value)}
        {value ? <AdminCopyButton value={String(value)} /> : null}
      </span>
    ),
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
    flex: 1,
    minWidth: 160,
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
    flex: 0,
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
    ...dateColumn(field, headerName, overrides.flex ?? 0),
    ...overrides,
  };
}

export const gridActionsColumn = {
  sortable: false,
  filterable: false,
  disableColumnMenu: true,
  flex: 0,
} as const;

export type AdminMobileSummary = {
  title: (row: any) => ReactNode;
  /** Plain text the in-grid search matches while the mobile summary column is showing. */
  searchText: (row: any) => string;
  status?: (row: any) => ReactNode;
  facts?: { label: string; value: (row: any) => ReactNode }[];
};

const ACTION_FIELDS = new Set(['actions', 'post_actions']);

/** One summary cell plus the existing action buttons, so a phone does not scroll a wide grid. */
export function buildMobileColumns(
  columns: readonly GridColDef[],
  summary: AdminMobileSummary,
): GridColDef[] {
  const actions = columns.filter((col) => ACTION_FIELDS.has(col.field));
  const summaryCol: GridColDef = {
    field: '__summary',
    headerName: 'Summary',
    flex: 1,
    minWidth: 160,
    sortable: false,
    disableColumnMenu: true,
    valueGetter: (_value, row) => summary.searchText(row),
    renderCell: ({ row }) => (
      <div className="admin-mobile-summary">
        <div className="admin-mobile-card-header">
          <span className="admin-mobile-card-title">{summary.title(row)}</span>
          {summary.status ? summary.status(row) : null}
        </div>
        {summary.facts?.length ? (
          <dl className="admin-mobile-card-facts">
            {summary.facts.map((fact) => (
              <div key={fact.label}>
                <dt>{fact.label}</dt>
                <dd>{fact.value(row)}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </div>
    ),
  };
  return [
    summaryCol,
    ...actions.map((col) => ({
      ...col,
      flex: 0,
      minWidth: 0,
      width: Math.min(col.width ?? 160, 200),
    })),
  ];
}

export function AdminStatusPill({
  tone = 'neutral',
  children,
}: {
  tone?: 'on' | 'off' | 'neutral';
  children: ReactNode;
}) {
  return <span className={`admin-status-pill admin-status-pill--${tone}`}>{children}</span>;
}
