import { useMemo } from 'react';
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
import AdminMetricCard from './AdminMetricCard';
import AdminSection from './AdminSection';
import { dateColumn } from './dateColumn';

export default function AdminCommunity() {
  const [searchParams, setSearchParams] = useSearchParams();
  const clubId = searchParams.get('club');

  const openClub = (id: string) => {
    const next = new URLSearchParams(searchParams);
    next.set('club', id);
    setSearchParams(next);
  };

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
      field: 'active_members_7d',
      headerName: 'Posted 7d',
      type: 'number',
      width: 100,
      valueGetter: (_v, row) => row.active_members_7d ?? null,
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
    <AdminSection
      className="admin-community"
      error={error}
      lead="Clubs people belong to. Click a club to see who is in it and who posted this week."
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
        persistKey="admin-community-clubs"
        rows={clubs}
        columns={clubColumns}
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
