import { useEffect, useState } from 'react';
import { fetchComments, fetchKudosUsers } from '../lib/posts';
import { timeAgo } from '../lib/format';
import type { Comment, KudosUser } from '../lib/types';
import CommentRow from './CommentRow';
import Popup from './Popup';
import UserLink from './UserLink';

type PostSocialProps = {
  postId: string;
  kudosCount: number;
  commentCount: number;
  sourceDevice: string;
};

export default function PostSocial({
  postId,
  kudosCount,
  commentCount,
  sourceDevice,
}: PostSocialProps) {
  const [kudosOpen, setKudosOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [kudosLoading, setKudosLoading] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [kudosError, setKudosError] = useState<string | null>(null);
  const [commentsError, setCommentsError] = useState<string | null>(null);
  const [kudos, setKudos] = useState<KudosUser[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [kudosLoaded, setKudosLoaded] = useState(false);
  const [commentsLoaded, setCommentsLoaded] = useState(false);

  useEffect(() => {
    setKudosOpen(false);
    setCommentsOpen(false);
    setKudos([]);
    setComments([]);
    setKudosLoaded(false);
    setCommentsLoaded(false);
    setKudosError(null);
    setCommentsError(null);
  }, [postId]);

  useEffect(() => {
    if (!kudosOpen || kudosLoaded || kudosCount === 0) return;
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
  }, [kudosOpen, kudosLoaded, postId, kudosCount]);

  useEffect(() => {
    if (!commentsOpen || commentsLoaded || commentCount === 0) return;
    let cancelled = false;
    setCommentsLoading(true);
    setCommentsError(null);
    fetchComments(postId)
      .then((rows) => {
        if (!cancelled) {
          setComments(rows);
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
  }, [commentsOpen, commentsLoaded, postId, commentCount]);

  const toggleComments = () => setCommentsOpen((v) => !v);

  return (
    <div className={`post-social${commentsOpen ? ' post-social--comments-open' : ''}`}>
      <footer className="post-card-footer">
        <div className="post-social-actions">
          {kudosCount > 0 && (
            <button
              type="button"
              className="post-social-btn"
              onClick={() => setKudosOpen(true)}
            >
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
          {kudosCount === 0 && commentCount === 0 && (
            <span className="post-social-empty" />
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
            {kudos.map((user) => (
              <li key={`${user.id}-${user.createdAt}`} className="kudos-row">
                <UserLink
                  userId={user.id}
                  username={user.username}
                  avatarUrl={user.avatarUrl}
                  showAvatar
                />
                <span className="kudos-row-meta">
                  gave kudos {timeAgo(user.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Popup>
    </div>
  );
}
