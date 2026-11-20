import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent, KeyboardEvent } from 'react';
import { Link } from 'react-router-dom';
import { getOptionalQueryErrorMessage } from '../../lib/queryError';
import {
  formatAdminSleepSource,
  formatAdminUserDevice,
  type AdminUserDetail,
} from '../../lib/admin';
import { DEV_MESSAGE_MAX_LENGTH, countWaitingDevThreads, isWaitingDevThread } from '../../lib/devMessages';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useAdminUserDetail, useAdminUserSearch } from '../../hooks/useAdmin';
import {
  useAdminDevMessageUserIds,
  useAdminDevMessages,
  useAdminDevReply,
  useAdminDevThreads,
} from '../../hooks/useAdminDevMessages';
import AdminSection from './AdminSection';
import { formatWhen } from './format';

/**
 * Lift the thread above the on-screen keyboard. The layout viewport often
 * stays full height while the visual viewport shrinks, which parks the
 * composer under the keyboard.
 */
function useAdminDevKeyboardInset() {
  useEffect(() => {
    const root = document.documentElement;
    const viewport = window.visualViewport;
    if (!viewport) return undefined;

    let frame = 0;
    let alive = true;

    const sync = () => {
      if (!alive) return;
      const active = document.activeElement;
      const typing = active instanceof HTMLElement
        && active.closest('.admin-dev-messages') != null
        && (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement);
      const obscured = Math.max(0, window.innerHeight - viewport.offsetTop - viewport.height);
      root.style.setProperty('--admin-dev-keyboard', typing ? `${Math.round(obscured)}px` : '0px');
    };

    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(sync);
    };

    schedule();
    viewport.addEventListener('resize', schedule);
    viewport.addEventListener('scroll', schedule);
    document.addEventListener('focusin', schedule);
    document.addEventListener('focusout', schedule);
    return () => {
      alive = false;
      cancelAnimationFrame(frame);
      viewport.removeEventListener('resize', schedule);
      viewport.removeEventListener('scroll', schedule);
      document.removeEventListener('focusin', schedule);
      document.removeEventListener('focusout', schedule);
      root.style.removeProperty('--admin-dev-keyboard');
    };
  }, []);
}

export default function AdminDevMessages() {
  useAdminDevKeyboardInset();
  const threadsQuery = useAdminDevThreads();
  const threads = threadsQuery.data ?? [];
  const [picked, setPicked] = useState<{ id: string; username: string } | null>(null);
  const [starting, setStarting] = useState(false);
  const [search, setSearch] = useState('');
  const [threadSearch, setThreadSearch] = useState('');
  const [draft, setDraft] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const debouncedSearch = useDebouncedValue(search.trim());
  const debouncedThreadSearch = useDebouncedValue(threadSearch.trim());
  const threadSearchActive = debouncedThreadSearch.length >= 2;
  const bodySearch = useAdminDevMessageUserIds(debouncedThreadSearch);
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
  const logRef = useRef<HTMLDivElement>(null);
  const lastMessageId = messages[messages.length - 1]?.id ?? '';
  useEffect(() => {
    const log = logRef.current;
    if (!log) return;
    log.scrollTop = log.scrollHeight;
  }, [selectedId, lastMessageId]);
  const trimmed = draft.trim();
  const canSend = Boolean(selectedId && trimmed && !reply.isPending);

  const threadsError = getOptionalQueryErrorMessage(threadsQuery.error, 'Could not load conversations.');
  const messagesError = getOptionalQueryErrorMessage(messagesQuery.error, 'Could not load messages.');
  const threadSearchError = getOptionalQueryErrorMessage(bodySearch.error, 'Could not search messages.');
  const bodyMatchIds = useMemo(() => new Set(bodySearch.data ?? []), [bodySearch.data]);
  const visibleThreads = useMemo(() => {
    const filtered = !threadSearchActive
      ? threads
      : threads.filter((thread) => {
        const usernameQuery = debouncedThreadSearch.replace(/^@/, '').toLowerCase();
        const usernameHit = usernameQuery.length > 0
          && thread.username.toLowerCase().includes(usernameQuery);
        return usernameHit || bodyMatchIds.has(thread.user_id);
      });
    return filtered.slice().sort((a, b) => {
      const rank = (thread: typeof a) => (isWaitingDevThread(thread) ? 0 : 1);
      return rank(a) - rank(b);
    });
  }, [threads, threadSearchActive, debouncedThreadSearch, bodyMatchIds]);
  const waitingCount = countWaitingDevThreads(threads);
  const selectedWaiting = selected ? isWaitingDevThread(selected) : false;

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
      className="admin-dev-page"
      lead="Message someone first, or reply when they write from Settings. Either way they get a notification."
      error={threadsError}
    >
      <div className={`admin-dev-messages${selectedId ? ' admin-dev-messages--open' : ''}`}>
        <div className="admin-dev-thread-list">
          <div className="admin-dev-list-tools">
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
                          <span className="admin-dev-thread-name">
                            <span className="admin-dev-thread-handle">@{person.username}</span>
                          </span>
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
            <div className="admin-dev-thread-search">
              <label className="admin-label" htmlFor="dev-thread-search">Search</label>
              <input
                id="dev-thread-search"
                className="admin-input"
                type="search"
                value={threadSearch}
                onChange={(event) => setThreadSearch(event.target.value)}
                placeholder="Message or username"
                autoComplete="off"
              />
              {debouncedThreadSearch.length > 0 && debouncedThreadSearch.length < 2 ? (
                <p className="admin-field-hint">Type at least 2 characters.</p>
              ) : null}
              {threadSearchActive && bodySearch.isLoading ? (
                <p className="admin-muted">Searching…</p>
              ) : null}
              {threadSearchActive && threadSearchError ? (
                <p className="admin-error">{threadSearchError}</p>
              ) : null}
              {!threadsQuery.isLoading && waitingCount > 0 && !threadSearchActive ? (
                <p className="admin-dev-queue">
                  {waitingCount === 1
                    ? '1 person is waiting'
                    : `${waitingCount} people are waiting`}
                </p>
              ) : null}
            </div>
          </div>
          <div className="admin-dev-thread-scroll">
            {threadsQuery.isLoading ? <p className="admin-muted">Loading conversations…</p> : null}
            {!threadsQuery.isLoading && threads.length === 0 ? (
              <div className="admin-dev-empty">
                <p className="admin-dev-empty-title">No messages yet</p>
                <p className="admin-dev-empty-copy">
                  When someone writes from Settings, their thread shows up here.
                </p>
              </div>
            ) : null}
            {!threadsQuery.isLoading
              && threadSearchActive
              && !threadSearchError
              && threads.length > 0
              && visibleThreads.length === 0
              && !bodySearch.isLoading ? (
              <p className="admin-empty-inline">No conversations match that.</p>
            ) : null}
            <ul className="admin-dev-threads">
              {visibleThreads.map((thread) => {
                const waiting = isWaitingDevThread(thread);
                const active = thread.user_id === selectedId;
                return (
                  <li key={thread.user_id}>
                    <button
                      type="button"
                      className={`admin-dev-thread${active ? ' admin-dev-thread--active' : ''}${waiting ? ' admin-dev-thread--waiting' : ''}`}
                      onClick={() => {
                        setPicked({ id: thread.user_id, username: thread.username });
                        setStarting(false);
                        setFormError(null);
                      }}
                    >
                      <span className="admin-dev-thread-name">
                        <span className="admin-dev-thread-handle">@{thread.username}</span>
                        {waiting ? <span className="admin-dev-waiting">Waiting</span> : null}
                      </span>
                      <span className="admin-dev-thread-preview">{thread.last_body}</span>
                      <span className="admin-dev-thread-meta">
                        {waiting ? 'Needs a reply' : 'You replied'}
                        {thread.last_at ? ` · ${formatWhen(thread.last_at)}` : ''}
                        {' · '}
                        {thread.message_count} {thread.message_count === 1 ? 'message' : 'messages'}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div className={`admin-dev-thread-pane${picked ? '' : ' admin-dev-thread-pane--empty'}`}>
          {picked ? (
            <>
              <div className="admin-dev-pane-header">
                <button
                  type="button"
                  className="admin-button admin-button-ghost admin-dev-back"
                  onClick={() => setPicked(null)}
                  aria-label="Back to conversations"
                >
                  Back
                </button>
                <div className="admin-dev-pane-heading">
                  <div className="admin-dev-pane-title-row">
                    <h2 className="admin-dev-pane-title">@{username}</h2>
                    {selectedWaiting ? <span className="admin-dev-waiting">Waiting</span> : null}
                  </div>
                  <Link to={`/profile/${picked.id}`} className="admin-dev-profile">
                    Open profile
                  </Link>
                </div>
              </div>
              <div className="admin-dev-thread-body">
                <AdminDevUserFacts
                  key={picked.id}
                  detail={detailQuery.data ?? null}
                  loading={detailQuery.isLoading}
                  error={getOptionalQueryErrorMessage(detailQuery.error, 'Could not load this person.')}
                />
                {messagesError ? <p className="admin-error">{messagesError}</p> : null}
                <div className="admin-dev-log" aria-label="Conversation" ref={logRef}>
                  {messagesQuery.isLoading && messages.length === 0 ? (
                    <p className="admin-muted">Loading messages…</p>
                  ) : null}
                  {!messagesQuery.isLoading && messages.length === 0 ? (
                    <div className="admin-dev-empty">
                      <p className="admin-dev-empty-title">No messages yet</p>
                      <p className="admin-dev-empty-copy">This will be the first one.</p>
                    </div>
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
              </div>
              <form className="admin-compose-form admin-dev-compose" onSubmit={handleSubmit}>
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
                  {trimmed.length}/{DEV_MESSAGE_MAX_LENGTH}
                  <span className="admin-dev-compose-shortcut"> · ⌘/Ctrl + Enter to send</span>
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
            <div className="admin-dev-pick">
              <p className="admin-dev-pick-title">Pick a conversation</p>
              <p className="admin-dev-pick-copy">
                People waiting on a reply are marked in the list. Or start with New message.
              </p>
            </div>
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
  const sleepSource = detail ? formatAdminSleepSource(detail.preferred_sleep_source) : null;
  const version = detail?.last_app_version ? `v${detail.last_app_version}` : '—';

  return (
    <details className="admin-dev-facts-disclosure">
      <summary>About this person</summary>
      {error ? <p className="admin-error">{error}</p> : null}
      {!error && !detail && loading ? <p className="admin-muted">Loading their details…</p> : null}
      {detail ? (
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
      ) : null}
    </details>
  );
}
