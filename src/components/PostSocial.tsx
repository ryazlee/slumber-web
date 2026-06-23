import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  useAddComment,
  useCommentLikes,
  useDeleteComment,
  usePostComments,
  usePostKudos,
  useToggleCommentLike,
  useToggleKudos,
  useUpdateComment,
} from '../hooks/usePostSocial';
import { timeAgo } from '../lib/format';
import type { Comment } from '../lib/types';
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
  const [commentLikesId, setCommentLikesId] = useState<string | null>(null);
  const [commentsOpen, setCommentsOpen] = useState(defaultCommentsOpen);
  const [commentText, setCommentText] = useState('');
  const [sendError, setSendError] = useState<string | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [likePendingId, setLikePendingId] = useState<string | null>(null);

  const kudosQuery = usePostKudos(postId, kudosOpen);
  const commentsQuery = usePostComments(postId, commentsOpen);
  const commentLikesQuery = useCommentLikes(commentLikesId, !!commentLikesId);
  const toggleKudosMutation = useToggleKudos(postId);
  const addCommentMutation = useAddComment(postId);
  const toggleCommentLikeMutation = useToggleCommentLike(postId);
  const updateCommentMutation = useUpdateComment(postId);
  const deleteCommentMutation = useDeleteComment(postId);

  const patchParent = useCallback((patch: PostSocialPatch) => {
    onPatch?.(patch);
  }, [onPatch]);

  const syncedCommentCount = useRef<number | null>(null);

  useEffect(() => {
    setKudosCount(initialKudosCount);
    setHasKudoed(initialHasKudoed);
    setCommentCount(initialCommentCount);
  }, [initialKudosCount, initialHasKudoed, initialCommentCount]);

  useEffect(() => {
    setKudosOpen(false);
    setCommentLikesId(null);
    setCommentsOpen(defaultCommentsOpen);
    setSendError(null);
    setCommentText('');
    setEditingCommentId(null);
    setEditText('');
    syncedCommentCount.current = null;
  }, [postId, defaultCommentsOpen]);

  useEffect(() => {
    if (!commentsOpen || !commentsQuery.isSuccess) return;
    const count = commentsQuery.data.length;
    if (syncedCommentCount.current === count) return;
    syncedCommentCount.current = count;
    setCommentCount(count);
    patchParent({ commentCount: count });
  }, [commentsOpen, commentsQuery.isSuccess, commentsQuery.data, patchParent]);

  const handleKudos = async () => {
    if (!user || toggleKudosMutation.isPending) return;

    const nextHasKudoed = !hasKudoed;
    const optimisticCount = hasKudoed ? Math.max(0, kudosCount - 1) : kudosCount + 1;
    const prev = { kudosCount, hasKudoed };

    setKudosCount(optimisticCount);
    setHasKudoed(nextHasKudoed);
    patchParent({ kudosCount: optimisticCount, hasKudoed: nextHasKudoed });

    try {
      const res = await toggleKudosMutation.mutateAsync({
        userId: user.id,
        kudosCount: prev.kudosCount,
        hasKudoed: prev.hasKudoed,
      });
      setKudosCount(res.kudosCount);
      setHasKudoed(res.hasKudoed);
      patchParent({ kudosCount: res.kudosCount, hasKudoed: res.hasKudoed });
    } catch {
      setKudosCount(prev.kudosCount);
      setHasKudoed(prev.hasKudoed);
      patchParent({ kudosCount: prev.kudosCount, hasKudoed: prev.hasKudoed });
    }
  };

  const handleSendComment = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!user || !commentText.trim() || addCommentMutation.isPending) return;

    setSendError(null);
    try {
      await addCommentMutation.mutateAsync({ userId: user.id, text: commentText });
      setCommentCount((n) => {
        const next = n + 1;
        patchParent({ commentCount: next });
        return next;
      });
      setCommentText('');
    } catch (err: unknown) {
      setSendError(err instanceof Error ? err.message : 'Could not post comment.');
    }
  };

  const openKudosModal = () => {
    if (kudosCount <= 0) return;
    setKudosOpen(true);
  };

  const toggleComments = () => setCommentsOpen((v) => !v);

  const handleLikeComment = async (comment: Comment) => {
    if (!user || likePendingId) return;

    setLikePendingId(comment.id);
    try {
      await toggleCommentLikeMutation.mutateAsync({
        commentId: comment.id,
        userId: user.id,
        likeCount: comment.likeCount,
        hasLiked: comment.hasLiked,
      });
    } catch {
      void commentsQuery.refetch();
    } finally {
      setLikePendingId(null);
    }
  };

  const handleStartEdit = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditText(comment.text);
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditText('');
  };

  const handleSaveEdit = async () => {
    if (!user || !editingCommentId || !editText.trim() || updateCommentMutation.isPending) return;
    try {
      await updateCommentMutation.mutateAsync({
        commentId: editingCommentId,
        userId: user.id,
        text: editText,
      });
      handleCancelEdit();
    } catch (err: unknown) {
      setSendError(err instanceof Error ? err.message : 'Could not update comment.');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!user || deleteCommentMutation.isPending) return;
    if (!window.confirm('Delete this comment?')) return;

    setSendError(null);
    try {
      await deleteCommentMutation.mutateAsync({ commentId, userId: user.id });
      if (editingCommentId === commentId) handleCancelEdit();
      setCommentCount((n) => {
        const next = Math.max(0, n - 1);
        patchParent({ commentCount: next });
        return next;
      });
    } catch (err: unknown) {
      setSendError(err instanceof Error ? err.message : 'Could not delete comment.');
    }
  };

  const openCommentLikes = (commentId: string, likeCount: number) => {
    if (likeCount <= 0) return;
    setCommentLikesId(commentId);
  };

  const kudos = kudosQuery.data ?? [];
  const comments = commentsQuery.data ?? [];
  const commentLikes = commentLikesQuery.data ?? [];
  const kudosError = kudosQuery.error instanceof Error ? kudosQuery.error.message : null;
  const commentsError = commentsQuery.error instanceof Error ? commentsQuery.error.message : null;
  const commentLikesError = commentLikesQuery.error instanceof Error ? commentLikesQuery.error.message : null;

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
                  disabled={toggleKudosMutation.isPending}
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
          {commentsQuery.isLoading && <p className="post-comments-status">Loading comments…</p>}
          {commentsError && <p className="admin-error">{commentsError}</p>}
          {commentsQuery.isSuccess && comments.length === 0 && (
            <p className="post-comments-status">No comments yet.</p>
          )}
          {commentsQuery.isSuccess && comments.length > 0 && (
            <ul className="comment-thread">
              {comments.map((comment) => (
                <CommentRow
                  key={comment.id}
                  comment={comment}
                  currentUserId={user?.id}
                  canInteract={!!user}
                  isEditing={editingCommentId === comment.id}
                  editText={editingCommentId === comment.id ? editText : undefined}
                  onEditTextChange={setEditText}
                  onSaveEdit={handleSaveEdit}
                  onCancelEdit={handleCancelEdit}
                  editSaving={updateCommentMutation.isPending}
                  likeLoading={likePendingId === comment.id}
                  onLike={() => void handleLikeComment(comment)}
                  onOpenLikes={() => openCommentLikes(comment.id, comment.likeCount)}
                  onStartEdit={() => handleStartEdit(comment)}
                  onDelete={() => void handleDeleteComment(comment.id)}
                />
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
                disabled={addCommentMutation.isPending}
              />
              <button
                type="submit"
                className="comment-compose-send"
                disabled={!commentText.trim() || addCommentMutation.isPending}
                aria-label="Send comment"
              >
                {addCommentMutation.isPending ? '…' : '↑'}
              </button>
            </form>
          )}
          {sendError && <p className="admin-error">{sendError}</p>}
        </section>
      )}

      <Popup open={kudosOpen} onClose={() => setKudosOpen(false)} title="Kudos">
        {kudosQuery.isLoading && <p className="popup-status">Loading…</p>}
        {kudosError && <p className="admin-error">{kudosError}</p>}
        {kudosQuery.isSuccess && kudos.length === 0 && (
          <p className="popup-status">No kudos yet.</p>
        )}
        {kudosQuery.isSuccess && kudos.length > 0 && (
          <ul className="kudos-list">
            {kudos.map((kudosUser) => (
              <li key={`${kudosUser.id}-${kudosUser.createdAt}`} className="kudos-row">
                <UserLink
                  userId={kudosUser.id}
                  username={kudosUser.username}
                  avatarUrl={kudosUser.avatarUrl}
                  userRoles={kudosUser.userRoles}
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

      <Popup open={!!commentLikesId} onClose={() => setCommentLikesId(null)} title="Likes">
        {commentLikesQuery.isLoading && <p className="popup-status">Loading…</p>}
        {commentLikesError && <p className="admin-error">{commentLikesError}</p>}
        {commentLikesQuery.isSuccess && commentLikes.length === 0 && (
          <p className="popup-status">No likes yet.</p>
        )}
        {commentLikesQuery.isSuccess && commentLikes.length > 0 && (
          <ul className="kudos-list">
            {commentLikes.map((likeUser) => (
              <li key={`${likeUser.id}-${likeUser.createdAt}`} className="kudos-row">
                <UserLink
                  userId={likeUser.id}
                  username={likeUser.username}
                  avatarUrl={likeUser.avatarUrl}
                  userRoles={likeUser.userRoles}
                  showAvatar
                />
                <span className="kudos-row-meta">
                  liked {timeAgo(likeUser.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Popup>
    </div>
  );
}
