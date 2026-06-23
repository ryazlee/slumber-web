import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { type GridRowParams } from '@mui/x-data-grid';
import type { RecentUserRow, UserSearchFilters } from '../../lib/admin';
import { getOptionalQueryErrorMessage } from '../../lib/queryError';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { usePaginatedFilters } from '../../hooks/usePaginatedFilters';
import { useAdminUserSearch } from '../../hooks/useAdmin';
import { useAssignableRoles } from '../../hooks/useCatalog';
import { getCachedRoleOptions } from '../../lib/userRoles';
import AdminDataGrid from './AdminDataGrid';
import AdminFilterBar, { AdminFilterField } from './AdminFilterBar';
import AdminGridClientFilterHint from './AdminGridClientFilterHint';
import AdminListToolbar from './AdminListToolbar';
import AdminSection, { AdminTableSummary } from './AdminSection';
import AdminUserDetailPanel from './AdminUserDetailPanel';
import { pluralCount } from './format';
import { ADMIN_CATALOG_FORM_ID, scrollAdminPanelIntoView } from './adminScroll';
import { buildAdminUserSearchColumns } from './userGridColumns';

type QuickFilter = 'new' | 'premium' | 'never-posted' | 'inactive' | null;

export default function AdminUsers() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlFilter = searchParams.get('filter') as QuickFilter;

  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [premiumOnly, setPremiumOnly] = useState(false);
  const [minPosts, setMinPosts] = useState('');
  const [joinedWithin, setJoinedWithin] = useState('');
  const [quickFilter, setQuickFilter] = useState<QuickFilter>(urlFilter);
  const searchRef = useRef<HTMLInputElement>(null);

  const debouncedQuery = useDebouncedValue(query);
  const debouncedMinPosts = useDebouncedValue(minPosts);

  const searchFilters = useMemo<Omit<UserSearchFilters, 'page' | 'pageSize'>>(() => ({
    query: debouncedQuery.trim() || undefined,
    role: roleFilter || null,
    premiumOnly: quickFilter === 'premium' ? true : premiumOnly,
    minPosts: quickFilter === 'never-posted'
      ? null
      : debouncedMinPosts === '' ? null : Number(debouncedMinPosts),
    maxPosts: quickFilter === 'never-posted' ? 0 : null,
    joinedWithinDays: quickFilter === 'new'
      ? 7
      : joinedWithin === '' ? null : Number(joinedWithin),
    inactiveDays: quickFilter === 'inactive' ? 14 : null,
  }), [debouncedQuery, roleFilter, premiumOnly, debouncedMinPosts, joinedWithin, quickFilter]);

  const { paginationModel, setPaginationModel, filters: appliedFilters } = usePaginatedFilters(
    searchFilters,
    [debouncedQuery, roleFilter, premiumOnly, debouncedMinPosts, joinedWithin, quickFilter],
  );

  const rolesQuery = useAssignableRoles();
  const roleOptions = rolesQuery.data ?? getCachedRoleOptions();
  const usersQuery = useAdminUserSearch(appliedFilters);

  const users = usersQuery.data?.rows ?? [];
  const usersTotal = usersQuery.data?.total ?? 0;
  const searching = usersQuery.isFetching;
  const error = getOptionalQueryErrorMessage(usersQuery.error, 'Could not load users.');

  const [selectedUser, setSelectedUser] = useState<RecentUserRow | null>(null);

  const hasFilters = Boolean(query || roleFilter || premiumOnly || minPosts || joinedWithin || quickFilter);

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  useEffect(() => {
    if (urlFilter && urlFilter !== quickFilter) {
      setQuickFilter(urlFilter);
    }
  }, [urlFilter, quickFilter]);

  const resetFilters = () => {
    setQuery('');
    setRoleFilter('');
    setPremiumOnly(false);
    setMinPosts('');
    setJoinedWithin('');
    setQuickFilter(null);
    setSearchParams({});
  };

  const closeDetail = () => {
    setSelectedUser(null);
  };

  useEscapeKey(Boolean(selectedUser), closeDetail);

  const openDetail = (user: RecentUserRow) => {
    setSelectedUser(user);
    scrollAdminPanelIntoView(ADMIN_CATALOG_FORM_ID);
  };

  const toggleQuickFilter = (next: QuickFilter) => {
    const value = quickFilter === next ? null : next;
    setQuickFilter(value);
    if (value) {
      setSearchParams({ filter: value });
    } else {
      setSearchParams({});
    }
  };

  const columns = useMemo(
    () => buildAdminUserSearchColumns({}),
    [],
  );

  const handleRowClick = (params: GridRowParams<RecentUserRow>) => {
    if (selectedUser?.id === params.id) {
      closeDetail();
    } else {
      openDetail(params.row);
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
              setSearchParams({});
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
            disabled={quickFilter === 'never-posted'}
          />
        </AdminFilterField>
      </AdminFilterBar>

      <div className="admin-quick-chips" role="group" aria-label="Quick filters">
        {([
          ['new', 'New this week'],
          ['premium', 'Premium'],
          ['never-posted', 'Never posted'],
          ['inactive', 'Inactive 14d'],
        ] as const).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`admin-tab${quickFilter === id ? ' active' : ''}`}
            onClick={() => toggleQuickFilter(id)}
          >
            {label}
          </button>
        ))}
      </div>

      <AdminListToolbar>
        <AdminTableSummary>
          {pluralCount(usersTotal, 'user')}
          {selectedUser ? ' · click a row to close detail' : ' · click a row for user detail'}
          {' · '}
          <AdminGridClientFilterHint />
          {' · '}
          <Link to="/admin/premium">Grant Premium</Link>
        </AdminTableSummary>
      </AdminListToolbar>

      {selectedUser ? (
        <AdminUserDetailPanel user={selectedUser} onClose={closeDetail} />
      ) : null}

      <AdminDataGrid
        persistKey="admin-users"
        rows={users}
        columns={columns}
        getRowId={(row) => row.id}
        loading={searching}
        label="Users"
        onRowClick={handleRowClick}
        getRowClassName={(params) => (params.id === selectedUser?.id ? 'admin-grid-row-editing' : '')}
        serverPagination={{
          rowCount: usersTotal,
          paginationModel,
          onPaginationModelChange: setPaginationModel,
        }}
        initialState={{
          sorting: { sortModel: [{ field: 'created_at', sort: 'desc' }] },
        }}
      />
    </AdminSection>
  );
}
