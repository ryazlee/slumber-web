import { useEffect, useState } from 'react';
import { fetchComments, fetchKudosUsers } from '../lib/posts';
import { timeAgo } from '../lib/format';
import type { Comment, KudosUser } from '../lib/types';
import UserLink from './UserLink';

type PostSocialProps = {
  postId: string;
  kudosCount: number;
  commentCount: number;
  sourceDevice: string;
};

function socialLabel(kudosCount: number, commentCount: number): string {
  const parts: string[] = [];
  if (kudosCount > 0) {
    parts.push(`${kudosCount} kudo${kudosCount === 1 ? '' : 's'}`);
  }
  if (commentCount > 0) {
    parts.push(`${commentCount} comment${commentCount === 1 ? '' : 's'}`);
  }
  return parts.join(' · ');
}

export default function PostSocial({
  postId,
  kudosCount,
  commentCount,
  sourceDevice,
}: PostSocialProps) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [kudos, setKudos] = useState<KudosUser[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loaded, setLoaded] = useState(false);

  const hasSocial = kudosCount > 0 || commentCount > 0;
  const label = socialLabel(kudosCount, commentCount);

  useEffect(() => {
    if (!expanded || loaded) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([
      kudosCount > 0 ? fetchKudosUsers(postId) : Promise.resolve([]),
      commentCount > 0 ? fetchComments(postId) : Promise.resolve([]),
    ])
      .then(([kudosRows, commentRows]) => {
        if (cancelled) return;
        setKudos(kudosRows);
        setComments(commentRows);
        setLoaded(true);
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Could not load activity.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [expanded, loaded, postId, kudosCount, commentCount]);

  const handleToggle = () => {
    if (!hasSocial) return;
    setExpanded((v) => !v);
  };

  return (
    <div className={`post-social${expanded ? ' post-social--open' : ''}`}>
      <footer className="post-card-footer">
        {hasSocial ? (
          <button
            type="button"
            className="post-social-toggle"
            onClick={handleToggle}
            aria-expanded={expanded}
          >
            {label}
          </button>
        ) : (
          <span className="post-social-empty" />
        )}
        <span className="post-source">{sourceDevice}</span>
      </footer>

      {expanded && (
        <div className="post-social-body">
          {loading && <p className="app-muted">Loading…</p>}
          {error && <p className="admin-error">{error}</p>}

          {loaded && !error && (
            <>
              {kudos.length > 0 && (
                <section className="post-social-section">
                  <h4 className="post-social-heading">Kudos</h4>
                  <ul className="post-kudos-list">
                    {kudos.map((user) => (
                      <li key={`${user.id}-${user.createdAt}`} className="post-kudos-item">
                        <UserLink
                          userId={user.id}
                          username={user.username}
                          avatarUrl={user.avatarUrl}
                          showAvatar
                        />
                        <span className="post-kudos-time">{timeAgo(user.createdAt)}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {comments.length > 0 && (
                <section className="post-social-section">
                  <h4 className="post-social-heading">Comments</h4>
                  <ul className="post-comment-list">
                    {comments.map((comment) => (
                      <li key={comment.id} className="post-comment-item">
                        <UserLink
                          userId={comment.userId}
                          username={comment.username}
                          avatarUrl={comment.avatarUrl}
                          showAvatar
                        />
                        <div className="post-comment-content">
                          <div className="post-comment-meta">
                            <span className="post-comment-time">{timeAgo(comment.createdAt)}</span>
                          </div>
                          <p className="post-comment-text">{comment.text}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {kudos.length === 0 && comments.length === 0 && (
                <p className="app-muted">No activity to show.</p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
