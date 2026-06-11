import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { type GridColDef } from '@mui/x-data-grid';
import type { RecentUserRow } from '../../lib/admin';
import { searchAdminUsers, updateUserRoles } from '../../lib/admin';
import {
  formatRoleLabel,
  formatRoleList,
  getCachedRoleOptions,
  loadRoleDefinitions,
  type RoleOption,
} from '../../lib/userRoles';
import AdminDataGrid from './AdminDataGrid';
import AdminFilterBar, { AdminFilterField } from './AdminFilterBar';
import { dateColumn } from './dateColumn';

type Props = {
  refreshToken: number;
  onReload: () => Promise<void>;
};

export default function AdminUsers({ refreshToken, onReload }: Props) {
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [premiumOnly, setPremiumOnly] = useState(false);
  const [minPosts, setMinPosts] = useState('');
  const [joinedWithin, setJoinedWithin] = useState('');

  const [users, setUsers] = useState<RecentUserRow[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<RecentUserRow | null>(null);
  const [draftRoles, setDraftRoles] = useState<string[]>([]);
  const [roleOptions, setRoleOptions] = useState<RoleOption[]>(getCachedRoleOptions());
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    loadRoleDefinitions().then(setRoleOptions).catch(() => {
      setRoleOptions(getCachedRoleOptions());
    });
  }, [refreshToken]);

  const runSearch = useCallback(async () => {
    setSearching(true);
    setError(null);
    try {
      const rows = await searchAdminUsers({
        query: query.trim() || undefined,
        limit: 100,
        role: roleFilter || null,
        premiumOnly,
        minPosts: minPosts === '' ? null : Number(minPosts),
        joinedWithinDays: joinedWithin === '' ? null : Number(joinedWithin),
      });
      setUsers(rows);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not load users.');
    } finally {
      setSearching(false);
    }
  }, [query, roleFilter, premiumOnly, minPosts, joinedWithin]);

  useEffect(() => {
    runSearch();
  }, [refreshToken, runSearch]);

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
    runSearch();
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

  const addRole = (key: string) => {
    if (draftRoles.includes(key)) return;
    setDraftRoles([...draftRoles, key]);
  };

  const removeRole = (key: string) => {
    setDraftRoles(draftRoles.filter((r) => r !== key));
  };

  const moveRole = (index: number, direction: -1 | 1) => {
    const next = index + direction;
    if (next < 0 || next >= draftRoles.length) return;
    const copy = [...draftRoles];
    [copy[index], copy[next]] = [copy[next], copy[index]];
    setDraftRoles(copy);
  };

  const saveRoles = async () => {
    if (!editingId) return;
    setSaving(true);
    setFormError(null);
    try {
      await updateUserRoles(editingId, draftRoles);
      cancelEdit();
      await runSearch();
      await onReload();
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : 'Could not save roles.');
    } finally {
      setSaving(false);
    }
  };

  const availableToAdd = roleOptions.filter((opt) => !draftRoles.includes(opt.key));

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
          className="admin-link-btn"
          onClick={(e) => {
            e.stopPropagation();
            startEdit(row);
          }}
        >
          Edit roles
        </button>
      ),
    },
  ], [startEdit]);

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
        First role in the list drives the avatar ring in the app. Admin access uses roles marked <code>is_admin</code> in <code>role_definitions</code>.
        Server filters above; sort and search loaded results in the table toolbar.
      </p>

      {error && <p className="admin-error admin-error-banner">{error}</p>}

      <AdminDataGrid
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

      {editingUser && editingId && (
        <div className="admin-user-editor-panel">
          <p className="admin-user-name">Editing @{editingUser.username}</p>
          <div className="admin-role-editor">
            <p className="admin-label">Role order (top = avatar ring)</p>
            {draftRoles.length === 0 ? (
              <p className="admin-muted">No roles assigned.</p>
            ) : (
              <ul className="admin-role-order-list">
                {draftRoles.map((role, index) => (
                  <li key={role} className="admin-role-order-item">
                    <span className="admin-role-order-label">
                      {index === 0 ? <span className="admin-role-primary">Ring</span> : null}
                      {formatRoleLabel(role)}
                    </span>
                    <span className="admin-role-order-actions">
                      <button type="button" className="admin-icon-btn" onClick={() => moveRole(index, -1)} disabled={index === 0} aria-label="Move up">↑</button>
                      <button type="button" className="admin-icon-btn" onClick={() => moveRole(index, 1)} disabled={index === draftRoles.length - 1} aria-label="Move down">↓</button>
                      <button type="button" className="admin-link-btn admin-link-danger" onClick={() => removeRole(role)}>Remove</button>
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {availableToAdd.length > 0 && (
              <div className="admin-role-add">
                <p className="admin-label">Add role</p>
                <div className="admin-role-chips">
                  {availableToAdd.map((opt) => (
                    <button key={opt.key} type="button" className="admin-role-chip" onClick={() => addRole(opt.key)}>
                      {opt.badge} {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {formError && <p className="admin-error">{formError}</p>}
            <div className="admin-tag-form-actions">
              <button className="admin-button" type="button" onClick={saveRoles} disabled={saving}>
                {saving ? 'Saving…' : 'Save roles'}
              </button>
              <button className="admin-button admin-button-ghost" type="button" onClick={cancelEdit} disabled={saving}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
