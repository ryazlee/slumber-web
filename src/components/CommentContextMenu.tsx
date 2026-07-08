import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

type CommentContextMenuProps = {
  open: boolean;
  anchorRef: React.RefObject<HTMLElement | null>;
  fallbackAnchorRef?: React.RefObject<HTMLElement | null>;
  isOwnComment: boolean;
  hasLiked: boolean;
  onClose: () => void;
  onLike: () => void;
  onReply?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
};

export default function CommentContextMenu({
  open,
  anchorRef,
  fallbackAnchorRef,
  isOwnComment,
  hasLiked,
  onClose,
  onLike,
  onReply,
  onEdit,
  onDelete,
}: CommentContextMenuProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  useLayoutEffect(() => {
    if (!open) {
      setPosition(null);
      return;
    }
    const anchor = anchorRef.current ?? fallbackAnchorRef?.current;
    if (!anchor) {
      setPosition(null);
      return;
    }
    const rect = anchor.getBoundingClientRect();
    setPosition({
      top: rect.bottom + 4,
      left: rect.right,
    });
  }, [open, anchorRef, fallbackAnchorRef]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const onPointer = (e: PointerEvent) => {
      const target = e.target as Node;
      if (panelRef.current?.contains(target)) return;
      if (anchorRef.current?.contains(target)) return;
      if (fallbackAnchorRef?.current?.contains(target)) return;
      onClose();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [open, onClose, anchorRef, fallbackAnchorRef]);

  if (!open || !position) return null;

  const run = (fn: () => void) => {
    onClose();
    fn();
  };

  return createPortal(
    <div
      ref={panelRef}
      className="comment-context-menu comment-context-menu--anchored"
      style={{ top: position.top, left: position.left }}
      role="menu"
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <button type="button" className="comment-context-menu-item" role="menuitem" onClick={() => run(onLike)}>
        {hasLiked ? 'Unlike' : 'Like'}
      </button>
      {onReply && (
        <button type="button" className="comment-context-menu-item" role="menuitem" onClick={() => run(onReply)}>
          Reply
        </button>
      )}
      {isOwnComment && onEdit && (
        <button type="button" className="comment-context-menu-item" role="menuitem" onClick={() => run(onEdit)}>
          Edit
        </button>
      )}
      {isOwnComment && onDelete && (
        <button
          type="button"
          className="comment-context-menu-item comment-context-menu-item--destructive"
          role="menuitem"
          onClick={() => run(onDelete)}
        >
          Delete
        </button>
      )}
    </div>,
    document.body,
  );
}
