import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type { SendNotificationResult } from '../../lib/admin';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useAdminUserSearch, useSendAdminNotification } from '../../hooks/useAdmin';
import AdminFilterBar, { AdminFilterField } from './AdminFilterBar';
import AdminPanel from './AdminPanel';
import AdminSection from './AdminSection';
import { formatWhen } from './format';

const MESSAGE_MAX = 500;

export default function AdminNotify() {
  const [query, setQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<SendNotificationResult | null>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const debouncedQuery = useDebouncedValue(query);
  const searchActive = debouncedQuery.trim().length >= 2;

  const usersQuery = useAdminUserSearch(
    searchActive
      ? { query: debouncedQuery.trim(), limit: 50 }
      : { limit: 25, joinedWithinDays: 30 },
  );
  const sendMutation = useSendAdminNotification();

  const users = usersQuery.data?.rows ?? [];
  const searching = usersQuery.isFetching;
  const searchError = usersQuery.error instanceof Error
    ? usersQuery.error.message
    : usersQuery.error
      ? 'Could not load users.'
      : null;

  const selectedUser = users.find((u) => u.id === selectedUserId) ?? null;
  const trimmedMessage = message.trim();
  const canSend = Boolean(selectedUserId && trimmedMessage && !sendMutation.isPending);

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  useEffect(() => {
    if (selectedUserId) {
      messageRef.current?.focus();
    }
  }, [selectedUserId]);

  const sendNotification = async () => {
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

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    await sendNotification();
  };

  const onMessageKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && canSend) {
      e.preventDefault();
      void sendNotification();
    }
  };

  return (
    <AdminSection className="admin-notify" error={searchError}>
      <div className="admin-split">
        <AdminPanel
          step={1}
          title="Pick recipient"
          description={searchActive
            ? 'Matching users update as you type.'
            : 'Recent signups below — or search by username/email.'}
        >
          <AdminFilterBar nested>
            <AdminFilterField label="Search" htmlFor="notify-search" className="admin-filter-field--wide">
              <input
                ref={searchRef}
                id="notify-search"
                className="admin-input"
                type="search"
                placeholder="Type to search…"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedUserId(null);
                  setLastResult(null);
                }}
                autoComplete="off"
              />
            </AdminFilterField>
          </AdminFilterBar>

          {searching && users.length === 0 ? (
            <p className="admin-empty-inline">Looking up users…</p>
          ) : null}

          {!searching && searchActive && users.length === 0 ? (
            <p className="admin-empty-inline">No users match “{debouncedQuery.trim()}”.</p>
          ) : null}

          {!searching && users.length > 0 ? (
            <>
              <p className="admin-field-hint">
                {searchActive ? `${users.length} match${users.length === 1 ? '' : 'es'}` : 'Recent signups (last 30 days)'}
              </p>
              <ul className="admin-picker-list" aria-label="Users">
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
            </>
          ) : null}
        </AdminPanel>

        <AdminPanel
          step={2}
          title="Write message"
          description="⌘/Ctrl + Enter to send. Push fires if they have a device token."
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
            <p className="admin-empty-inline">Pick someone from the list.</p>
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
              onKeyDown={onMessageKeyDown}
              placeholder={selectedUser ? `Message for @${selectedUser.username}…` : 'Pick a recipient first…'}
              disabled={!selectedUserId || sendMutation.isPending}
            />
            <p className="admin-field-hint admin-compose-meta">
              {trimmedMessage.length}/{MESSAGE_MAX} · ⌘/Ctrl + Enter to send
            </p>

            {formError ? <p className="admin-error">{formError}</p> : null}

            {lastResult ? (
              <p className="admin-success-banner">
                Sent · {lastResult.device_tokens > 0
                  ? `push queued (${lastResult.device_tokens} device${lastResult.device_tokens === 1 ? '' : 's'})`
                  : 'no push tokens'}
              </p>
            ) : null}

            <div className="admin-form-actions admin-form-actions--sticky">
              <button className="admin-button" type="submit" disabled={!canSend}>
                {sendMutation.isPending ? 'Sending…' : 'Send'}
              </button>
            </div>
          </form>
        </AdminPanel>
      </div>
    </AdminSection>
  );
}
