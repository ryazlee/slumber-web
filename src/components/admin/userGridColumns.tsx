import type { GridColDef } from '@mui/x-data-grid';
import type { RecentUserRow } from '../../lib/admin';
import { formatRoleList } from '../../lib/userRoles';
import AdminCopyButton from './AdminCopyButton';
import { formatWhen } from './format';
import {
  AdminStatusPill,
  emailColumn,
  loggedAtColumn,
  renderIdCode,
  usernameColumn,
  type AdminMobileSummary,
} from './gridColumnHelpers';

type UserSearchOptions = {
  renderActions?: GridColDef<RecentUserRow>['renderCell'];
};

export const userMobileSummary: AdminMobileSummary = {
  title: (row: RecentUserRow) => `@${row.username}`,
  searchText: (row: RecentUserRow) => [row.username, row.email, formatRoleList(row.user_roles ?? null)].filter(Boolean).join(' '),
  status: (row: RecentUserRow) => (
    <AdminStatusPill tone={row.is_premium ? 'on' : 'neutral'}>
      {row.is_premium ? 'Premium' : 'Free'}
    </AdminStatusPill>
  ),
  facts: [
    { label: 'Email', value: (row: RecentUserRow) => row.email?.trim() || '—' },
    { label: 'Posts', value: (row: RecentUserRow) => Number(row.posts_count ?? 0) },
    { label: 'Roles', value: (row: RecentUserRow) => formatRoleList(row.user_roles ?? null) || '—' },
    {
      label: 'Joined',
      value: (row: RecentUserRow) => (row.created_at ? formatWhen(row.created_at) : '—'),
    },
  ],
};

export function buildAdminUserSearchColumns(
  { renderActions }: UserSearchOptions = {},
): GridColDef<RecentUserRow>[] {
  const cols: GridColDef<RecentUserRow>[] = [
    usernameColumn<RecentUserRow>('User', { minWidth: 130, flex: 1.1 }),
    emailColumn<RecentUserRow>(),
    {
      field: 'user_roles',
      headerName: 'Roles',
      flex: 1,
      minWidth: 120,
      valueGetter: (_value, row) => formatRoleList(row.user_roles ?? null),
    },
    {
      field: 'is_premium',
      headerName: 'Premium',
      width: 100,
      flex: 0,
      valueGetter: (_value, row) => (row.is_premium ? 'Premium' : 'Free'),
      renderCell: ({ row }) => (
        <AdminStatusPill tone={row.is_premium ? 'on' : 'neutral'}>
          {row.is_premium ? 'Premium' : 'Free'}
        </AdminStatusPill>
      ),
    },
    {
      field: 'posts_count',
      headerName: 'Posts',
      type: 'number',
      width: 80,
      flex: 0,
      valueGetter: (_value, row) => Number(row.posts_count ?? 0),
    },
    {
      field: 'friends_count',
      headerName: 'Friends',
      type: 'number',
      width: 88,
      flex: 0,
      valueGetter: (_value, row) => (
        row.friends_count == null ? null : Number(row.friends_count)
      ),
    },
    loggedAtColumn<RecentUserRow>('created_at', 'Joined'),
    loggedAtColumn<RecentUserRow>('last_activity_at', 'Last active'),
    {
      field: 'id',
      headerName: 'User ID',
      width: 168,
      flex: 0,
      sortable: false,
      valueGetter: (_value, row) => row.id,
      renderCell: ({ value }) => (
        <span className="admin-id-cell">
          {renderIdCode(value)}
          <AdminCopyButton value={String(value ?? '')} />
        </span>
      ),
    },
  ];

  if (renderActions) {
    cols.push({
      field: 'actions',
      headerName: 'Actions',
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      flex: 0,
      width: 96,
      renderCell: renderActions,
    });
  }

  return cols;
}
