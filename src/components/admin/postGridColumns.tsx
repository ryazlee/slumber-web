import type { GridColDef } from '@mui/x-data-grid';
import type { RecentPostRow } from '../../lib/admin';
import { dateColumn } from './dateColumn';
import { idCodeColumn } from './gridColumnHelpers';

function formatSleepMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return m ? `${h}h ${m}m` : `${h}h`;
}

function sleepMinutesColumn(
  field: keyof RecentPostRow,
  headerName: string,
  width = 88,
): GridColDef<RecentPostRow> {
  return {
    field,
    headerName,
    type: 'number',
    width,
    valueGetter: (_value, row) => {
      const raw = row[field];
      return raw == null ? null : Number(raw);
    },
    valueFormatter: (value) => (value == null ? '—' : formatSleepMinutes(Number(value))),
  };
}

function postSourceLabel(row: RecentPostRow): string {
  if (row.is_custom) return 'Manual';
  return row.source_device?.trim() || 'Wearable';
}

export function buildRecentPostColumns(): GridColDef<RecentPostRow>[] {
  return [
    idCodeColumn<RecentPostRow>('id', 'Post ID'),
    idCodeColumn<RecentPostRow>('user_id', 'User ID'),
    {
      field: 'username',
      headerName: 'User',
      flex: 1,
      minWidth: 120,
      valueGetter: (_value, row) => row.username,
      valueFormatter: (value) => `@${value}`,
    },
    {
      field: 'sleep_date',
      headerName: 'Sleep date',
      type: 'date',
      width: 120,
      valueGetter: (_value, row) => (row.sleep_date ? new Date(`${row.sleep_date}T12:00:00`) : null),
      valueFormatter: (value: Date | null) => {
        if (value == null) return '—';
        return value.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
      },
    },
    {
      field: 'title',
      headerName: 'Title',
      flex: 1.5,
      minWidth: 160,
    },
    sleepMinutesColumn('asleep_minutes', 'Asleep'),
    sleepMinutesColumn('in_bed_minutes', 'In bed'),
    sleepMinutesColumn('core_minutes', 'Core'),
    sleepMinutesColumn('deep_minutes', 'Deep'),
    sleepMinutesColumn('rem_minutes', 'REM'),
    sleepMinutesColumn('awake_minutes', 'Awake'),
    {
      field: 'efficiency',
      headerName: 'Efficiency',
      type: 'number',
      width: 96,
      valueGetter: (_value, row) => (row.efficiency == null ? null : Number(row.efficiency)),
      valueFormatter: (value) => (value == null ? '—' : `${value}%`),
    },
    {
      field: 'source',
      headerName: 'Source',
      width: 110,
      valueGetter: (_value, row) => postSourceLabel(row),
    },
    {
      field: 'source_device',
      headerName: 'Device',
      width: 110,
      valueGetter: (_value, row) => row.source_device?.trim() || '—',
    },
    {
      field: 'is_custom',
      headerName: 'Manual',
      type: 'boolean',
      width: 88,
      valueGetter: (_value, row) => row.is_custom,
      valueFormatter: (value) => (value ? 'Yes' : '—'),
    },
    {
      field: 'has_dream',
      headerName: 'Dream',
      type: 'boolean',
      width: 80,
      valueGetter: (_value, row) => row.has_dream,
      valueFormatter: (value) => (value ? 'Yes' : '—'),
    },
    {
      field: 'kudos_count',
      headerName: 'Kudos',
      type: 'number',
      width: 80,
      valueGetter: (_value, row) => Number(row.kudos_count ?? 0),
    },
    {
      field: 'comments_count',
      headerName: 'Comments',
      type: 'number',
      width: 100,
      valueGetter: (_value, row) => Number(row.comments_count ?? 0),
    },
    dateColumn('created_at', 'Logged'),
  ];
}
