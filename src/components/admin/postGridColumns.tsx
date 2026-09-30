import type { GridColDef } from '@mui/x-data-grid';
import type { RecentPostRow } from '../../lib/admin';
import AdminGridAction from './AdminGridAction';
import AdminGridActions from './AdminGridActions';
import AdminPostRawCell from './AdminPostRawCell';
import { dateColumn } from './dateColumn';
import {
  AdminStatusPill,
  gridActionsColumn,
  idCodeColumn,
  type AdminMobileSummary,
} from './gridColumnHelpers';

export type RecentPostColumnOptions = {
  actingPostId?: string | null;
  expandedRawIds?: ReadonlySet<string>;
  onToggleRaw?: (postId: string) => void;
  onOpenPost?: (post: RecentPostRow) => void;
  onSoftDelete?: (post: RecentPostRow) => void;
};

function formatSleepMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return m ? `${h}h ${m}m` : `${h}h`;
}

function sleepMinutesColumn(
  field: keyof RecentPostRow,
  headerName: string,
  width = 84,
): GridColDef<RecentPostRow> {
  return {
    field,
    headerName,
    type: 'number',
    width,
    flex: 0,
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

function sleepDateLabel(row: RecentPostRow): string {
  if (!row.sleep_date) return '—';
  return new Date(`${row.sleep_date}T12:00:00`).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export const postMobileSummary: AdminMobileSummary = {
  title: (row: RecentPostRow) => row.title?.trim() || 'Untitled',
  searchText: (row: RecentPostRow) => [row.title, row.username, postSourceLabel(row), row.sleep_date].filter(Boolean).join(' '),
  status: (row: RecentPostRow) => <AdminStatusPill>{postSourceLabel(row)}</AdminStatusPill>,
  facts: [
    { label: 'User', value: (row: RecentPostRow) => `@${row.username}` },
    { label: 'Night', value: (row: RecentPostRow) => sleepDateLabel(row) },
    {
      label: 'Asleep',
      value: (row: RecentPostRow) => (
        row.asleep_minutes == null ? '—' : formatSleepMinutes(Number(row.asleep_minutes))
      ),
    },
  ],
};

export function buildRecentPostColumns(
  options: RecentPostColumnOptions = {},
): GridColDef<RecentPostRow>[] {
  const { actingPostId = null, expandedRawIds, onToggleRaw, onOpenPost, onSoftDelete } = options;

  const cols: GridColDef<RecentPostRow>[] = [
    {
      field: 'username',
      headerName: 'User',
      flex: 0.8,
      minWidth: 110,
      valueGetter: (_value, row) => row.username,
      valueFormatter: (value) => `@${value}`,
    },
    {
      field: 'sleep_date',
      headerName: 'Sleep date',
      type: 'date',
      width: 120,
      flex: 0,
      valueGetter: (_value, row) => (row.sleep_date ? new Date(`${row.sleep_date}T12:00:00`) : null),
      valueFormatter: (value: Date | null) => {
        if (value == null) return '—';
        return value.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
      },
    },
    {
      field: 'title',
      headerName: 'Title',
      flex: 1.4,
      minWidth: 160,
    },
    sleepMinutesColumn('asleep_minutes', 'Asleep'),
    {
      field: 'source',
      headerName: 'Source',
      width: 110,
      flex: 0,
      valueGetter: (_value, row) => postSourceLabel(row),
    },
    {
      field: 'kudos_count',
      headerName: 'Kudos',
      type: 'number',
      width: 80,
      flex: 0,
      valueGetter: (_value, row) => Number(row.kudos_count ?? 0),
    },
    {
      field: 'comments_count',
      headerName: 'Comments',
      type: 'number',
      width: 100,
      flex: 0,
      valueGetter: (_value, row) => Number(row.comments_count ?? 0),
    },
    dateColumn('created_at', 'Logged'),
    {
      field: 'has_dream',
      headerName: 'Dream',
      width: 80,
      flex: 0,
      valueGetter: (_value, row) => (row.has_dream ? 'Yes' : '—'),
    },
    sleepMinutesColumn('in_bed_minutes', 'In bed'),
    sleepMinutesColumn('core_minutes', 'Core'),
    sleepMinutesColumn('deep_minutes', 'Deep'),
    sleepMinutesColumn('rem_minutes', 'REM'),
    sleepMinutesColumn('awake_minutes', 'Awake'),
    {
      field: 'source_device',
      headerName: 'Device',
      width: 120,
      flex: 0,
      valueGetter: (_value, row) => row.source_device?.trim() || '—',
    },
    {
      field: 'is_custom',
      headerName: 'Manual',
      width: 88,
      flex: 0,
      valueGetter: (_value, row) => (row.is_custom ? 'Yes' : '—'),
    },
    idCodeColumn<RecentPostRow>('id', 'Post ID'),
    idCodeColumn<RecentPostRow>('user_id', 'User ID'),
    {
      field: 'raw',
      headerName: 'Raw',
      width: 140,
      flex: 0,
      sortable: false,
      valueGetter: (_value, row) => JSON.stringify(row),
      renderCell: ({ row, value }) => (
        <AdminPostRawCell
          postId={row.id}
          preview={String(value ?? '')}
          open={expandedRawIds?.has(row.id) ?? false}
          onToggle={() => onToggleRaw?.(row.id)}
        />
      ),
    },
  ];

  cols.push({
    field: 'post_actions',
    headerName: 'Actions',
    ...gridActionsColumn,
    width: 168,
    renderCell: ({ row }) => {
      const busy = actingPostId === row.id;
      return (
        <AdminGridActions>
          <AdminGridAction
            onClick={(e) => {
              e.stopPropagation();
              onOpenPost?.(row);
            }}
          >
            Open
          </AdminGridAction>
          {onSoftDelete ? (
            <AdminGridAction
              variant="danger"
              disabled={busy}
              title="Soft-delete post"
              onClick={(e) => {
                e.stopPropagation();
                onSoftDelete(row);
              }}
            >
              {busy ? '…' : 'Delete'}
            </AdminGridAction>
          ) : null}
        </AdminGridActions>
      );
    },
  });

  return cols;
}
