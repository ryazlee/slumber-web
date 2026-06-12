import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type { SendNotificationResult } from '../../lib/admin';
import { useAdminUserSearch, useSendAdminNotification } from '../../hooks/useAdmin';
import AdminFilterBar, { AdminFilterField } from './AdminFilterBar';
import AdminPanel from './AdminPanel';
import AdminSection from './AdminSection';
import { formatWhen } from './format';

const MESSAGE_MAX = 500;

export default function AdminNotify() {
  const [query, setQuery] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<SendNotificationResult | null>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);

  const usersQuery = useAdminUserSearch({ query: appliedQuery || undefined, limit: 50 });
  const sendMutation = useSendAdminNotification();

  const users = usersQuery.data ?? [];
  const searching = usersQuery.isFetching;
  const searchError = usersQuery.error instanceof Error
    ? usersQuery.error.message
    : usersQuery.error
      ? 'Could not load users.'
      : null;

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    setAppliedQuery(query.trim());
    setSelectedUserId(null);
    setLastResult(null);
  };

  const selectedUser = users.find((u) => u.id === selectedUserId) ?? null;
  const trimmedMessage = message.trim();
  const canSend = Boolean(selectedUserId && trimmedMessage && !sendMutation.isPending);

  useEffect(() => {
    if (selectedUserId) {
      messageRef.current?.focus();
    }
  }, [selectedUserId]);

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) {
      setFormError('Choose a recipient first.');
      return;
    }
    if (!trimmedMessage) {
      setFormError('Enter a message.');
      return;
    }

    setFormError(null);
    setLastResult(null);
    try {
      const result = await sendMutation.mutateAsync({ userId: selectedUserId, message: trimmedMessage });
      setLastResult(result);
      setMessage('');
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Could not send notification.');
    }
  };

  return (
    <AdminSection
      className="admin-notify"
      lead="Send an in-app notification and trigger push delivery when the user has a device token."
      error={searchError}
    >
      <div className="admin-split">
        <AdminPanel
          step={1}
          title="Find recipient"
          description="Search by username or email, then pick one user."
        >
          <form onSubmit={handleSearch}>
            <AdminFilterBar
              nested
              actions={(
                <button className="admin-button" type="submit" disabled={searching}>
                  {searching ? 'Searching…' : 'Search'}
                </button>
              )}
            >
              <AdminFilterField label="User" htmlFor="notify-search" className="admin-filter-field--wide">
                <input
                  id="notify-search"
                  className="admin-input"
                  type="search"
                  placeholder="Username or email…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  autoComplete="off"
                />
              </AdminFilterField>
            </AdminFilterBar>
          </form>

          {appliedQuery && !searching && users.length === 0 ? (
            <p className="admin-empty-inline">No users match “{appliedQuery}”.</p>
          ) : null}

          {!appliedQuery ? (
            <p className="admin-empty-inline">Run a search to see matching users.</p>
          ) : null}

          {users.length > 0 ? (
            <ul className="admin-picker-list" aria-label="Search results">
              {users.map((user) => {
                const selected = selectedUserId === user.id;
                return (
                  <li key={user.id}>
                    <button
                      type="button"
                      className={`admin-picker-item${selected ? ' admin-picker-item--selected' : ''}`}
                      aria-pressed={selected}
                      onClick={() => {
                        setSelectedUserId(user.id);
                        setFormError(null);
                        setLastResult(null);
                      }}
                    >
                      <span className="admin-picker-item-main">
                        <span className="admin-picker-item-title">@{user.username}</span>
                        {user.email ? <span className="admin-picker-item-sub">{user.email}</span> : null}
                      </span>
                      <span className="admin-picker-item-meta">Joined {formatWhen(user.created_at)}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </AdminPanel>

        <AdminPanel
          step={2}
          title="Compose message"
          description="Notification text shown in-app and used for the push body."
          highlighted={Boolean(selectedUser)}
          headerAction={selectedUser ? (
            <button
              type="button"
              className="admin-button admin-button-ghost"
              onClick={() => {
                setSelectedUserId(null);
                setFormError(null);
                setLastResult(null);
              }}
            >
              Clear
            </button>
          ) : null}
        >
          {selectedUser ? (
            <div className="admin-recipient-chip">
              <span className="admin-recipient-label">To</span>
              <span className="admin-recipient-name">@{selectedUser.username}</span>
              {selectedUser.email ? <span className="admin-recipient-email">{selectedUser.email}</span> : null}
            </div>
          ) : (
            <p className="admin-empty-inline">Select a user from search results.</p>
          )}

          <form className="admin-compose-form" onSubmit={handleSend}>
            <label className="admin-label" htmlFor="notify-message">Message</label>
            <textarea
              ref={messageRef}
              id="notify-message"
              className="admin-input admin-textarea"
              rows={5}
              maxLength={MESSAGE_MAX}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={selectedUser ? `Write a message for @${selectedUser.username}…` : 'Choose a recipient first…'}
              disabled={!selectedUserId || sendMutation.isPending}
            />
            <p className="admin-field-hint admin-compose-meta">
              {trimmedMessage.length}/{MESSAGE_MAX} characters
            </p>

            {formError ? <p className="admin-error">{formError}</p> : null}

            {lastResult ? (
              <p className="admin-success-banner">
                Sent notification <code className="admin-code">{lastResult.notification_id}</code>
                {lastResult.device_tokens > 0
                  ? ` · push queued for ${lastResult.device_tokens} device${lastResult.device_tokens === 1 ? '' : 's'}`
                  : ' · no push tokens on file'}
              </p>
            ) : null}

            <div className="admin-form-actions">
              <button className="admin-button" type="submit" disabled={!canSend}>
                {sendMutation.isPending ? 'Sending…' : 'Send notification'}
              </button>
            </div>
          </form>
        </AdminPanel>
      </div>
    </AdminSection>
  );
}
