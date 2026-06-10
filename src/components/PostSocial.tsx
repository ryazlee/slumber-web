import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { timeAgo } from '../lib/format';
import {
  addComment,
  fetchComments,
  fetchKudosUsers,
  toggleKudos,
} from '../lib/posts';
import type { Comment, KudosUser } from '../lib/types';
import CommentRow from './CommentRow';
import Popup from './Popup';
import UserLink from './UserLink';

export type PostSocialPatch = {
  kudosCount?: number;
  hasKudoed?: boolean;
  commentCount?: number;
};

type PostSocialProps = {
  postId: string;
  kudosCount: number;
  hasKudoed: boolean;
  commentCount: number;
  sourceDevice: string;
  defaultCommentsOpen?: boolean;
  onPatch?: (patch: PostSocialPatch) => void;
};

export default function PostSocial({
  postId,
  kudosCount: initialKudosCount,
  hasKudoed: initialHasKudoed,
  commentCount: initialCommentCount,
  sourceDevice,
  defaultCommentsOpen = false,
  onPatch,
}: PostSocialProps) {
  const { user } = useAuth();

  const [kudosCount, setKudosCount] = useState(initialKudosCount);
  const [hasKudoed, setHasKudoed] = useState(initialHasKudoed);
  const [commentCount, setCommentCount] = useState(initialCommentCount);

  const [kudosOpen, setKudosOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(defaultCommentsOpen);
  const [kudosLoading, setKudosLoading] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [kudosActionLoading, setKudosActionLoading] = useState(false);
  const [kudosError, setKudosError] = useState<string | null>(null);
  const [commentsError, setCommentsError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [kudos, setKudos] = useState<KudosUser[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [kudosLoaded, setKudosLoaded] = useState(false);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [sending, setSending] = useState(false);

  const patchParent = useCallback((patch: PostSocialPatch) => {
    onPatch?.(patch);
  }, [onPatch]);

  useEffect(() => {
    setKudosCount(initialKudosCount);
    setHasKudoed(initialHasKudoed);
    setCommentCount(initialCommentCount);
  }, [initialKudosCount, initialHasKudoed, initialCommentCount]);

  useEffect(() => {
    setKudosOpen(false);
    setCommentsOpen(defaultCommentsOpen);
    setKudos([]);
    setComments([]);
    setKudosLoaded(false);
    setCommentsLoaded(false);
    setKudosError(null);
    setCommentsError(null);
    setSendError(null);
    setCommentText('');
  }, [postId, defaultCommentsOpen]);

  useEffect(() => {
    if (!kudosOpen || kudosLoaded) return;
    let cancelled = false;
    setKudosLoading(true);
    setKudosError(null);
    fetchKudosUsers(postId)
      .then((rows) => {
        if (!cancelled) {
          setKudos(rows);
          setKudosLoaded(true);
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setKudosError(e instanceof Error ? e.message : 'Could not load kudos.');
        }
      })
      .finally(() => {
        if (!cancelled) setKudosLoading(false);
      });
    return () => { cancelled = true; };
  }, [kudosOpen, kudosLoaded, postId]);

  useEffect(() => {
    if (!commentsOpen || commentsLoaded) return;
    let cancelled = false;
    setCommentsLoading(true);
    setCommentsError(null);
    fetchComments(postId)
      .then((rows) => {
        if (!cancelled) {
          setComments(rows);
          setCommentCount(rows.length);
          patchParent({ commentCount: rows.length });
          setCommentsLoaded(true);
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setCommentsError(e instanceof Error ? e.message : 'Could not load comments.');
        }
      })
      .finally(() => {
        if (!cancelled) setCommentsLoading(false);
      });
    return () => { cancelled = true; };
  }, [commentsOpen, commentsLoaded, postId, patchParent]);

  const handleKudos = async () => {
    if (!user || kudosActionLoading) return;

    const nextHasKudoed = !hasKudoed;
    const optimisticCount = hasKudoed ? Math.max(0, kudosCount - 1) : kudosCount + 1;
    const prev = { kudosCount, hasKudoed };

    setKudosCount(optimisticCount);
    setHasKudoed(nextHasKudoed);
    patchParent({ kudosCount: optimisticCount, hasKudoed: nextHasKudoed });
    setKudosLoaded(false);

    setKudosActionLoading(true);
    try {
      const res = await toggleKudos(postId, user.id, prev.kudosCount, prev.hasKudoed);
      setKudosCount(res.kudosCount);
      setHasKudoed(res.hasKudoed);
      patchParent({ kudosCount: res.kudosCount, hasKudoed: res.hasKudoed });
    } catch {
      setKudosCount(prev.kudosCount);
      setHasKudoed(prev.hasKudoed);
      patchParent({ kudosCount: prev.kudosCount, hasKudoed: prev.hasKudoed });
    } finally {
      setKudosActionLoading(false);
    }
  };

  const handleSendComment = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!user || !commentText.trim() || sending) return;

    setSending(true);
    setSendError(null);
    try {
      const c = await addComment(postId, user.id, commentText);
      setComments((prev) => [...prev, c]);
      setCommentCount((n) => {
        const next = n + 1;
        patchParent({ commentCount: next });
        return next;
      });
      setCommentText('');
    } catch (err: unknown) {
      setSendError(err instanceof Error ? err.message : 'Could not post comment.');
    } finally {
      setSending(false);
    }
  };

  const openKudosModal = () => {
    if (kudosCount <= 0) return;
    setKudosOpen(true);
  };

  const toggleComments = () => setCommentsOpen((v) => !v);

  return (
    <div className={`post-social${commentsOpen ? ' post-social--comments-open' : ''}`}>
      <footer className="post-card-footer">
        <div className="post-social-actions">
          {user ? (
            <>
              <div className="post-social-kudos-group">
                <button
                  type="button"
                  className={`post-social-icon-btn${hasKudoed ? ' post-social-icon-btn--active' : ''}`}
                  onClick={handleKudos}
                  disabled={kudosActionLoading}
                  aria-label={hasKudoed ? 'Remove kudos' : 'Give kudos'}
                  aria-pressed={hasKudoed}
                >
                  {hasKudoed ? '🫶' : '🤍'}
                </button>
                {kudosCount > 0 && (
                  <button
                    type="button"
                    className={`post-social-count${hasKudoed ? ' post-social-count--active' : ''}`}
                    onClick={openKudosModal}
                  >
                    {kudosCount}
                  </button>
                )}
              </div>

              <button
                type="button"
                className={`post-social-icon-btn${commentsOpen ? ' post-social-icon-btn--active' : ''}`}
                onClick={toggleComments}
                aria-expanded={commentsOpen}
                aria-label="Comments"
              >
                💬
                {commentCount > 0 && (
                  <span className="post-social-inline-count">{commentCount}</span>
                )}
              </button>
            </>
          ) : (
            <>
              {kudosCount > 0 && (
                <button type="button" className="post-social-btn" onClick={openKudosModal}>
                  {kudosCount} kudo{kudosCount === 1 ? '' : 's'}
                </button>
              )}
              {commentCount > 0 && (
                <button
                  type="button"
                  className={`post-social-btn${commentsOpen ? ' post-social-btn--active' : ''}`}
                  onClick={toggleComments}
                  aria-expanded={commentsOpen}
                >
                  {commentCount} comment{commentCount === 1 ? '' : 's'}
                </button>
              )}
            </>
          )}
        </div>
        <span className="post-source">{sourceDevice}</span>
      </footer>

      {commentsOpen && (
        <section className="post-comments" aria-label="Comments">
          {commentsLoading && <p className="post-comments-status">Loading comments…</p>}
          {commentsError && <p className="admin-error">{commentsError}</p>}
          {commentsLoaded && !commentsError && comments.length === 0 && (
            <p className="post-comments-status">No comments yet.</p>
          )}
          {commentsLoaded && comments.length > 0 && (
            <ul className="comment-thread">
              {comments.map((comment) => (
                <CommentRow key={comment.id} comment={comment} />
              ))}
            </ul>
          )}

          {user && (
            <form className="comment-compose" onSubmit={handleSendComment}>
              <textarea
                className="comment-compose-input"
                placeholder="Add a comment…"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                maxLength={300}
                rows={2}
                disabled={sending}
              />
              <button
                type="submit"
                className="comment-compose-send"
                disabled={!commentText.trim() || sending}
                aria-label="Send comment"
              >
                {sending ? '…' : '↑'}
              </button>
            </form>
          )}
          {sendError && <p className="admin-error">{sendError}</p>}
        </section>
      )}

      <Popup open={kudosOpen} onClose={() => setKudosOpen(false)} title="Kudos">
        {kudosLoading && <p className="popup-status">Loading…</p>}
        {kudosError && <p className="admin-error">{kudosError}</p>}
        {kudosLoaded && !kudosError && kudos.length === 0 && (
          <p className="popup-status">No kudos yet.</p>
        )}
        {kudosLoaded && kudos.length > 0 && (
          <ul className="kudos-list">
            {kudos.map((kudosUser) => (
              <li key={`${kudosUser.id}-${kudosUser.createdAt}`} className="kudos-row">
                <UserLink
                  userId={kudosUser.id}
                  username={kudosUser.username}
                  avatarUrl={kudosUser.avatarUrl}
                  showAvatar
                />
                <span className="kudos-row-meta">
                  gave kudos {timeAgo(kudosUser.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Popup>
    </div>
  );
}
