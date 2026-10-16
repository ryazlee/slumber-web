import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import {
  fetchBoardUnreadBadgeCounts,
  markBoardMessagesRead,
  type BoardUnreadBadgeCounts,
} from '../lib/boardMessages';
import type { BoardEntityType } from '../lib/types';
import { queryKeys } from './queryKeys';

const EMPTY: BoardUnreadBadgeCounts = { challengeCount: 0, clubCount: 0 };
const BADGE_REFRESH_MS = 5 * 60_000;

/** Challenge + club boards with unread messages (entity counts, not message totals). */
export function useBoardUnreadBadges(enabled = true) {
  const { user } = useAuth();
  const wanted = enabled && !!user?.id;

  const query = useQuery({
    queryKey: queryKeys.boardUnreadBadges,
    queryFn: fetchBoardUnreadBadgeCounts,
    enabled: wanted,
    staleTime: 60_000,
    refetchInterval: wanted ? BADGE_REFRESH_MS : false,
  });

  const data = query.data ?? EMPTY;
  return {
    challengeBoardUnread: data.challengeCount,
    clubBoardUnread: data.clubCount,
    isLoading: query.isLoading,
  };
}

/** Mark a board read (upsert cursor + dismiss board_message inbox rows). */
export function useMarkBoardMessagesRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      entityType,
      entityId,
    }: {
      entityType: BoardEntityType;
      entityId: string;
    }) => markBoardMessagesRead(entityType, entityId),
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.boardUnreadBadges });
    },
  });
}
