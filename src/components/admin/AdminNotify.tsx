import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type { SendNotificationResult } from '../../lib/admin';
import { getOptionalQueryErrorMessage } from '../../lib/queryError';
import { useAdminDebouncedSearch } from '../../hooks/useAdminDebouncedSearch';
import { useAdminUserPickerSearch } from '../../hooks/useAdminUserPickerSearch';
import { useSendAdminNotification } from '../../hooks/useAdmin';
import { AdminUserPickerList, AdminUserPickerSearchField } from './AdminUserPicker';
import AdminPanel from './AdminPanel';
import AdminSection from './AdminSection';
import { formatWhen } from './format';

const MESSAGE_MAX = 500;

export default function AdminNotify() {
  const {
    query,
    setQuery,
    trimmedDebounced: debouncedQuery,
    isActive: searchActive,
  } = useAdminDebouncedSearch();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<SendNotificationResult | null>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const usersQuery = useAdminUserPickerSearch(debouncedQuery, searchActive);
  const sendMutation = useSendAdminNotification();

  const users = usersQuery.data?.rows ?? [];
  const searching = usersQuery.isFetching;
  const searchError = getOptionalQueryErrorMessage(usersQuery.error, 'Could not load users.');

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
          <AdminUserPickerSearchField
            inputId="notify-search"
            label="Search"
            placeholder="Type to search…"
            query={query}
            searchRef={searchRef}
            onQueryChange={(value) => {
              setQuery(value);
              setSelectedUserId(null);
              setLastResult(null);
            }}
          />

          <AdminUserPickerList
            users={users}
            selectedUserId={selectedUserId}
            onSelectUser={(userId) => {
              setSelectedUserId(userId);
              setFormError(null);
              setLastResult(null);
            }}
            searching={searching}
            isActive={searchActive}
            trimmedQuery={debouncedQuery}
            metaMode="joined"
            formatJoined={formatWhen}
          />
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
