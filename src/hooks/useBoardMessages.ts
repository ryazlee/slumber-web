import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import {
  addBoardMessage,
  BOARD_MESSAGE_PAGE_SIZE,
  deleteBoardMessage,
  fetchBoardMessageCount,
  fetchBoardMessagesPage,
  toggleBoardMessageLike,
  updateBoardMessage,
  type BoardMessageCursor,
} from '../lib/boardMessages';
import { flattenInfinitePages } from '../lib/infiniteQuery';
import { buildCommentReplyPrefix } from '../lib/mentions';
import type { BoardEntityType, BoardMessage, Comment } from '../lib/types';
import { useMarkBoardMessagesRead } from './useBoardUnreadBadges';
import { useProfile } from './useProfile';
import { queryKeys } from './queryKeys';

export type BoardMentionUser = {
  id: string;
  username: string;
};

type Params = {
  entityType: BoardEntityType;
  entityId?: string | null;
  mentionUsers: BoardMentionUser[];
  enabled?: boolean;
  canCompose?: boolean;
  markReadWhenEnabled?: boolean;
};

/** Adapt BoardMessage → Comment so CommentRow stays shared. */
export function boardMessageAsComment(m: BoardMessage): Comment {
  return {
    id: m.id,
    postId: '',
    userId: m.userId,
    username: m.username,
    avatarUrl: m.avatarUrl,
    userRoles: m.userRoles,
    text: m.text,
    createdAt: m.createdAt,
    likeCount: m.likeCount ?? 0,
    hasLiked: m.hasLiked ?? false,
    isEdited: !!m.isEdited,
    pending: m.pending,
  };
}

function buildOptimistic(
  entityType: BoardEntityType,
  entityId: string,
  userId: string,
  text: string,
  profile: { username: string; avatarUrl?: string; userRoles?: string[] } | undefined,
): BoardMessage {
  return {
    id: `pending-${Date.now()}`,
    entityType,
    entityId,
    userId,
    username: profile?.username ?? 'you',
    avatarUrl: profile?.avatarUrl,
    userRoles: profile?.userRoles,
    text,
    createdAt: new Date().toISOString(),
    likeCount: 0,
    hasLiked: false,
    pending: true,
  };
}

function patchInList(
  messages: BoardMessage[],
  messageId: string,
  patch: Partial<BoardMessage>,
): BoardMessage[] {
  return messages.map((item) => (item.id === messageId ? { ...item, ...patch } : item));
}

function flattenBoardPages(
  data: InfiniteData<BoardMessage[]> | undefined,
): BoardMessage[] {
  if (!data?.pages.length) return [];
  return flattenInfinitePages({
    ...data,
    pages: [...data.pages].reverse(),
  }).map((item) => ({
    ...item,
    likeCount: item.likeCount ?? 0,
    hasLiked: item.hasLiked ?? false,
  }));
}

function boardNextPageParam(
  lastPage: BoardMessage[],
): BoardMessageCursor | undefined {
  if (lastPage.length < BOARD_MESSAGE_PAGE_SIZE) return undefined;
  const oldest = lastPage[0];
  if (!oldest) return undefined;
  return { createdAt: oldest.createdAt, id: oldest.id };
}

/**
 * Flat entity message board (challenge / club). Reply autofills @username.
 */
export function useBoardMessages({
  entityType,
  entityId,
  mentionUsers,
  enabled = true,
  canCompose = false,
  markReadWhenEnabled = false,
}: Params) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const wanted = enabled && !!entityId;
  const { data: ownProfile } = useProfile(canCompose && wanted ? (user?.id ?? null) : null);
  const { mutate: markRead } = useMarkBoardMessagesRead();

  const [draftText, setDraftText] = useState('');
  const [sending, setSending] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [messageLikeLoadingId, setMessageLikeLoadingId] = useState<string | null>(null);
  const likeInFlightRef = useRef(new Set<string>());
  const markedReadForRef = useRef<string | null>(null);

  const mentionFriends = useMemo(
    () => mentionUsers.filter((u) => u.id !== user?.id),
    [mentionUsers, user?.id],
  );

  const cacheKey = entityId
    ? queryKeys.boardMessages(entityType, entityId)
    : queryKeys.boardMessages(entityType, '');

  const setCache = useCallback((
    updater: BoardMessage[] | ((prev: BoardMessage[]) => BoardMessage[]),
  ) => {
    if (!entityId) return;
    qc.setQueryData<InfiniteData<BoardMessage[]>>(
      queryKeys.boardMessages(entityType, entityId),
      (prev) => {
        const flat = flattenBoardPages(prev);
        const next = typeof updater === 'function' ? updater(flat) : updater;
        return {
          pages: [next],
          pageParams: [undefined],
        };
      },
    );
  }, [entityType, entityId, qc]);

  const messagesQuery = useInfiniteQuery({
    queryKey: cacheKey,
    queryFn: ({ pageParam }: { pageParam: BoardMessageCursor | undefined }) =>
      fetchBoardMessagesPage(
        entityType,
        entityId!,
        pageParam ?? null,
        BOARD_MESSAGE_PAGE_SIZE,
      ),
    initialPageParam: undefined as BoardMessageCursor | undefined,
    getNextPageParam: boardNextPageParam,
    staleTime: 60_000,
    enabled: wanted,
    retry: 1,
  });

  const countQuery = useQuery({
    queryKey: entityId
      ? queryKeys.boardMessageCount(entityType, entityId)
      : queryKeys.boardMessageCount(entityType, ''),
    queryFn: () => fetchBoardMessageCount(entityType, entityId!),
    staleTime: 60_000,
    enabled: wanted,
    retry: 1,
  });

  const messages = useMemo(
    () => flattenBoardPages(messagesQuery.data),
    [messagesQuery.data],
  );
  const messageCount = countQuery.data ?? (messagesQuery.isSuccess ? messages.length : undefined);
  const messagesLoaded = messagesQuery.isSuccess;
  const messagesLoading = wanted && messagesQuery.isFetching && !messagesQuery.isSuccess;
  const hasEarlier = messagesQuery.hasNextPage ?? false;
  const loadingEarlier = messagesQuery.isFetchingNextPage;

  useEffect(() => {
    if (!entityId) return;
    setDraftText('');
    setEditingId(null);
    setEditingText('');
    setActionError(null);
    markedReadForRef.current = null;
  }, [entityType, entityId]);

  useEffect(() => {
    if (!markReadWhenEnabled || !wanted || !entityId) return;
    const key = `${entityType}:${entityId}`;
    if (markedReadForRef.current === key) return;
    markedReadForRef.current = key;
    markRead({ entityType, entityId });
  }, [markReadWhenEnabled, wanted, entityType, entityId, markRead]);

  const fetchNextPage = messagesQuery.fetchNextPage;
  const refetchMessages = messagesQuery.refetch;
  const refetchCount = countQuery.refetch;

  const loadMessages = useCallback(async () => {
    if (!entityId) return;
    try {
      await refetchMessages();
      void refetchCount();
    } catch {
      setActionError('Could not load messages.');
    }
  }, [entityId, refetchMessages, refetchCount]);

  const loadEarlier = useCallback(async () => {
    if (!hasEarlier || loadingEarlier) return;
    try {
      await fetchNextPage();
    } catch {
      setActionError('Could not load earlier messages.');
    }
  }, [hasEarlier, loadingEarlier, fetchNextPage]);

  const handleSend = useCallback(async () => {
    if (!entityId || !canCompose || !draftText.trim() || sending || !user) return false;

    const trimmed = draftText.trim();
    const optimistic = buildOptimistic(
      entityType,
      entityId,
      user.id,
      trimmed,
      ownProfile ?? undefined,
    );

    setDraftText('');
    setActionError(null);
    setCache((prev) => [...prev, optimistic]);
    setSending(true);
    try {
      const created = await addBoardMessage(entityType, entityId, trimmed);
      setCache((prev) => prev.map((item) => (item.id === optimistic.id ? created : item)));
      qc.setQueryData<number>(
        queryKeys.boardMessageCount(entityType, entityId),
        (prev) => (typeof prev === 'number' ? prev + 1 : prev),
      );
      markRead({ entityType, entityId });
      return true;
    } catch {
      setCache((prev) => prev.filter((item) => item.id !== optimistic.id));
      setDraftText(trimmed);
      setActionError('Could not post message. Please try again.');
      return false;
    } finally {
      setSending(false);
    }
  }, [entityType, entityId, canCompose, draftText, sending, user, ownProfile, setCache, qc, markRead]);

  const startEdit = useCallback((message: BoardMessage) => {
    setEditingId(message.id);
    setEditingText(message.text);
    setActionError(null);
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setEditingText('');
  }, []);

  const startReply = useCallback((message: BoardMessage) => {
    if (!user || !canCompose || message.pending) return false;
    setEditingId(null);
    setEditingText('');
    setDraftText(buildCommentReplyPrefix(message.username));
    return true;
  }, [user, canCompose]);

  const handleUpdate = useCallback(async () => {
    if (!editingId || !editingText.trim() || editSaving) return false;

    const trimmed = editingText.trim();
    const previous = messages.find((m) => m.id === editingId);
    if (!previous || previous.text === trimmed) {
      cancelEdit();
      return true;
    }

    setEditSaving(true);
    setActionError(null);
    setCache((prev) => patchInList(prev, editingId, { text: trimmed, isEdited: true }));
    try {
      const updated = await updateBoardMessage(editingId, trimmed);
      setCache((prev) => prev.map((item) => (
        item.id === editingId
          ? { ...updated, likeCount: item.likeCount, hasLiked: item.hasLiked }
          : item
      )));
      cancelEdit();
      return true;
    } catch {
      if (previous) {
        setCache((prev) => prev.map((item) => (item.id === editingId ? previous : item)));
      }
      setActionError('Could not update message. Please try again.');
      return false;
    } finally {
      setEditSaving(false);
    }
  }, [editingId, editingText, editSaving, messages, cancelEdit, setCache]);

  const handleDelete = useCallback(async (messageId: string) => {
    if (!window.confirm('Delete this message?')) return;
    const previous = messages;
    setCache((prev) => prev.filter((item) => item.id !== messageId));
    if (editingId === messageId) cancelEdit();
    setActionError(null);
    try {
      await deleteBoardMessage(messageId);
      if (entityId) {
        qc.setQueryData<number>(
          queryKeys.boardMessageCount(entityType, entityId),
          (prev) => (typeof prev === 'number' ? Math.max(0, prev - 1) : prev),
        );
      }
    } catch {
      setCache(previous);
      setActionError('Could not delete message. Please try again.');
    }
  }, [messages, editingId, cancelEdit, setCache, entityType, entityId, qc]);

  const handleLike = useCallback(async (
    message: BoardMessage,
    mode: 'toggle' | 'like' = 'toggle',
  ) => {
    if (!user || message.pending || likeInFlightRef.current.has(message.id)) return;

    const likeCount = message.likeCount ?? 0;
    const hasLiked = message.hasLiked ?? false;
    if (mode === 'like' && hasLiked) return;
    const nextHasLiked = !hasLiked;
    const optimisticCount = hasLiked ? Math.max(0, likeCount - 1) : likeCount + 1;

    likeInFlightRef.current.add(message.id);
    setMessageLikeLoadingId(message.id);
    setCache((prev) => patchInList(prev, message.id, {
      hasLiked: nextHasLiked,
      likeCount: optimisticCount,
    }));

    try {
      const res = await toggleBoardMessageLike(message.id, likeCount, hasLiked);
      setCache((prev) => patchInList(prev, message.id, {
        hasLiked: res.hasLiked,
        likeCount: res.likeCount,
      }));
    } catch {
      setCache((prev) => patchInList(prev, message.id, {
        hasLiked,
        likeCount,
      }));
      setActionError('Could not update like. Please try again.');
    } finally {
      likeInFlightRef.current.delete(message.id);
      setMessageLikeLoadingId(null);
    }
  }, [user, setCache]);

  return {
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
    messageLikeLoadingId,
    mentionFriends,
    loadMessages,
    loadEarlier,
    handleSend,
    startEdit,
    cancelEdit,
    startReply,
    handleUpdate,
    handleDelete,
    handleLike,
  };
}
