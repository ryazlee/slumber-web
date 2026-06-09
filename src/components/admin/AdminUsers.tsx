import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import type { RecentUserRow } from '../../lib/admin';
import { searchAdminUsers, updateUserRoles } from '../../lib/admin';
import {
  formatRoleLabel,
  formatRoleList,
  getCachedRoleOptions,
  loadRoleDefinitions,
  type RoleOption,
} from '../../lib/userRoles';
import { formatWhen } from './format';

type Props = {
  loading: boolean;
  error: string | null;
  refreshToken: number;
  onError: (message: string | null) => void;
  onReload: () => Promise<void>;
};

export default function AdminUsers({ loading, error, refreshToken, onError, onReload }: Props) {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<RecentUserRow[]>([]);
  const [searching, setSearching] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftRoles, setDraftRoles] = useState<string[]>([]);
  const [roleOptions, setRoleOptions] = useState<RoleOption[]>(getCachedRoleOptions());
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    loadRoleDefinitions().then(setRoleOptions).catch(() => {
      setRoleOptions(getCachedRoleOptions());
    });
  }, [refreshToken]);

  const runSearch = useCallback(async (q: string) => {
    setSearching(true);
    onError(null);
    try {
      setUsers(await searchAdminUsers(q, 50));
    } catch (e: unknown) {
      onError(e instanceof Error ? e.message : 'Could not load users.');
    } finally {
      setSearching(false);
    }
  }, [onError]);

  useEffect(() => {
    runSearch(query.trim());
  }, [refreshToken, runSearch]);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    runSearch(query.trim());
  };

  const startEdit = (user: RecentUserRow) => {
    setEditingId(user.id);
    setFormError(null);
    const knownKeys = new Set(roleOptions.map((opt) => opt.key));
    const known = (user.user_roles ?? []).filter((r) => knownKeys.has(r));
    setDraftRoles(known);
  };

  const cancelEdit = () => {
    setEditingId(null);
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
      await runSearch(query.trim());
      await onReload();
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : 'Could not save roles.');
    } finally {
      setSaving(false);
    }
  };

  const availableToAdd = roleOptions.filter((opt) => !draftRoles.includes(opt.key));

  return (
    <div className="admin-users">
      <form className="admin-users-search" onSubmit={handleSearch}>
        <input
          className="admin-input"
          type="search"
          placeholder="Search by username…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search users"
        />
        <button className="admin-button admin-button-ghost" type="submit" disabled={searching}>
          {searching ? 'Searching…' : 'Search'}
        </button>
      </form>

      <p className="admin-muted admin-users-hint">
        First role in the list drives the avatar ring in the app. Order matters; admin access uses roles marked <code>is_admin</code> in <code>role_definitions</code>.
      </p>

      {error && <p className="admin-error admin-error-banner">{error}</p>}
      {(loading || searching) && users.length === 0 && (
        <p className="admin-muted">Loading users…</p>
      )}

      {!searching && users.length === 0 ? (
        <p className="admin-muted admin-empty">No users found.</p>
      ) : (
        <div className="admin-user-list">
          {users.map((user) => {
            const isEditing = editingId === user.id;
            return (
              <article key={user.id} className="admin-user-card">
                <div className="admin-user-card-header">
                  <div>
                    <p className="admin-user-name">@{user.username}</p>
                    <p className="admin-muted">
                      Joined {formatWhen(user.created_at)} · {user.posts_count} posts
                      {user.is_premium ? ' · premium sub' : ''}
                    </p>
                    {!isEditing && (
                      <p className="admin-user-roles">{formatRoleList(user.user_roles ?? null)}</p>
                    )}
                  </div>
                  {!isEditing && (
                    <button
                      type="button"
                      className="admin-button admin-button-ghost"
                      onClick={() => startEdit(user)}
                    >
                      Edit roles
                    </button>
                  )}
                </div>

                {isEditing && (
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
                              <button
                                type="button"
                                className="admin-icon-btn"
                                onClick={() => moveRole(index, -1)}
                                disabled={index === 0}
                                aria-label="Move up"
                              >
                                ↑
                              </button>
                              <button
                                type="button"
                                className="admin-icon-btn"
                                onClick={() => moveRole(index, 1)}
                                disabled={index === draftRoles.length - 1}
                                aria-label="Move down"
                              >
                                ↓
                              </button>
                              <button
                                type="button"
                                className="admin-link-btn admin-link-danger"
                                onClick={() => removeRole(role)}
                              >
                                Remove
                              </button>
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
                            <button
                              key={opt.key}
                              type="button"
                              className="admin-role-chip"
                              onClick={() => addRole(opt.key)}
                            >
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
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
