import type { GridColDef } from '@mui/x-data-grid';
import type { RecentPostRow } from '../../lib/admin';
import AdminGridAction from './AdminGridAction';
import AdminGridActions from './AdminGridActions';
import { dateColumn } from './dateColumn';
import { gridActionsColumn, idCodeColumn } from './gridColumnHelpers';

export type RecentPostColumnOptions = {
  actingPostId?: string | null;
  onRecalculate?: (post: RecentPostRow) => void;
  onRepair?: (post: RecentPostRow) => void;
  onSoftDelete?: (post: RecentPostRow) => void;
};

function isWearablePost(row: RecentPostRow): boolean {
  return !row.is_custom && row.source_device !== 'Custom';
}

function needsStageRepair(row: RecentPostRow): boolean {
  return isWearablePost(row)
    && row.in_bed_minutes > 0
    && row.asleep_minutes > row.in_bed_minutes + 5;
}

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

export function buildRecentPostColumns(
  options: RecentPostColumnOptions = {},
): GridColDef<RecentPostRow>[] {
  const { actingPostId = null, onRecalculate, onRepair, onSoftDelete } = options;

  const cols: GridColDef<RecentPostRow>[] = [
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

  if (onRecalculate || onRepair || onSoftDelete) {
    cols.push({
      field: 'recalculate_stages',
      headerName: 'Actions',
      ...gridActionsColumn,
      width: onSoftDelete ? (onRepair ? 196 : 156) : (onRepair ? 156 : 120),
      renderCell: ({ row }) => {
        const wearable = isWearablePost(row);
        const busy = actingPostId === row.id;
        const inflated = needsStageRepair(row);
        return (
          <AdminGridActions>
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
            {onRepair && inflated ? (
              <AdminGridAction
                variant="accent"
                disabled={!wearable || busy}
                title="Collapse duplicate stage segments"
                onClick={(e) => {
                  e.stopPropagation();
                  onRepair(row);
                }}
              >
                {busy ? '…' : 'Repair'}
              </AdminGridAction>
            ) : null}
            {onRecalculate ? (
              <AdminGridAction
                disabled={!wearable || busy}
                title="Sum stage minutes from raw_samples"
                onClick={(e) => {
                  e.stopPropagation();
                  onRecalculate(row);
                }}
              >
                {busy ? '…' : 'Recalc'}
              </AdminGridAction>
            ) : null}
          </AdminGridActions>
        );
      },
    });
  }

  return cols;
}
