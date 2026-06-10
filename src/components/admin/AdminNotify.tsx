import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import type { RecentUserRow, SendNotificationResult } from '../../lib/admin';
import { searchAdminUsers, sendAdminNotification } from '../../lib/admin';
import { formatWhen } from './format';

type Props = {
  refreshToken: number;
};

export default function AdminNotify({ refreshToken }: Props) {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<RecentUserRow[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<SendNotificationResult | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  const runSearch = useCallback(async (q: string) => {
    setSearching(true);
    setSearchError(null);
    try {
      setUsers(await searchAdminUsers(q, 50));
    } catch (e: unknown) {
      setSearchError(e instanceof Error ? e.message : 'Could not load users.');
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    runSearch(query.trim());
  }, [refreshToken, runSearch]);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    runSearch(query.trim());
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

    setSending(true);
    setFormError(null);
    setLastResult(null);
    try {
      const result = await sendAdminNotification(selectedUserId, trimmed);
      setLastResult(result);
      setMessage('');
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Could not send notification.');
    } finally {
      setSending(false);
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

        {searching && users.length === 0 ? (
          <p className="admin-muted">Loading users…</p>
        ) : users.length === 0 ? (
          <p className="admin-muted admin-empty">No users found.</p>
        ) : (
          <ul className="admin-notify-user-list">
            {users.map((user) => {
              const selected = selectedUserId === user.id;
              return (
                <li key={user.id}>
                  <button
                    type="button"
                    className={selected ? 'admin-notify-user active' : 'admin-notify-user'}
                    onClick={() => {
                      setSelectedUserId(user.id);
                      setFormError(null);
                      setLastResult(null);
                    }}
                  >
                    <span className="admin-user-name">@{user.username}</span>
                    <span className="admin-muted">
                      Joined {formatWhen(user.created_at)} · {user.posts_count} posts
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <form className="admin-form admin-notify-form" onSubmit={handleSend}>
          <label className="admin-label" htmlFor="notify-message">
            Message
            {selectedUser ? ` for @${selectedUser.username}` : ''}
          </label>
          <textarea
            id="notify-message"
            className="admin-input admin-textarea"
            rows={4}
            maxLength={500}
            placeholder="Test push from Slumber admin…"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={!selectedUserId || sending}
          />
          <p className="admin-muted">{message.trim().length}/500</p>

          {formError && <p className="admin-error">{formError}</p>}
          {lastResult && (
            <p className="admin-success">
              Sent. In-app notification created
              {lastResult.device_tokens > 0
                ? ` · push queued for ${lastResult.device_tokens} device${lastResult.device_tokens === 1 ? '' : 's'}`
                : ' · no device tokens registered (in-app only)'}
              .
            </p>
          )}

          <div className="admin-tag-form-actions">
            <button
              className="admin-button"
              type="submit"
              disabled={sending || !selectedUserId || !message.trim()}
            >
              {sending ? 'Sending…' : 'Send notification'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
