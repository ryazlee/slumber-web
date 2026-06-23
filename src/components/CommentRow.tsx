import { useCallback, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import Avatar from './Avatar';
import CommentContextMenu from './CommentContextMenu';
import { timeAgo } from '../lib/format';
import type { Comment } from '../lib/types';
import MentionText from './MentionText';

type CommentRowProps = {
  comment: Comment;
  currentUserId?: string | null;
  canInteract?: boolean;
  isEditing?: boolean;
  editText?: string;
  onEditTextChange?: (text: string) => void;
  onSaveEdit?: () => void;
  onCancelEdit?: () => void;
  editSaving?: boolean;
  likeLoading?: boolean;
  onLike?: () => void;
  onOpenLikes?: () => void;
  onStartEdit?: () => void;
  onDelete?: () => void;
};

export default function CommentRow({
  comment,
  currentUserId,
  canInteract = false,
  isEditing = false,
  editText = '',
  onEditTextChange,
  onSaveEdit,
  onCancelEdit,
  editSaving = false,
  likeLoading = false,
  onLike,
  onOpenLikes,
  onStartEdit,
  onDelete,
}: CommentRowProps) {
  const profilePath = `/profile/${comment.userId}`;
  const isOwnComment = !!currentUserId && comment.userId === currentUserId;
  const showLikeRail = canInteract && !isEditing && !!onLike;
  const showMenu = canInteract && !isEditing && !!(onLike || (isOwnComment && (onStartEdit || onDelete)));

  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openMenuAt = useCallback((clientX: number, clientY: number) => {
    if (!showMenu) return;
    setMenu({ x: clientX, y: clientY });
  }, [showMenu]);

  const handleContextMenu = (e: React.MouseEvent) => {
    if (!showMenu) return;
    e.preventDefault();
    openMenuAt(e.clientX, e.clientY);
  };

  const clearLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!showMenu || e.button !== 0) return;
    clearLongPress();
    longPressTimer.current = setTimeout(() => {
      openMenuAt(e.clientX, e.clientY);
    }, 400);
  };

  const handleSave = (e?: FormEvent) => {
    e?.preventDefault();
    onSaveEdit?.();
  };

  return (
    <li className="comment-row">
      <Link to={profilePath} className="comment-row-avatar" aria-label={`@${comment.username}`}>
        <Avatar
          userId={comment.userId}
          username={comment.username}
          avatarUrl={comment.avatarUrl}
          userRoles={comment.userRoles}
          size="sm"
        />
      </Link>

      <div
        className="comment-bubble"
        onContextMenu={handleContextMenu}
        onPointerDown={handlePointerDown}
        onPointerUp={clearLongPress}
        onPointerLeave={clearLongPress}
        onPointerCancel={clearLongPress}
      >
        <div className="comment-header">
          <Link to={profilePath} className="comment-author">
            @{comment.username}
          </Link>
          {!isEditing && (
            <time className="comment-time" dateTime={comment.createdAt}>
              {comment.isEdited ? ' · Edited · ' : ' · '}
              {timeAgo(comment.createdAt)}
            </time>
          )}
        </div>

        {isEditing ? (
          <form className="comment-edit" onSubmit={handleSave}>
            <textarea
              className="comment-edit-input"
              value={editText}
              onChange={(e) => onEditTextChange?.(e.target.value)}
              maxLength={300}
              rows={2}
              disabled={editSaving}
              autoFocus
            />
            <div className="comment-edit-actions">
              <button type="button" className="comment-edit-cancel" onClick={onCancelEdit} disabled={editSaving}>
                Cancel
              </button>
              <button
                type="submit"
                className="comment-edit-save"
                disabled={editSaving || !editText.trim()}
              >
                {editSaving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>
        ) : (
          <MentionText className="comment-text">{comment.text}</MentionText>
        )}
      </div>

      {showLikeRail && (
        <div className="comment-like-rail">
          <button
            type="button"
            className={`comment-like-btn${comment.hasLiked ? ' comment-like-btn--active' : ''}`}
            onClick={onLike}
            disabled={likeLoading}
            aria-label={comment.hasLiked ? 'Unlike comment' : 'Like comment'}
            aria-pressed={comment.hasLiked}
          >
            {comment.hasLiked ? '🫶' : '🤍'}
          </button>
          {comment.likeCount > 0 && (
            <button
              type="button"
              className={`comment-like-count${comment.hasLiked ? ' comment-like-count--active' : ''}`}
              onClick={onOpenLikes}
              aria-label={`${comment.likeCount} likes`}
            >
              {comment.likeCount}
            </button>
          )}
        </div>
      )}

      <CommentContextMenu
        open={!!menu}
        x={menu?.x ?? 0}
        y={menu?.y ?? 0}
        isOwnComment={isOwnComment}
        hasLiked={comment.hasLiked}
        onClose={() => setMenu(null)}
        onLike={() => onLike?.()}
        onEdit={isOwnComment ? onStartEdit : undefined}
        onDelete={isOwnComment ? onDelete : undefined}
      />
    </li>
  );
}
