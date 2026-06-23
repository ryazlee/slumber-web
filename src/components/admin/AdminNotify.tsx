import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { SendNotificationResult } from '../../lib/admin';
import { getOptionalQueryErrorMessage } from '../../lib/queryError';
import { useAdminDebouncedSearch } from '../../hooks/useAdminDebouncedSearch';
import { useAdminUserPickerSearch } from '../../hooks/useAdminUserPickerSearch';
import {
  useAdminUserDetail,
  useBroadcastAdminNotification,
  useSendAdminNotification,
} from '../../hooks/useAdmin';
import { useAssignableRoles } from '../../hooks/useCatalog';
import { getCachedRoleOptions } from '../../lib/userRoles';
import { AdminUserPickerList, AdminUserPickerSearchField } from './AdminUserPicker';
import AdminFieldGroup from './AdminFieldGroup';
import AdminFilterBar, { AdminFilterField } from './AdminFilterBar';
import AdminPanel from './AdminPanel';
import AdminSection from './AdminSection';
import { formatWhen } from './format';

const MESSAGE_MAX = 500;
const BROADCAST_MAX = 2000;

export default function AdminNotify() {
  const [searchParams] = useSearchParams();
  const preselectedUserId = searchParams.get('user');

  const {
    query,
    setQuery,
    trimmedDebounced: debouncedQuery,
    isActive: searchActive,
  } = useAdminDebouncedSearch();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(preselectedUserId);
  const [message, setMessage] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<SendNotificationResult | null>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastRole, setBroadcastRole] = useState('');
  const [broadcastJoinedDays, setBroadcastJoinedDays] = useState('');
  const [broadcastLimit, setBroadcastLimit] = useState('500');
  const [broadcastError, setBroadcastError] = useState<string | null>(null);
  const [broadcastResult, setBroadcastResult] = useState<{ sent: number; device_tokens: number } | null>(null);

  const usersQuery = useAdminUserPickerSearch(debouncedQuery, searchActive);
  const preselectedQuery = useAdminUserDetail(preselectedUserId);
  const sendMutation = useSendAdminNotification();
  const broadcastMutation = useBroadcastAdminNotification();
  const rolesQuery = useAssignableRoles();
  const roleOptions = rolesQuery.data ?? getCachedRoleOptions();

  const users = usersQuery.data?.rows ?? [];
  const searching = usersQuery.isFetching;
  const searchError = getOptionalQueryErrorMessage(usersQuery.error, 'Could not load users.');

  const selectedUser = users.find((u) => u.id === selectedUserId)
    ?? (preselectedQuery.data && selectedUserId === preselectedQuery.data.id
      ? {
        id: preselectedQuery.data.id,
        username: preselectedQuery.data.username,
        email: preselectedQuery.data.email,
        created_at: preselectedQuery.data.created_at,
        user_roles: preselectedQuery.data.user_roles,
        is_premium: preselectedQuery.data.is_premium,
        posts_count: preselectedQuery.data.posts_count,
      }
      : null);
  const trimmedMessage = message.trim();
  const canSend = Boolean(selectedUserId && trimmedMessage && !sendMutation.isPending);

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  useEffect(() => {
    if (preselectedUserId) {
      setSelectedUserId(preselectedUserId);
    }
  }, [preselectedUserId]);

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

  const sendBroadcast = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = broadcastMessage.trim();
    if (!trimmed) {
      setBroadcastError('Enter a message.');
      return;
    }
    const limit = Number(broadcastLimit) || 500;
    const joinedDays = broadcastJoinedDays === '' ? null : Number(broadcastJoinedDays);
    const audience = [
      broadcastRole ? `role:${broadcastRole}` : null,
      joinedDays ? `joined ≤${joinedDays}d` : null,
      `max ${limit}`,
    ].filter(Boolean).join(' · ');
    if (!window.confirm(`Send announcement to up to ${limit} users (${audience || 'all users'})?`)) return;

    setBroadcastError(null);
    setBroadcastResult(null);
    try {
      const result = await broadcastMutation.mutateAsync({
        message: trimmed,
        role: broadcastRole || null,
        joinedWithinDays: joinedDays,
        limit,
      });
      setBroadcastResult(result);
      setBroadcastMessage('');
    } catch (err: unknown) {
      setBroadcastError(err instanceof Error ? err.message : 'Could not broadcast.');
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

      <AdminPanel
        title="Broadcast announcement"
        description="Sends an in-app announcement (and push when tokens exist) to a filtered audience. Rate-limited server-side."
        className="admin-notify-broadcast"
      >
        <form className="admin-compose-form" onSubmit={sendBroadcast}>
          <AdminFilterBar nested>
            <AdminFilterField label="Role filter" htmlFor="broadcast-role">
              <select
                id="broadcast-role"
                className="admin-input admin-input-select"
                value={broadcastRole}
                onChange={(e) => setBroadcastRole(e.target.value)}
              >
                <option value="">All users</option>
                {roleOptions.map((opt) => (
                  <option key={opt.key} value={opt.key}>{opt.label}</option>
                ))}
              </select>
            </AdminFilterField>
            <AdminFilterField label="Joined within" htmlFor="broadcast-joined">
              <select
                id="broadcast-joined"
                className="admin-input admin-input-select"
                value={broadcastJoinedDays}
                onChange={(e) => setBroadcastJoinedDays(e.target.value)}
              >
                <option value="">Any time</option>
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
              </select>
            </AdminFilterField>
            <AdminFilterField label="Max recipients" htmlFor="broadcast-limit">
              <input
                id="broadcast-limit"
                className="admin-input"
                type="number"
                min={1}
                max={BROADCAST_MAX}
                value={broadcastLimit}
                onChange={(e) => setBroadcastLimit(e.target.value)}
              />
            </AdminFilterField>
          </AdminFilterBar>

          <AdminFieldGroup title="Message">
            <textarea
              id="broadcast-message"
              className="admin-input admin-textarea"
              rows={4}
              maxLength={MESSAGE_MAX}
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
              placeholder="Announcement for selected audience…"
              disabled={broadcastMutation.isPending}
            />
          </AdminFieldGroup>

          {broadcastError ? <p className="admin-error">{broadcastError}</p> : null}
          {broadcastResult ? (
            <p className="admin-success-banner">
              Sent to {broadcastResult.sent} user{broadcastResult.sent === 1 ? '' : 's'}
              {' · '}
              {broadcastResult.device_tokens} push token{broadcastResult.device_tokens === 1 ? '' : 's'}
            </p>
          ) : null}

          <div className="admin-form-actions">
            <button
              className="admin-button"
              type="submit"
              disabled={!broadcastMessage.trim() || broadcastMutation.isPending}
            >
              {broadcastMutation.isPending ? 'Sending…' : 'Broadcast'}
            </button>
          </div>
        </form>
      </AdminPanel>
    </AdminSection>
  );
}
