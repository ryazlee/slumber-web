import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useAdminDebouncedSearch } from '../../hooks/useAdminDebouncedSearch';
import { useAdminUserSearch, useGrantRoleToUsers } from '../../hooks/useAdmin';
import {
  mergeRoleGrantIdentifiers,
  parseRoleGrantIdentifiers,
  ROLE_GRANT_BATCH_LIMIT,
  roleGrantErrorMessage,
  type AdminRoleDefinitionRow,
  type RoleGrantResult,
  type RoleGrantUser,
} from '../../lib/admin';
import { pluralCount } from '../../lib/format';
import AdminFormDialog from './AdminFormDialog';

type Props = {
  role: AdminRoleDefinitionRow;
  onClose: () => void;
};

function GrantNameList({ users }: { users: RoleGrantUser[] }) {
  return (
    <ul className="admin-role-grant-names">
      {users.map((user) => (
        <li key={user.id}>
          @{user.username}
          {user.email ? <span className="admin-muted"> · {user.email}</span> : null}
        </li>
      ))}
    </ul>
  );
}

export default function AdminRoleBatchAdd({ role, onClose }: Props) {
  const search = useAdminDebouncedSearch();
  const usersQuery = useAdminUserSearch(
    { query: search.trimmedDebounced, page: 0, pageSize: 8 },
    search.isActive,
  );
  const grant = useGrantRoleToUsers();
  const [paste, setPaste] = useState('');
  const [picked, setPicked] = useState<string[]>([]);
  const [result, setResult] = useState<RoleGrantResult | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const identifiers = useMemo(
    () => mergeRoleGrantIdentifiers(picked, parseRoleGrantIdentifiers(paste)),
    [picked, paste],
  );
  const overLimit = identifiers.length > ROLE_GRANT_BATCH_LIMIT;
  const matches = usersQuery.data?.rows ?? [];

  const addPick = (username: string) => {
    const token = username.trim().replace(/^@/, '').toLowerCase();
    if (!token) return;
    setPicked((prev) => (prev.includes(token) ? prev : [...prev, token]));
    setResult(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setResult(null);
    if (identifiers.length === 0) {
      setFormError('Add at least one username or email.');
      return;
    }
    if (overLimit) {
      setFormError(`Add at most ${ROLE_GRANT_BATCH_LIMIT} people at a time.`);
      return;
    }
    try {
      const next = await grant.mutateAsync({ roleKey: role.key, identifiers });
      setResult(next);
      setPaste('');
      setPicked([]);
      search.setQuery('');
    } catch (err: unknown) {
      setFormError(roleGrantErrorMessage(err));
    }
  };

  return (
    <AdminFormDialog open onClose={onClose} title={`Add users to ${role.label}`} wide>
      <p className="admin-panel-desc">
        Paste usernames or emails, or search and add people.
        {' '}
        {role.badge} {role.label} is added onto each profile. Existing roles stay in place, including the avatar ring.
      </p>
      <form className="admin-role-grant-form" onSubmit={(e) => { void handleSubmit(e); }}>
        <div className="admin-field">
          <label className="admin-label" htmlFor="role-grant-search">Search</label>
          <input
            id="role-grant-search"
            className="admin-input"
            value={search.query}
            onChange={(e) => search.setQuery(e.target.value)}
            placeholder="Username or email"
            autoComplete="off"
          />
        </div>

        {search.isActive ? (
          <div className="admin-role-grant-results" aria-live="polite">
            {usersQuery.isFetching && matches.length === 0 ? (
              <p className="admin-muted">Searching…</p>
            ) : null}
            {usersQuery.isError ? (
              <p className="admin-error">Could not search users.</p>
            ) : null}
            {!usersQuery.isFetching && !usersQuery.isError && matches.length === 0 ? (
              <p className="admin-muted">No matching users.</p>
            ) : null}
            {matches.length > 0 ? (
              <ul>
                {matches.map((user) => {
                  const token = user.username.trim().toLowerCase();
                  const selected = picked.includes(token);
                  const hasRole = (user.user_roles ?? []).includes(role.key);
                  return (
                    <li key={user.id}>
                      <div>
                        <strong>@{user.username}</strong>
                        {user.email ? <span className="admin-muted"> · {user.email}</span> : null}
                        {hasRole ? <span className="admin-muted"> · Already has this role</span> : null}
                      </div>
                      <button
                        className="admin-action-btn"
                        type="button"
                        disabled={selected}
                        onClick={() => addPick(user.username)}
                      >
                        {selected ? 'Added' : 'Add'}
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </div>
        ) : null}

        {picked.length > 0 ? (
          <div className="admin-field">
            <span className="admin-label">From search</span>
            <div className="admin-role-grant-picks">
              {picked.map((username) => (
                <button
                  key={username}
                  type="button"
                  className="admin-role-grant-chip"
                  aria-label={`Remove @${username}`}
                  onClick={() => setPicked((prev) => prev.filter((item) => item !== username))}
                >
                  @{username}
                  <span aria-hidden="true">×</span>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="admin-field">
          <label className="admin-label" htmlFor="role-grant-paste">Usernames or emails</label>
          <textarea
            id="role-grant-paste"
            className="admin-input admin-textarea"
            rows={6}
            value={paste}
            onChange={(e) => {
              setPaste(e.target.value);
              setResult(null);
            }}
            placeholder={'One per line, or separated by commas\n@maya\njordan@email.com'}
          />
        </div>

        <p className={overLimit ? 'admin-error' : 'admin-muted'}>
          {identifiers.length === 0
            ? `Up to ${ROLE_GRANT_BATCH_LIMIT} people.`
            : `${pluralCount(identifiers.length, 'person', 'people')} ready to add.`}
          {overLimit ? ` Limit is ${ROLE_GRANT_BATCH_LIMIT}.` : ''}
        </p>

        {formError ? <p className="admin-error">{formError}</p> : null}

        {result ? (
          <div className="admin-role-grant-result">
            <p>
              Added {pluralCount(result.added.length, 'person', 'people')}.
              {result.already.length > 0
                ? ` ${pluralCount(result.already.length, 'person', 'people')} already had this role.`
                : ''}
              {result.missing.length > 0
                ? ` ${pluralCount(result.missing.length, 'lookup', 'lookups')} did not match a user.`
                : ''}
            </p>
            {result.added.length > 0 ? (
              <>
                <p className="admin-field-group-title">Added</p>
                <GrantNameList users={result.added} />
              </>
            ) : null}
            {result.already.length > 0 ? (
              <>
                <p className="admin-field-group-title">Already had this role</p>
                <GrantNameList users={result.already} />
              </>
            ) : null}
            {result.missing.length > 0 ? (
              <>
                <p className="admin-field-group-title">Not found</p>
                <ul className="admin-role-grant-names">
                  {result.missing.map((token) => (
                    <li key={token}><code className="admin-code">{token}</code></li>
                  ))}
                </ul>
              </>
            ) : null}
          </div>
        ) : null}

        <div className="admin-form-actions">
          <button
            className="admin-button"
            type="submit"
            disabled={grant.isPending || identifiers.length === 0 || overLimit}
          >
            {grant.isPending
              ? 'Adding…'
              : identifiers.length === 0
                ? 'Add people'
                : `Add ${pluralCount(identifiers.length, 'person', 'people')}`}
          </button>
          <button className="admin-button admin-button-ghost" type="button" onClick={onClose} disabled={grant.isPending}>
            Close
          </button>
        </div>
      </form>
    </AdminFormDialog>
  );
}
