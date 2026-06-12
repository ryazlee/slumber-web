import { useState } from 'react';
import type { FormEvent } from 'react';
import type { SendNotificationResult } from '../../lib/admin';
import { useAdminUserSearch, useSendAdminNotification } from '../../hooks/useAdmin';
import { formatWhen } from './format';

export default function AdminNotify() {
  const [query, setQuery] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<SendNotificationResult | null>(null);

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
  };

  const selectedUser = users.find((u) => u.id === selectedUserId) ?? null;

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) {
      setFormError('Pick a user first.');
      return;
    }
    const trimmed = message.trim();
    if (!trimmed) {
      setFormError('Enter a message.');
      return;
    }

    setFormError(null);
    setLastResult(null);
    try {
      const result = await sendMutation.mutateAsync({ userId: selectedUserId, message: trimmed });
      setLastResult(result);
      setMessage('');
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Could not send notification.');
    }
  };

  return (
    <div className="admin-notify">
      <div className="admin-card">
        <h2 className="admin-section-title">Send notification</h2>
        <p className="admin-muted admin-notify-hint">
          Creates an in-app notification and triggers push delivery (if the user has a device token and the webhook is configured).
        </p>

        {searchError && <p className="admin-error admin-error-banner">{searchError}</p>}

        <form className="admin-notify-search" onSubmit={handleSearch}>
          <label className="admin-label" htmlFor="notify-search">Find user</label>
          <div className="admin-notify-search-row">
            <input
              id="notify-search"
              className="admin-input"
              type="search"
              placeholder="Username or email…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button className="admin-button" type="submit" disabled={searching}>
              {searching ? 'Searching…' : 'Search'}
            </button>
          </div>
        </form>

        {users.length > 0 && (
          <ul className="admin-notify-user-list">
            {users.map((user) => (
              <li key={user.id}>
                <button
                  type="button"
                  className={`admin-notify-user${selectedUserId === user.id ? ' admin-notify-user--selected' : ''}`}
                  onClick={() => setSelectedUserId(user.id)}
                >
                  <span className="admin-notify-user-name">@{user.username}</span>
                  {user.email ? <span className="admin-notify-user-email">{user.email}</span> : null}
                  <span className="admin-notify-user-meta">
                    Joined {formatWhen(user.created_at)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {appliedQuery && !searching && users.length === 0 && (
          <p className="admin-muted">No users match that search.</p>
        )}

        <form className="admin-notify-compose" onSubmit={handleSend}>
          <label className="admin-label" htmlFor="notify-message">Message</label>
          <textarea
            id="notify-message"
            className="admin-input admin-notify-message"
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={selectedUser ? `Message for @${selectedUser.username}…` : 'Select a user first…'}
            disabled={!selectedUserId || sendMutation.isPending}
          />
          {formError && <p className="admin-error">{formError}</p>}
          {lastResult && (
            <p className="admin-muted admin-notify-result">
              Sent notification {lastResult.notification_id}
              {lastResult.device_tokens > 0
                ? ` · ${lastResult.device_tokens} device token(s)`
                : ' · no push tokens'}
            </p>
          )}
          <button
            className="admin-button"
            type="submit"
            disabled={!selectedUserId || !message.trim() || sendMutation.isPending}
          >
            {sendMutation.isPending ? 'Sending…' : 'Send notification'}
          </button>
        </form>
      </div>
    </div>
  );
}
