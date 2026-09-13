import type { GridColDef } from '@mui/x-data-grid';
import type { RecentUserRow } from '../../lib/admin';
import { formatRoleList } from '../../lib/userRoles';
import AdminCopyButton from './AdminCopyButton';
import {
  emailColumn,
  loggedAtColumn,
  renderIdCode,
  usernameColumn,
} from './gridColumnHelpers';

type UserSearchOptions = {
  renderActions?: GridColDef<RecentUserRow>['renderCell'];
};

export function buildAdminUserSearchColumns(
  { renderActions }: UserSearchOptions = {},
): GridColDef<RecentUserRow>[] {
  const cols: GridColDef<RecentUserRow>[] = [
    usernameColumn<RecentUserRow>('Username', { minWidth: 140 }),
    emailColumn<RecentUserRow>(),
    loggedAtColumn<RecentUserRow>('created_at', 'Joined'),
    loggedAtColumn<RecentUserRow>('last_activity_at', 'Last activity', { minWidth: 170 }),
    {
      field: 'posts_count',
      headerName: 'Posts',
      type: 'number',
      width: 90,
      valueGetter: (_value, row) => Number(row.posts_count ?? 0),
    },
    {
      field: 'friends_count',
      headerName: 'Friends',
      type: 'number',
      width: 100,
      valueGetter: (_value, row) => (
        row.friends_count == null ? null : Number(row.friends_count)
      ),
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
