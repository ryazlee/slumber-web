import type { GridColDef } from '@mui/x-data-grid';
import type { RecentUserRow } from '../../lib/admin';
import { formatRoleList } from '../../lib/userRoles';
import AdminCopyButton from './AdminCopyButton';
import {
  emailColumn,
  idCodeColumn,
  loggedAtColumn,
  renderIdCode,
  usernameColumn,
} from './gridColumnHelpers';

type SignupOptions = {
  showVersion?: boolean;
};

type UserSearchOptions = {
  renderActions?: GridColDef<RecentUserRow>['renderCell'];
};

function rolesLabel(row: RecentUserRow): string {
  const parts: string[] = [];
  if (row.is_premium && !row.user_roles?.includes('premium')) parts.push('premium');
  if (row.user_roles?.length) parts.push(...row.user_roles);
  return parts.length ? parts.join(', ') : '—';
}

export function buildRecentSignupColumns(
  { showVersion = false }: SignupOptions = {},
): GridColDef<RecentUserRow>[] {
  const cols: GridColDef<RecentUserRow>[] = [
    idCodeColumn<RecentUserRow>('id', 'User ID'),
    usernameColumn<RecentUserRow>('Username'),
    emailColumn<RecentUserRow>(),
    loggedAtColumn<RecentUserRow>('created_at', 'Joined'),
    {
      field: 'posts_count',
      headerName: 'Posts',
      type: 'number',
      width: 100,
      valueGetter: (_value, row) => Number(row.posts_count ?? 0),
    },
    {
      field: 'user_roles',
      headerName: 'Roles',
      flex: 1.5,
      minWidth: 160,
      valueGetter: (_value, row) => rolesLabel(row),
    },
    {
      field: 'is_premium',
      headerName: 'Premium',
      type: 'boolean',
      width: 100,
      valueGetter: (_value, row) => row.is_premium,
    },
  ];

  if (showVersion) {
    cols.push({
      field: 'last_app_version',
      headerName: 'App version',
      width: 120,
      valueGetter: (_value, row) => row.last_app_version ?? '',
      valueFormatter: (value) => (value ? `v${value}` : '—'),
    });
  }

  return cols;
}

export function buildAdminUserSearchColumns(
  { renderActions }: UserSearchOptions = {},
): GridColDef<RecentUserRow>[] {
  const cols: GridColDef<RecentUserRow>[] = [
    usernameColumn<RecentUserRow>('Username', { minWidth: 140 }),
    emailColumn<RecentUserRow>(),
    loggedAtColumn<RecentUserRow>('created_at', 'Joined'),
    {
      field: 'posts_count',
      headerName: 'Posts',
      type: 'number',
      width: 90,
      valueGetter: (_value, row) => Number(row.posts_count ?? 0),
    },
    {
      field: 'user_roles',
      headerName: 'Roles',
      flex: 1.5,
      minWidth: 160,
      valueGetter: (_value, row) => formatRoleList(row.user_roles ?? null),
    },
    {
      field: 'is_premium',
      headerName: 'Premium',
      type: 'boolean',
      width: 100,
      valueGetter: (_value, row) => row.is_premium,
    },
    {
      field: 'id',
      headerName: 'User ID',
      flex: 1.2,
      minWidth: 220,
      valueGetter: (_value, row) => row.id,
      renderCell: ({ value }) => (
        <span className="admin-id-cell">
          {renderIdCode(value)}
          <AdminCopyButton value={String(value)} />
        </span>
      ),
    },
  ];

  if (renderActions) {
    cols.push({
      field: 'actions',
      headerName: '',
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      width: 110,
      renderCell: renderActions,
    });
  }

  return cols;
}
