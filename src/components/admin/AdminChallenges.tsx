import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { GridColDef } from '@mui/x-data-grid';
import type { AdminChallengeRow } from '../../lib/admin';
import { formatAdminChallengeTitle } from '../../lib/format';
import { getOptionalQueryErrorMessage } from '../../lib/queryError';
import { usePaginatedFilters } from '../../hooks/usePaginatedFilters';
import {
  useAdminCancelChallenge,
  useAdminChallenges,
  useCommunityMetrics,
} from '../../hooks/useAdmin';
import { AdminCurrentChallenges } from './AdminSnapshotCommunity';
import AdminDataGrid from './AdminDataGrid';
import AdminGridAction from './AdminGridAction';
import AdminGridActions from './AdminGridActions';
import AdminMetricCard from './AdminMetricCard';
import AdminSection from './AdminSection';
import { gridActionsColumn } from './gridColumnHelpers';
import { dateColumn } from './dateColumn';

function formatGoalMinutes(minutes: number): string {
  const h = Math.round(minutes / 60);
  return `${h}h goal`;
}

export default function AdminChallenges() {
  const [statusFilter, setStatusFilter] = useState('');
  const [actingId, setActingId] = useState<string | null>(null);

  const metricsQuery = useCommunityMetrics();
  const cancelMutation = useAdminCancelChallenge();

  const challengeFilters = useMemo(
    () => ({ status: statusFilter || null }),
    [statusFilter],
  );
  const { paginationModel: challengePage, setPaginationModel: setChallengePage, filters: challengeApplied } =
    usePaginatedFilters(challengeFilters, [statusFilter]);

  const challengesQuery = useAdminChallenges(challengeApplied);
  const metrics = metricsQuery.data ?? null;
  const challenges = challengesQuery.data?.rows ?? [];
  const challengesTotal = challengesQuery.data?.total ?? 0;

  const error = getOptionalQueryErrorMessage(metricsQuery.error, 'Could not load community metrics.')
    ?? getOptionalQueryErrorMessage(challengesQuery.error, 'Could not load challenges.');

  const cancelChallenge = async (row: AdminChallengeRow) => {
    if (!window.confirm(`Cancel challenge ${row.id.slice(0, 8)}… (${row.status})?`)) return;
    setActingId(row.id);
    try {
      await cancelMutation.mutateAsync(row.id);
    } finally {
      setActingId(null);
    }
  };

  const challengeColumns = useMemo<GridColDef<AdminChallengeRow>[]>(() => [
    {
      field: 'title',
      headerName: 'Challenge',
      flex: 1.2,
      minWidth: 160,
      valueGetter: (_v, row) => formatAdminChallengeTitle(row),
      renderCell: ({ row }) => (
        <Link to={`/challenge/${row.id}`} className="admin-inline-link">
          {formatAdminChallengeTitle(row)}
        </Link>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 110,
    },
    {
      field: 'creator_username',
      headerName: 'Creator',
      flex: 1,
      minWidth: 120,
      valueFormatter: (value) => `@${value}`,
    },
    {
      field: 'goal_minutes',
      headerName: 'Goal',
      width: 96,
      valueGetter: (_v, row) => row.goal_minutes,
      valueFormatter: (value) => formatGoalMinutes(Number(value)),
    },
    {
      field: 'participant_count',
      headerName: 'Players',
      type: 'number',
      width: 88,
    },
    dateColumn('created_at', 'Created'),
    {
      field: 'actions',
      headerName: '',
      ...gridActionsColumn,
      width: 100,
      renderCell: ({ row }) => (
        <AdminGridActions>
          {row.status === 'pending' || row.status === 'active' ? (
            <AdminGridAction
              variant="danger"
              disabled={actingId === row.id || cancelMutation.isPending}
              onClick={(e) => {
                e.stopPropagation();
                void cancelChallenge(row);
              }}
            >
              Cancel
            </AdminGridAction>
          ) : null}
        </AdminGridActions>
      ),
    },
  ], [actingId, cancelMutation.isPending]);

  return (
    <AdminSection
      className="admin-challenges"
      error={error}
      lead="Active and pending sleep challenges. Cancel a challenge that should not stay live."
    >
      {metrics ? (
        <div className="admin-metric-grid admin-metric-grid--dense">
          <AdminMetricCard label="Active challenges" value={metrics.active_challenges} sub="In progress" />
          <AdminMetricCard label="Pending challenges" value={metrics.pending_challenges} sub="Awaiting accept" />
          <AdminMetricCard
            label="Completed (30d)"
            value={metrics.completed_challenges_30d}
            sub="Finished recently"
          />
        </div>
      ) : metricsQuery.isLoading ? (
        <p className="admin-muted">Loading challenge metrics…</p>
      ) : null}

      <AdminCurrentChallenges limit={50} hideFooterLink />

      <div className="admin-quick-chips" role="group" aria-label="Challenge status">
        {['', 'active', 'pending', 'completed', 'cancelled'].map((status) => (
          <button
            key={status || 'all'}
            type="button"
            className={`admin-tab${statusFilter === status ? ' active' : ''}`}
            onClick={() => setStatusFilter(status)}
          >
            {status ? status : 'All'}
          </button>
        ))}
      </div>
      <AdminDataGrid
        persistKey="admin-challenges"
        rows={challenges}
        columns={challengeColumns}
        getRowId={(row) => row.id}
        loading={challengesQuery.isFetching}
        label="Challenges"
        serverPagination={{
          rowCount: challengesTotal,
          paginationModel: challengePage,
          onPaginationModelChange: setChallengePage,
        }}
        initialState={{
          sorting: { sortModel: [{ field: 'created_at', sort: 'desc' }] },
        }}
      />
    </AdminSection>
  );
}
