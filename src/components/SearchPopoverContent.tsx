import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Avatar from './Avatar';
import { useSearch } from '../hooks/useSearch';
import { timeAgo } from '../lib/format';
import { searchFriendshipLabel } from '../lib/search';
import type { SleepPost, WebSearchUser } from '../lib/types';

type Props = {
  onClose: () => void;
};

function SearchUserRow({ user, onClose }: { user: WebSearchUser; onClose: () => void }) {
  return (
    <Link
      to={`/profile/${user.id}`}
      className="social-row social-row--link"
      onClick={onClose}
    >
      <Avatar
        userId={user.id}
        username={user.username}
        avatarUrl={user.avatarUrl}
        userRoles={user.userRoles}
      />
      <span className="social-row-main">
        <span className="social-row-title">@{user.username}</span>
        <span className="social-row-meta">
          {searchFriendshipLabel(user.friendStatus, user.isOwnProfile)}
        </span>
      </span>
    </Link>
  );
}

function SearchPostRow({ post, onClose }: { post: SleepPost; onClose: () => void }) {
  return (
    <Link
      to={`/post/${post.id}`}
      className="social-row social-row--link"
      onClick={onClose}
    >
      <Avatar
        userId={post.userId}
        username={post.username}
        avatarUrl={post.avatarUrl}
        userRoles={post.userRoles}
      />
      <span className="social-row-main">
        <span className="social-row-title">{post.title}</span>
        <span className="social-row-meta">
          @{post.username} · {timeAgo(post.createdAt)}
        </span>
      </span>
      <span className="search-row-chevron" aria-hidden="true">›</span>
    </Link>
  );
}

export default function SearchPopoverContent({ onClose }: Props) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const searchQuery = useSearch(query);
  const trimmed = query.trim();
  const users = searchQuery.data?.users ?? [];
  const posts = searchQuery.data?.posts ?? [];
  const searching = trimmed.length > 0 && searchQuery.isFetching;
  const showNoResults = trimmed.length > 0 && !searching && !searchQuery.isError
    && users.length === 0 && posts.length === 0;

  useEffect(() => {
    const focusTimeout = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
    return () => window.clearTimeout(focusTimeout);
  }, []);

  return (
    <div className="header-search-content">
      <div className="search-bar">
        <span className="search-bar-icon" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
            <path d="M20 20L16.5 16.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </span>
        <input
          ref={inputRef}
          type="search"
          className="search-bar-input"
          placeholder="Search users or post titles"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          autoCapitalize="off"
          autoCorrect="off"
          enterKeyHint="search"
        />
        {query.length > 0 ? (
          <button
            type="button"
            className="search-bar-clear"
            aria-label="Clear search"
            onClick={() => setQuery('')}
          >
            ×
          </button>
        ) : null}
      </div>

      <div className="header-search-results">
        {searching ? <p className="app-muted search-state">Searching…</p> : null}

        {!searching && trimmed.length === 0 ? (
          <div className="search-empty search-empty--popover">
            <p className="search-empty-title">Find people and posts</p>
            <p className="app-muted">Search by username or post title.</p>
          </div>
        ) : null}

        {showNoResults ? (
          <div className="search-empty search-empty--popover">
            <p className="search-empty-title">No results</p>
            <p className="app-muted">Try a different username or post title.</p>
          </div>
        ) : null}

        {searchQuery.isError ? (
          <p className="admin-error">Could not search right now. Please try again.</p>
        ) : null}

        {!searching && users.length > 0 ? (
          <section className="search-section">
            <h2>Users</h2>
            <div className="social-list">
              {users.map((user) => (
                <SearchUserRow key={user.id} user={user} onClose={onClose} />
              ))}
            </div>
          </section>
        ) : null}

        {!searching && posts.length > 0 ? (
          <section className="search-section">
            <h2>Posts</h2>
            <div className="social-list">
              {posts.map((post) => (
                <SearchPostRow key={post.id} post={post} onClose={onClose} />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
