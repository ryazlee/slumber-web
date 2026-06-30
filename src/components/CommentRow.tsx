import { useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import Avatar from './Avatar';
import CommentContextMenu from './CommentContextMenu';
import { timeAgo } from '../lib/format';
import type { Comment } from '../lib/types';
import MentionText from './MentionText';
import ReactionHeart from './ReactionHeart';
import { useLongPress } from '../hooks/useLongPress';

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
  onReply?: () => void;
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
  onReply,
  onStartEdit,
  onDelete,
}: CommentRowProps) {
  const profilePath = `/profile/${comment.userId}`;
  const isOwnComment = !!currentUserId && comment.userId === currentUserId;
  const showLikeRail = canInteract && !isEditing && !!onLike;
  const showMenu = canInteract && !isEditing && !!(onLike || onReply || (isOwnComment && (onStartEdit || onDelete)));

  const menuBtnRef = useRef<HTMLButtonElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const openLikes = () => {
    if (comment.likeCount > 0) onOpenLikes?.();
  };

  const likeLongPress = useLongPress(openLikes, {
    disabled: !onOpenLikes || comment.likeCount <= 0 || likeLoading,
  });

  const handleSave = (e?: FormEvent) => {
    e?.preventDefault();
    onSaveEdit?.();
  };

  const toggleMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuOpen((open) => !open);
  };

  return (
    <li className="comment-row">
      <Link to={profilePath} className="comment-row-avatar" aria-label={`@${comment.username}`}>
        <Avatar
          userId={comment.userId}
          username={comment.username}
          avatarUrl={comment.avatarUrl}
          userRoles={comment.userRoles}
          size="compact"
        />
      </Link>

      <div className="comment-bubble">
        <div className="comment-header">
          <div className="comment-header-main">
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
          {showMenu && (
            <button
              ref={menuBtnRef}
              type="button"
              className="comment-menu-btn"
              onClick={toggleMenu}
              aria-label="Comment options"
              aria-expanded={menuOpen}
              aria-haspopup="menu"
            >
              ⋯
            </button>
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
            onClick={likeLongPress.wrapClick(() => onLike?.())}
            {...likeLongPress.longPressProps}
            disabled={likeLoading}
            aria-label={comment.hasLiked ? 'Unlike comment' : 'Like comment'}
            aria-pressed={comment.hasLiked}
          >
            <ReactionHeart liked={comment.hasLiked} size="sm" />
          </button>
          {comment.likeCount > 0 && (
            <button
              type="button"
              className={`comment-like-count${comment.hasLiked ? ' comment-like-count--active' : ''}`}
              onClick={onOpenLikes}
              {...likeLongPress.longPressProps}
              disabled={!onOpenLikes}
              aria-label={`${comment.likeCount} likes`}
            >
              {comment.likeCount}
            </button>
          )}
        </div>
      )}

      <CommentContextMenu
        open={menuOpen}
        anchorRef={menuBtnRef}
        isOwnComment={isOwnComment}
        hasLiked={comment.hasLiked}
        onClose={() => setMenuOpen(false)}
        onLike={() => onLike?.()}
        onReply={onReply}
        onEdit={isOwnComment ? onStartEdit : undefined}
        onDelete={isOwnComment ? onDelete : undefined}
      />
    </li>
  );
}
