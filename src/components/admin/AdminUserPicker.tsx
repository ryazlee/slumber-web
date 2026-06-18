import type { RefObject } from 'react';
import type { RecentUserRow } from '../../lib/admin';
import AdminFilterBar, { AdminFilterField } from './AdminFilterBar';

export type AdminUserPickerMetaMode = 'joined' | 'premium';

type SearchFieldProps = {
  inputId: string;
  label: string;
  placeholder: string;
  query: string;
  onQueryChange: (value: string) => void;
  searchRef?: RefObject<HTMLInputElement | null>;
};

export function AdminUserPickerSearchField({
  inputId,
  label,
  placeholder,
  query,
  onQueryChange,
  searchRef,
}: SearchFieldProps) {
  return (
    <AdminFilterBar nested>
      <AdminFilterField label={label} htmlFor={inputId} className="admin-filter-field--wide">
        <input
          ref={searchRef}
          id={inputId}
          className="admin-input"
          type="search"
          placeholder={placeholder}
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          autoComplete="off"
        />
      </AdminFilterField>
    </AdminFilterBar>
  );
}

type ListProps = {
  users: RecentUserRow[];
  selectedUserId: string | null;
  onSelectUser: (userId: string) => void;
  searching: boolean;
  isActive: boolean;
  trimmedQuery: string;
  metaMode: AdminUserPickerMetaMode;
  formatJoined: (iso: string) => string;
};

export function AdminUserPickerList({
  users,
  selectedUserId,
  onSelectUser,
  searching,
  isActive,
  trimmedQuery,
  metaMode,
  formatJoined,
}: ListProps) {
  if (searching && users.length === 0) {
    return <p className="admin-empty-inline">Looking up users…</p>;
  }

  if (!searching && isActive && users.length === 0) {
    return <p className="admin-empty-inline">No users match “{trimmedQuery}”.</p>;
  }

  if (users.length === 0) {
    return null;
  }

  return (
    <>
      {metaMode === 'joined' ? (
        <p className="admin-field-hint">
          {isActive
            ? `${users.length} match${users.length === 1 ? '' : 'es'}`
            : 'Recent signups (last 30 days)'}
        </p>
      ) : null}
      <ul className="admin-picker-list" aria-label="Users">
        {users.map((user) => {
          const selected = selectedUserId === user.id;
          return (
            <li key={user.id}>
              <button
                type="button"
                className={`admin-picker-item${selected ? ' admin-picker-item--selected' : ''}`}
                aria-pressed={selected}
                onClick={() => onSelectUser(user.id)}
              >
                <span className="admin-picker-item-main">
                  <span className="admin-picker-item-title">@{user.username}</span>
                  {user.email ? <span className="admin-picker-item-sub">{user.email}</span> : null}
                </span>
                <span className="admin-picker-item-meta">
                  {metaMode === 'joined'
                    ? `Joined ${formatJoined(user.created_at)}`
                    : user.is_premium
                      ? 'Premium'
                      : 'Free'}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
}
