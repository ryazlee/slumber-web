import { useMemo, useState } from 'react';
import type { GridColDef } from '@mui/x-data-grid';
import type { AdminChallengeRow, AdminClubRow } from '../../lib/admin';
import { getOptionalQueryErrorMessage } from '../../lib/queryError';
import { usePaginatedFilters } from '../../hooks/usePaginatedFilters';
import {
  useAdminCancelChallenge,
  useAdminChallenges,
  useAdminClubs,
  useCommunityMetrics,
} from '../../hooks/useAdmin';
import AdminDataGrid from './AdminDataGrid';
import AdminGridAction from './AdminGridAction';
import AdminGridActions from './AdminGridActions';
import AdminMetricCard from './AdminMetricCard';
import AdminSection from './AdminSection';
import AdminTabs from './AdminTabs';
import { gridActionsColumn } from './gridColumnHelpers';
import { dateColumn } from './dateColumn';

type Tab = 'overview' | 'challenges' | 'clubs';

const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'challenges', label: 'Challenges' },
  { id: 'clubs', label: 'Clubs' },
];

function formatGoalMinutes(minutes: number): string {
  const h = Math.round(minutes / 60);
  return `${h}h goal`;
}

export default function AdminCommunity() {
  const [tab, setTab] = useState<Tab>('overview');
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
  const { paginationModel: clubPage, setPaginationModel: setClubPage, filters: clubApplied } =
    usePaginatedFilters({}, []);

  const challengesQuery = useAdminChallenges(challengeApplied, tab !== 'clubs');
  const clubsQuery = useAdminClubs(clubApplied, tab !== 'challenges');

  const metrics = metricsQuery.data ?? null;
  const challenges = challengesQuery.data?.rows ?? [];
  const challengesTotal = challengesQuery.data?.total ?? 0;
  const clubs = clubsQuery.data?.rows ?? [];
  const clubsTotal = clubsQuery.data?.total ?? 0;

  const error = getOptionalQueryErrorMessage(metricsQuery.error, 'Could not load community metrics.')
    ?? getOptionalQueryErrorMessage(challengesQuery.error, 'Could not load challenges.')
    ?? getOptionalQueryErrorMessage(clubsQuery.error, 'Could not load clubs.');

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
      field: 'status',
      headerName: 'Status',
      width: 100,
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

  const clubColumns = useMemo<GridColDef<AdminClubRow>[]>(() => [
    {
      field: 'emoji',
      headerName: '',
      width: 48,
      valueGetter: (_v, row) => row.emoji ?? '🌙',
    },
    {
      field: 'name',
      headerName: 'Club',
      flex: 1,
      minWidth: 140,
    },
    {
      field: 'owner_username',
      headerName: 'Owner',
      width: 120,
      valueFormatter: (value) => `@${value}`,
    },
    {
      field: 'member_count',
      headerName: 'Members',
      type: 'number',
      width: 96,
    },
    {
      field: 'pending_invites',
      headerName: 'Pending',
      type: 'number',
      width: 96,
    },
    dateColumn('created_at', 'Created'),
  ], []);

  return (
    <AdminSection className="admin-community" error={error}>
      <AdminTabs
        ariaLabel="Community sections"
        active={tab}
        onChange={setTab}
        tabs={TABS}
      />

      {tab === 'overview' && metrics ? (
        <div className="admin-metric-grid admin-metric-grid--dense">
          <AdminMetricCard label="Active challenges" value={metrics.active_challenges} sub="In progress" />
          <AdminMetricCard label="Pending challenges" value={metrics.pending_challenges} sub="Awaiting accept" />
          <AdminMetricCard
            label="Completed (30d)"
            value={metrics.completed_challenges_30d}
            sub="Finished recently"
          />
          <AdminMetricCard label="Clubs" value={metrics.total_clubs} sub="Total groups" />
          <AdminMetricCard
            label="Club members"
            value={metrics.club_members_accepted}
            sub={`${metrics.pending_club_invites} pending invites`}
          />
        </div>
      ) : null}

      {tab === 'challenges' ? (
        <>
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
            persistKey="admin-community-challenges"
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
        </>
      ) : null}

      {tab === 'clubs' ? (
        <AdminDataGrid
          persistKey="admin-community-clubs"
          rows={clubs}
          columns={clubColumns}
          getRowId={(row) => row.id}
          loading={clubsQuery.isFetching}
          label="Clubs"
          serverPagination={{
            rowCount: clubsTotal,
            paginationModel: clubPage,
            onPaginationModelChange: setClubPage,
          }}
          initialState={{
            sorting: { sortModel: [{ field: 'created_at', sort: 'desc' }] },
          }}
        />
      ) : null}

      {metricsQuery.isLoading && !metrics ? (
        <p className="admin-muted">Loading community metrics…</p>
      ) : null}
    </AdminSection>
  );
}
