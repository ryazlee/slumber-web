import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { type GridColDef, type GridRowParams } from '@mui/x-data-grid';
import type { RecentUserRow, UserSearchFilters } from '../../lib/admin';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { useAdminUserSearch, useUpdateUserRoles } from '../../hooks/useAdmin';
import { useAssignableRoles } from '../../hooks/useCatalog';
import {
  formatRoleList,
  getCachedRoleOptions,
} from '../../lib/userRoles';
import AdminCopyButton from './AdminCopyButton';
import AdminDataGrid from './AdminDataGrid';
import AdminFilterBar, { AdminFilterField } from './AdminFilterBar';
import AdminGridAction from './AdminGridAction';
import AdminListToolbar from './AdminListToolbar';
import AdminSection, { AdminTableSummary } from './AdminSection';
import AdminUserRoleEditor from './AdminUserRoleEditor';
import { ADMIN_CATALOG_FORM_ID, scrollAdminPanelIntoView } from './adminScroll';
import { dateColumn } from './dateColumn';

type QuickFilter = 'new' | 'premium' | null;

export default function AdminUsers() {
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [premiumOnly, setPremiumOnly] = useState(false);
  const [minPosts, setMinPosts] = useState('');
  const [joinedWithin, setJoinedWithin] = useState('');
  const [quickFilter, setQuickFilter] = useState<QuickFilter>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const debouncedQuery = useDebouncedValue(query);
  const debouncedMinPosts = useDebouncedValue(minPosts);

  const appliedFilters = useMemo<UserSearchFilters>(() => ({
    query: debouncedQuery.trim() || undefined,
    limit: 100,
    role: roleFilter || null,
    premiumOnly: quickFilter === 'premium' ? true : premiumOnly,
    minPosts: debouncedMinPosts === '' ? null : Number(debouncedMinPosts),
    joinedWithinDays: quickFilter === 'new'
      ? 7
      : joinedWithin === '' ? null : Number(joinedWithin),
  }), [debouncedQuery, roleFilter, premiumOnly, debouncedMinPosts, joinedWithin, quickFilter]);

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

  const hasFilters = Boolean(query || roleFilter || premiumOnly || minPosts || joinedWithin || quickFilter);

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  const resetFilters = () => {
    setQuery('');
    setRoleFilter('');
    setPremiumOnly(false);
    setMinPosts('');
    setJoinedWithin('');
    setQuickFilter(null);
  };

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setEditingUser(null);
    setDraftRoles([]);
    setFormError(null);
  }, []);

  useEscapeKey(Boolean(editingId), cancelEdit);

  const startEdit = useCallback((user: RecentUserRow) => {
    setEditingId(user.id);
    setEditingUser(user);
    setFormError(null);
    const knownKeys = new Set(roleOptions.map((opt) => opt.key));
    const known = (user.user_roles ?? []).filter((r) => knownKeys.has(r));
    setDraftRoles(known);
    scrollAdminPanelIntoView(ADMIN_CATALOG_FORM_ID);
  }, [roleOptions]);

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

  const toggleQuickFilter = (next: QuickFilter) => {
    setQuickFilter((current) => (current === next ? null : next));
  };

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
      minWidth: 220,
      renderCell: ({ value }) => (
        <span className="admin-id-cell">
          <code className="admin-code">{value}</code>
          <AdminCopyButton value={String(value)} />
        </span>
      ),
    },
    {
      field: 'actions',
      headerName: '',
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      width: 110,
      renderCell: ({ row }) => (
        <AdminGridAction
          active={editingId === row.id}
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
        </AdminGridAction>
      ),
    },
  ], [startEdit, editingId, cancelEdit]);

  const handleRowClick = (params: GridRowParams<RecentUserRow>) => {
    if (editingId === params.id) {
      cancelEdit();
    } else {
      startEdit(params.row);
    }
  };

  return (
    <AdminSection className="admin-users" error={error}>
      <AdminFilterBar
        showReset={hasFilters}
        onReset={resetFilters}
        actions={searching ? <span className="admin-muted admin-filter-note">Updating…</span> : null}
      >
        <AdminFilterField label="Search" htmlFor="user-search" className="admin-filter-field--wide">
          <input
            ref={searchRef}
            id="user-search"
            className="admin-input"
            type="search"
            placeholder="Username or email — updates as you type"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
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
            value={quickFilter === 'new' ? '7' : joinedWithin}
            onChange={(e) => {
              setQuickFilter(null);
              setJoinedWithin(e.target.value);
            }}
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
      </AdminFilterBar>

      <div className="admin-quick-chips" role="group" aria-label="Quick filters">
        <button
          type="button"
          className={`admin-tab${quickFilter === 'new' ? ' active' : ''}`}
          onClick={() => toggleQuickFilter('new')}
        >
          New this week
        </button>
        <button
          type="button"
          className={`admin-tab${quickFilter === 'premium' ? ' active' : ''}`}
          onClick={() => toggleQuickFilter('premium')}
        >
          Premium
        </button>
      </div>

      <AdminListToolbar>
        <AdminTableSummary>
          {users.length} user{users.length === 1 ? '' : 's'}
          {editingId ? ' · click a row or Roles to edit' : ' · click a row to edit roles'}
          {' · '}
          <Link to="/admin/premium">Grant Premium</Link>
        </AdminTableSummary>
      </AdminListToolbar>

      {editingUser && editingId ? (
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
      ) : null}

      <AdminDataGrid
        persistKey="admin-users"
        rows={users}
        columns={columns}
        getRowId={(row) => row.id}
        loading={searching}
        label="Users"
        onRowClick={handleRowClick}
        getRowClassName={(params) => (params.id === editingId ? 'admin-grid-row-editing' : '')}
        initialState={{
          sorting: { sortModel: [{ field: 'created_at', sort: 'desc' }] },
        }}
      />

    </AdminSection>
  );
}
