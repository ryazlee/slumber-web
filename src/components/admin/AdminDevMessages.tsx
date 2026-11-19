import { useState } from 'react';
import type { FormEvent, KeyboardEvent } from 'react';
import { Link } from 'react-router-dom';
import { getOptionalQueryErrorMessage } from '../../lib/queryError';
import {
  formatAdminSleepSource,
  formatAdminUserDevice,
  type AdminUserDetail,
} from '../../lib/admin';
import { DEV_MESSAGE_MAX_LENGTH } from '../../lib/devMessages';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useAdminUserDetail, useAdminUserSearch } from '../../hooks/useAdmin';
import {
  useAdminDevMessages,
  useAdminDevReply,
  useAdminDevThreads,
} from '../../hooks/useAdminDevMessages';
import AdminSection from './AdminSection';
import { formatWhen } from './format';

export default function AdminDevMessages() {
  const threadsQuery = useAdminDevThreads();
  const threads = threadsQuery.data ?? [];
  const [picked, setPicked] = useState<{ id: string; username: string } | null>(null);
  const [starting, setStarting] = useState(false);
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const debouncedSearch = useDebouncedValue(search.trim());
  const canSearch = starting && debouncedSearch.length >= 2;
  const peopleQuery = useAdminUserSearch(
    { query: debouncedSearch, page: 0, pageSize: 8 },
    canSearch,
  );
  const selectedId = picked?.id ?? null;
  const selected = threads.find((thread) => thread.user_id === selectedId) ?? null;
  const username = selected?.username ?? picked?.username ?? '';
  const detailQuery = useAdminUserDetail(selectedId);
  const messagesQuery = useAdminDevMessages(selectedId);
  const reply = useAdminDevReply(selectedId);
  const messages = messagesQuery.data ?? [];
  const trimmed = draft.trim();
  const canSend = Boolean(selectedId && trimmed && !reply.isPending);

  const threadsError = getOptionalQueryErrorMessage(threadsQuery.error, 'Could not load conversations.');
  const messagesError = getOptionalQueryErrorMessage(messagesQuery.error, 'Could not load messages.');

  const send = async () => {
    if (!canSend) return;
    setFormError(null);
    try {
      await reply.mutateAsync(trimmed);
      setDraft('');
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Could not send the message.');
    }
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    void send();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter' && canSend) {
      event.preventDefault();
      void send();
    }
  };

  return (
    <AdminSection
      lead="Message someone first, or reply when they write from Settings. Either way they get a notification."
      error={threadsError}
    >
      <div className={`admin-dev-messages${selectedId ? ' admin-dev-messages--open' : ''}`}>
        <div className="admin-dev-thread-list">
          <div className="admin-dev-new">
            <button
              type="button"
              className="admin-button admin-button-ghost"
              onClick={() => {
                setStarting((open) => !open);
                setSearch('');
              }}
            >
              {starting ? 'Cancel' : 'New message'}
            </button>
            {starting ? (
              <>
                <label className="admin-label" htmlFor="dev-user-search">Person</label>
                <input
                  id="dev-user-search"
                  className="admin-input"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Username or email"
                  autoComplete="off"
                />
                {debouncedSearch.length > 0 && debouncedSearch.length < 2 ? (
                  <p className="admin-field-hint">Type at least 2 characters.</p>
                ) : null}
                {peopleQuery.isFetching && canSearch ? (
                  <p className="admin-muted">Searching…</p>
                ) : null}
                {peopleQuery.error ? (
                  <p className="admin-error">
                    {getOptionalQueryErrorMessage(peopleQuery.error, 'Could not search people.')}
                  </p>
                ) : null}
                {canSearch && !peopleQuery.isFetching && (peopleQuery.data?.rows.length ?? 0) === 0 ? (
                  <p className="admin-empty-inline">No one matches that.</p>
                ) : null}
                <ul className="admin-dev-search-results">
                  {(peopleQuery.data?.rows ?? []).map((person) => (
                    <li key={person.id}>
                      <button
                        type="button"
                        className="admin-dev-thread"
                        onClick={() => {
                          setPicked({ id: person.id, username: person.username });
                          setStarting(false);
                          setSearch('');
                          setDraft('');
                          setFormError(null);
                        }}
                      >
                        <span className="admin-dev-thread-name">@{person.username}</span>
                        {person.email ? (
                          <span className="admin-dev-thread-preview">{person.email}</span>
                        ) : null}
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </div>
          {threadsQuery.isLoading ? <p className="admin-muted">Loading conversations…</p> : null}
          {!threadsQuery.isLoading && threads.length === 0 ? (
            <p className="admin-empty-inline">No messages yet.</p>
          ) : null}
          <ul className="admin-dev-threads">
            {threads.map((thread) => {
              const waiting = thread.last_sender === 'user';
              return (
                <li key={thread.user_id}>
                  <button
                    type="button"
                    className={`admin-dev-thread${thread.user_id === selectedId ? ' admin-dev-thread--active' : ''}`}
                    onClick={() => {
                      setPicked({ id: thread.user_id, username: thread.username });
                      setStarting(false);
                      setFormError(null);
                    }}
                  >
                    <span className="admin-dev-thread-name">
                      @{thread.username}
                      {waiting ? <span className="admin-dev-waiting">Waiting</span> : null}
                    </span>
                    <span className="admin-dev-thread-preview">{thread.last_body}</span>
                    <span className="admin-dev-thread-meta">
                      {thread.last_at ? formatWhen(thread.last_at) : ''}
                      {' · '}
                      {thread.message_count}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="admin-dev-thread-pane">
          {picked ? (
            <>
              <div className="admin-dev-pane-header">
                <button
                  type="button"
                  className="admin-button admin-button-ghost admin-dev-back"
                  onClick={() => setPicked(null)}
                >
                  All conversations
                </button>
                <div className="admin-dev-pane-heading">
                  <h2 className="admin-dev-pane-title">@{username}</h2>
                  <Link to={`/profile/${picked.id}`} className="admin-muted">
                    Open profile
                  </Link>
                </div>
              </div>
              <AdminDevUserFacts
                detail={detailQuery.data ?? null}
                loading={detailQuery.isLoading}
                error={getOptionalQueryErrorMessage(detailQuery.error, 'Could not load this person.')}
              />
              {messagesError ? <p className="admin-error">{messagesError}</p> : null}
              <div className="admin-dev-log">
                {messagesQuery.isLoading && messages.length === 0 ? (
                  <p className="admin-muted">Loading messages…</p>
                ) : null}
                {!messagesQuery.isLoading && messages.length === 0 ? (
                  <p className="admin-empty-inline">No messages yet. This will be the first one.</p>
                ) : null}
                {messages.map((message) => {
                  const fromDev = message.sender === 'dev';
                  return (
                    <div
                      key={message.id}
                      className={`admin-dev-bubble${fromDev ? ' admin-dev-bubble--dev' : ''}`}
                    >
                      <p className="admin-dev-bubble-who">{fromDev ? 'You' : `@${username}`}</p>
                      <p className="admin-dev-bubble-body">{message.body}</p>
                      <p className="admin-dev-bubble-time">
                        {message.created_at ? formatWhen(message.created_at) : ''}
                      </p>
                    </div>
                  );
                })}
              </div>
              <form className="admin-compose-form" onSubmit={handleSubmit}>
                <label className="admin-label" htmlFor="dev-reply">
                  {messages.length === 0 ? 'Message' : 'Reply'}
                </label>
                <textarea
                  id="dev-reply"
                  className="admin-input admin-textarea"
                  rows={3}
                  maxLength={DEV_MESSAGE_MAX_LENGTH}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder={messages.length === 0 ? `Message @${username}…` : `Reply to @${username}…`}
                  disabled={reply.isPending}
                />
                <p className="admin-field-hint admin-compose-meta">
                  {trimmed.length}/{DEV_MESSAGE_MAX_LENGTH} · ⌘/Ctrl + Enter to send
                </p>
                {formError ? <p className="admin-error">{formError}</p> : null}
                <div className="admin-form-actions">
                  <button className="admin-button" type="submit" disabled={!canSend}>
                    {reply.isPending ? 'Sending…' : messages.length === 0 ? 'Send message' : 'Send reply'}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <p className="admin-empty-inline admin-dev-pick">Pick a conversation.</p>
          )}
        </div>
      </div>
    </AdminSection>
  );
}

function AdminDevUserFacts({
  detail,
  loading,
  error,
}: {
  detail: AdminUserDetail | null;
  loading: boolean;
  error: string | null;
}) {
  if (error) return <p className="admin-error">{error}</p>;
  if (!detail) {
    return loading ? <p className="admin-muted">Loading their details…</p> : null;
  }
  const sleepSource = formatAdminSleepSource(detail.preferred_sleep_source);
  const version = detail.last_app_version ? `v${detail.last_app_version}` : '—';
  return (
    <dl className="admin-user-detail-grid admin-dev-facts">
      <div><dt>Device</dt><dd>{formatAdminUserDevice(detail)}</dd></div>
      <div><dt>Version</dt><dd>{version}</dd></div>
      <div><dt>Posts</dt><dd>{detail.posts_count}</dd></div>
      <div><dt>Friends</dt><dd>{detail.friends_count}</dd></div>
      <div><dt>Streak</dt><dd>{detail.current_streak} (best {detail.longest_streak})</dd></div>
      <div><dt>Premium</dt><dd>{detail.is_premium ? 'Yes' : 'No'}</dd></div>
      <div><dt>Last post</dt><dd>{detail.last_post_at ? formatWhen(detail.last_post_at) : '—'}</dd></div>
      <div><dt>Joined</dt><dd>{detail.created_at ? formatWhen(detail.created_at) : '—'}</dd></div>
      <div><dt>Email</dt><dd>{detail.email || '—'}</dd></div>
      {sleepSource ? <div><dt>Sleep source</dt><dd>{sleepSource}</dd></div> : null}
      {detail.is_suspended ? <div><dt>Status</dt><dd>Suspended</dd></div> : null}
    </dl>
  );
}
