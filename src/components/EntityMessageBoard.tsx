import { useRef, useState, type FormEvent } from 'react';
import {
  boardMessageAsComment,
  useBoardMessages,
  type BoardMentionUser,
} from '../hooks/useBoardMessages';
import { useMentionProfilePress } from '../hooks/useMentionProfilePress';
import { WEB_COMMENT_INPUT_MAX_LINES } from '../lib/commentInputGrow';
import type { BoardEntityType, BoardMessage } from '../lib/types';
import CommentRow from './CommentRow';
import CommentsLoadingState from './CommentsLoadingState';
import GrowingTextarea from './GrowingTextarea';

type Props = {
  entityType: BoardEntityType;
  entityId: string;
  currentUserId: string;
  mentionUsers: BoardMentionUser[];
  /** Accepted participant/member — compose + reply. */
  canCompose: boolean;
  title?: string;
  defaultOpen?: boolean;
};

/**
 * Collapsible flat message board for a challenge or club (web).
 * Comments-style ascending list; opening marks the board read.
 */
export default function EntityMessageBoard({
  entityType,
  entityId,
  currentUserId,
  mentionUsers,
  canCompose,
  title = 'Message board',
  defaultOpen = false,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const composeRef = useRef<HTMLTextAreaElement>(null);
  const handleMentionPress = useMentionProfilePress();
  const boardEnabled = open;

  const {
    messages,
    messageCount,
    messagesLoaded,
    messagesLoading,
    hasEarlier,
    loadingEarlier,
    draftText,
    setDraftText,
    sending,
    editingId,
    editingText,
    setEditingText,
    editSaving,
    actionError,
    loadEarlier,
    handleSend,
    startEdit,
    cancelEdit,
    startReply,
    handleUpdate,
    handleDelete,
  } = useBoardMessages({
    entityType,
    entityId,
    mentionUsers,
    enabled: boardEnabled,
    canCompose,
    markReadWhenEnabled: boardEnabled,
  });

  const onReply = (message: BoardMessage) => {
    if (!startReply(message)) return;
    window.setTimeout(() => composeRef.current?.focus(), 50);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await handleSend();
  };

  const countLabel = messagesLoaded && typeof messageCount === 'number'
    ? ` (${messageCount})`
    : '';

  return (
    <details
      className="stats-collapse entity-message-board"
      open={open}
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary className="stats-section-label stats-collapse-summary">
        {title}{countLabel}
      </summary>
      {open ? (
        <div className="stats-collapse-body entity-message-board-body">
          {messagesLoading ? (
            <CommentsLoadingState />
          ) : (
            <>
              {messagesLoaded && messages.length === 0 && (
                <p className="post-comments-status">
                  {canCompose ? 'No messages yet. Be the first!' : 'No messages yet.'}
                </p>
              )}
              {hasEarlier && (
                <button
                  type="button"
                  className="entity-message-board-earlier"
                  onClick={() => { void loadEarlier(); }}
                  disabled={loadingEarlier}
                >
                  {loadingEarlier ? 'Loading…' : 'Show earlier messages'}
                </button>
              )}
              {messages.length > 0 && (
                <ul className="comment-thread">
                  {messages.map((m) => {
                    const row = boardMessageAsComment(m);
                    const isOwn = m.userId === currentUserId;
                    return (
                      <CommentRow
                        key={m.id}
                        comment={row}
                        currentUserId={currentUserId}
                        canInteract={canCompose && !m.pending}
                        isEditing={editingId === m.id}
                        editText={editingId === m.id ? editingText : undefined}
                        onEditTextChange={setEditingText}
                        onSaveEdit={() => { void handleUpdate(); }}
                        onCancelEdit={cancelEdit}
                        editSaving={editSaving}
                        onReply={canCompose ? () => onReply(m) : undefined}
                        onStartEdit={isOwn ? () => startEdit(m) : undefined}
                        onDelete={isOwn ? () => { void handleDelete(m.id); } : undefined}
                        onMentionPress={handleMentionPress}
                      />
                    );
                  })}
                </ul>
              )}
            </>
          )}

          {canCompose && (
            <form className="comment-compose" onSubmit={(e) => { void onSubmit(e); }}>
              <GrowingTextarea
                ref={composeRef}
                className="comment-compose-input"
                placeholder="Write a message…"
                value={draftText}
                onChange={(e) => setDraftText(e.target.value)}
                maxLength={300}
                maxLines={WEB_COMMENT_INPUT_MAX_LINES}
                rows={1}
                disabled={sending || messagesLoading}
              />
              <button
                type="submit"
                className="comment-compose-send"
                disabled={!draftText.trim() || sending || messagesLoading}
                aria-label="Send message"
              >
                {sending ? '…' : '↑'}
              </button>
            </form>
          )}
          {actionError && <p className="inline-error">{actionError}</p>}
        </div>
      ) : null}
    </details>
  );
}
