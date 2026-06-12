import { useCallback, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { type GridColDef } from '@mui/x-data-grid';
import type { RecentUserRow, UserSearchFilters } from '../../lib/admin';
import { useAdminUserSearch, useUpdateUserRoles } from '../../hooks/useAdmin';
import { useAssignableRoles } from '../../hooks/useCatalog';
import {
  formatRoleList,
  getCachedRoleOptions,
} from '../../lib/userRoles';
import AdminDataGrid from './AdminDataGrid';
import AdminFilterBar, { AdminFilterField } from './AdminFilterBar';
import AdminUserRoleEditor from './AdminUserRoleEditor';
import { dateColumn } from './dateColumn';

const DEFAULT_FILTERS: UserSearchFilters = { limit: 100 };

export default function AdminUsers() {
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [premiumOnly, setPremiumOnly] = useState(false);
  const [minPosts, setMinPosts] = useState('');
  const [joinedWithin, setJoinedWithin] = useState('');
  const [appliedFilters, setAppliedFilters] = useState<UserSearchFilters>(DEFAULT_FILTERS);

  const rolesQuery = useAssignableRoles();
  const roleOptions = rolesQuery.data ?? getCachedRoleOptions();
  const usersQuery = useAdminUserSearch(appliedFilters);
  const updateRolesMutation = useUpdateUserRoles();

  const users = usersQuery.data ?? [];
  const searching = usersQuery.isFetching;
  const error = usersQuery.error instanceof Error
    ? usersQuery.error.message
    : usersQuery.error
      ? 'Could not load users.'
      : null;

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<RecentUserRow | null>(null);
  const [draftRoles, setDraftRoles] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  const hasFilters = Boolean(query || roleFilter || premiumOnly || minPosts || joinedWithin);

  const resetFilters = () => {
    setQuery('');
    setRoleFilter('');
    setPremiumOnly(false);
    setMinPosts('');
    setJoinedWithin('');
  };

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    setAppliedFilters({
      query: query.trim() || undefined,
      limit: 100,
      role: roleFilter || null,
      premiumOnly,
      minPosts: minPosts === '' ? null : Number(minPosts),
      joinedWithinDays: joinedWithin === '' ? null : Number(joinedWithin),
    });
  };

  const startEdit = useCallback((user: RecentUserRow) => {
    setEditingId(user.id);
    setEditingUser(user);
    setFormError(null);
    const knownKeys = new Set(roleOptions.map((opt) => opt.key));
    const known = (user.user_roles ?? []).filter((r) => knownKeys.has(r));
    setDraftRoles(known);
  }, [roleOptions]);

  const cancelEdit = () => {
    setEditingId(null);
    setEditingUser(null);
    setDraftRoles([]);
    setFormError(null);
  };

  const saveRoles = async () => {
    if (!editingId) return;
    setFormError(null);
    try {
      await updateRolesMutation.mutateAsync({ userId: editingId, roles: draftRoles });
      cancelEdit();
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : 'Could not save roles.');
    }
  };

  const saving = updateRolesMutation.isPending;

  const columns = useMemo<GridColDef<RecentUserRow>[]>(() => [
    {
      field: 'username',
      headerName: 'Username',
      flex: 1,
      minWidth: 140,
      valueFormatter: (value) => `@${value}`,
    },
    {
      field: 'email',
      headerName: 'Email',
      flex: 1.5,
      minWidth: 200,
      valueFormatter: (value) => (value ? String(value) : '—'),
    },
    dateColumn('created_at', 'Joined'),
    {
      field: 'posts_count',
      headerName: 'Posts',
      type: 'number',
      width: 90,
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
    },
    {
      field: 'id',
      headerName: 'User ID',
      flex: 1.2,
      minWidth: 200,
      renderCell: ({ value }) => <code className="admin-code">{value}</code>,
    },
    {
      field: 'actions',
      headerName: '',
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      width: 110,
      renderCell: ({ row }) => (
        <button
          type="button"
          className={editingId === row.id ? 'admin-link-btn admin-link-btn--active' : 'admin-link-btn'}
          onClick={(e) => {
            e.stopPropagation();
            if (editingId === row.id) {
              cancelEdit();
            } else {
              startEdit(row);
            }
          }}
        >
          {editingId === row.id ? 'Editing' : 'Roles'}
        </button>
      ),
    },
  ], [startEdit, editingId]);

  return (
    <div className="admin-users">
      <form onSubmit={handleSearch}>
        <AdminFilterBar showReset={hasFilters} onReset={resetFilters}>
          <AdminFilterField label="Search" htmlFor="user-search" className="admin-filter-field--wide">
            <input
              id="user-search"
              className="admin-input"
              type="search"
              placeholder="Username or email…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </AdminFilterField>
          <AdminFilterField label="Role" htmlFor="user-role">
            <select
              id="user-role"
              className="admin-input admin-input-select"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="">Any role</option>
              {roleOptions.map((opt) => (
                <option key={opt.key} value={opt.key}>{opt.label}</option>
              ))}
            </select>
          </AdminFilterField>
          <AdminFilterField label="Joined" htmlFor="user-joined">
            <select
              id="user-joined"
              className="admin-input admin-input-select"
              value={joinedWithin}
              onChange={(e) => setJoinedWithin(e.target.value)}
            >
              <option value="">Any time</option>
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
          </AdminFilterField>
          <AdminFilterField label="Min posts" htmlFor="user-min-posts">
            <input
              id="user-min-posts"
              className="admin-input"
              type="number"
              min={0}
              placeholder="0"
              value={minPosts}
              onChange={(e) => setMinPosts(e.target.value)}
            />
          </AdminFilterField>
          <AdminFilterField label="Premium" htmlFor="user-premium">
            <label className="admin-checkbox-label">
              <input
                id="user-premium"
                type="checkbox"
                checked={premiumOnly}
                onChange={(e) => setPremiumOnly(e.target.checked)}
              />
              Premium only
            </label>
          </AdminFilterField>
        </AdminFilterBar>
        <div className="admin-filter-actions">
          <button className="admin-button" type="submit" disabled={searching}>
            {searching ? 'Searching…' : 'Apply filters'}
          </button>
        </div>
      </form>

      <p className="admin-muted admin-users-hint">
        Click <strong>Roles</strong> on a user to assign badges and set their avatar ring.
        Admin dashboard access requires a role with <code>is_admin</code> in Configure → Roles.
      </p>

      {error && <p className="admin-error admin-error-banner">{error}</p>}

      {editingUser && editingId && (
        <AdminUserRoleEditor
          user={editingUser}
          roleOptions={roleOptions}
          draftRoles={draftRoles}
          saving={saving}
          error={formError}
          onChange={setDraftRoles}
          onSave={saveRoles}
          onCancel={cancelEdit}
        />
      )}

      <AdminDataGrid
        persistKey="admin-users"
        rows={users}
        columns={columns}
        getRowId={(row) => row.id}
        loading={searching}
        label="Users"
        getRowClassName={(params) => (params.id === editingId ? 'admin-grid-row-editing' : '')}
        initialState={{
          sorting: { sortModel: [{ field: 'created_at', sort: 'desc' }] },
        }}
      />
    </div>
  );
}
