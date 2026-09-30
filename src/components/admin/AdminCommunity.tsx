import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { GridColDef } from '@mui/x-data-grid';
import type { AdminClubRow } from '../../lib/admin';
import { getOptionalQueryErrorMessage } from '../../lib/queryError';
import { usePaginatedFilters } from '../../hooks/usePaginatedFilters';
import {
  useAdminClubs,
  useCommunityMetrics,
} from '../../hooks/useAdmin';
import AdminClubRoster from './AdminClubRoster';
import AdminDataGrid from './AdminDataGrid';
import AdminGridAction from './AdminGridAction';
import AdminGridActions from './AdminGridActions';
import AdminMetricCard from './AdminMetricCard';
import AdminSection from './AdminSection';
import { dateColumn } from './dateColumn';
import { gridActionsColumn } from './gridColumnHelpers';

export default function AdminCommunity() {
  const [searchParams, setSearchParams] = useSearchParams();
  const clubId = searchParams.get('club');

  const openClub = useCallback((id: string) => {
    const next = new URLSearchParams(searchParams);
    if (clubId === id) next.delete('club');
    else next.set('club', id);
    setSearchParams(next);
  }, [clubId, searchParams, setSearchParams]);

  const closeClub = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('club');
    setSearchParams(next);
  };

  const metricsQuery = useCommunityMetrics();
  const { paginationModel: clubPage, setPaginationModel: setClubPage, filters: clubApplied } =
    usePaginatedFilters({}, []);

  const clubsQuery = useAdminClubs(clubApplied);
  const metrics = metricsQuery.data ?? null;
  const clubs = clubsQuery.data?.rows ?? [];
  const clubsTotal = clubsQuery.data?.total ?? 0;

  const error = getOptionalQueryErrorMessage(metricsQuery.error, 'Could not load community metrics.')
    ?? getOptionalQueryErrorMessage(clubsQuery.error, 'Could not load clubs.');

  const clubColumns = useMemo<GridColDef<AdminClubRow>[]>(() => [
    {
      field: 'name',
      headerName: 'Club',
      flex: 1.2,
      minWidth: 160,
      valueGetter: (_v, row) => `${row.emoji ? `${row.emoji} ` : ''}${row.name}`,
    },
    {
      field: 'owner_username',
      headerName: 'Owner',
      flex: 1,
      minWidth: 120,
      valueFormatter: (value) => `@${value}`,
    },
    {
      field: 'member_count',
      headerName: 'Members',
      type: 'number',
      width: 100,
      flex: 0,
    },
    {
      field: 'active_members_7d',
      headerName: 'Posted 7d',
      type: 'number',
      width: 110,
      flex: 0,
      valueGetter: (_v, row) => row.active_members_7d ?? null,
    },
    {
      field: 'pending_invites',
      headerName: 'Pending',
      type: 'number',
      width: 96,
      flex: 0,
    },
    dateColumn('created_at', 'Created'),
    {
      field: 'actions',
      headerName: 'Actions',
      ...gridActionsColumn,
      width: 120,
      renderCell: ({ row }) => (
        <AdminGridActions>
          <AdminGridAction
            onClick={(e) => {
              e.stopPropagation();
              openClub(row.id);
            }}
          >
            {clubId === row.id ? 'Close' : 'Members'}
          </AdminGridAction>
        </AdminGridActions>
      ),
    },
  ], [clubId, openClub]);

  const clubMobileSummary = useMemo(() => ({
    title: (row: AdminClubRow) => `${row.emoji ? `${row.emoji} ` : ''}${row.name}`,
    searchText: (row: AdminClubRow) => `${row.name} ${row.owner_username}`,
    facts: [
      { label: 'Owner', value: (row: AdminClubRow) => `@${row.owner_username}` },
      { label: 'Members', value: (row: AdminClubRow) => row.member_count },
      { label: 'Posted 7d', value: (row: AdminClubRow) => row.active_members_7d ?? 0 },
    ],
  }), []);

  return (
    <AdminSection
      className="admin-community"
      error={error}
      lead="Clubs people belong to. Click a club to see who is in it and who posted this week. Click it again to close."
    >
      {metrics ? (
        <div className="admin-metric-grid admin-metric-grid--dense">
          <AdminMetricCard label="Clubs" value={metrics.total_clubs} sub="Total groups" />
          <AdminMetricCard
            label="Club members"
            value={metrics.club_members_accepted}
            sub={`${metrics.pending_club_invites} pending invites`}
          />
        </div>
      ) : metricsQuery.isLoading ? (
        <p className="admin-muted">Loading club metrics…</p>
      ) : null}

      {clubId ? <AdminClubRoster clubId={clubId} onClose={closeClub} /> : null}
      <AdminDataGrid
        persistKey="admin-community-clubs-v2"
        rows={clubs}
        columns={clubColumns}
        mobileSummary={clubMobileSummary}
        getRowId={(row) => row.id}
        loading={clubsQuery.isFetching}
        label="Clubs"
        onRowClick={({ row }) => openClub(row.id)}
        getRowClassName={({ row }) => (row.id === clubId ? 'admin-grid-row--selected' : '')}
        sx={{ '& .MuiDataGrid-row': { cursor: 'pointer' } }}
        serverPagination={{
          rowCount: clubsTotal,
          paginationModel: clubPage,
          onPaginationModelChange: setClubPage,
        }}
        initialState={{
          sorting: { sortModel: [{ field: 'created_at', sort: 'desc' }] },
        }}
      />
    </AdminSection>
  );
}
