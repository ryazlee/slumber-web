import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useComparePeriods, useComparePeriodsBatch } from './useCompare';
import { useFriends } from './useSocial';
import {
  MIN_SLEEP_COMPAT_NIGHTS,
  rankSleepCompatibility,
  scoreSleepCompatibility,
  type SleepCompatibilityRanking,
  type SleepCompatibilityScore,
} from '../lib/sleepCompatibility';
import type { PeriodStats } from '../lib/compareStats';

function habitsFromPeriod(period: PeriodStats) {
  if (!period) return null;
  return period;
}

export function useSleepCompatibilityRankings(enabled: boolean) {
  const { user } = useAuth();
  const selfId = enabled ? user?.id ?? null : null;
  const friendsQuery = useFriends();
  const friends = Array.isArray(friendsQuery.data) ? friendsQuery.data : [];
  const selfQuery = useComparePeriods(selfId);
  const selfHabits = habitsFromPeriod(selfQuery.data?.month ?? null);
  const selfReady = (selfHabits?.postsCount ?? 0) >= MIN_SLEEP_COMPAT_NIGHTS;
  const friendIds = useMemo(
    () => (selfReady ? friends.map((friend) => friend.id).filter(Boolean).slice(0, 40) : []),
    [friends, selfReady],
  );
  const friendQueries = useComparePeriodsBatch(friendIds, !!selfId && selfReady);

  const friendsPending = friendQueries.some((query) => query.isLoading);
  const rankings: SleepCompatibilityRanking[] = useMemo(() => {
    if (!selfHabits || !selfReady || friendsPending) return [];
    try {
      return rankSleepCompatibility(
        selfHabits,
        friends.map((friend, index) => ({
          id: friend.id,
          username: friend.username ?? '',
          habits: habitsFromPeriod(friendQueries[index]?.data?.month ?? null),
        })),
      );
    } catch {
      return [];
    }
  }, [selfHabits, selfReady, friends, friendQueries, friendsPending]);

  const loading = !!selfId && (
    selfQuery.isLoading
    || friendsQuery.isLoading
    || (selfReady && friendsPending)
  );

  return {
    rankings,
    selfReady,
    loading,
    hasFriends: friends.length > 0,
  };
}

export function useFriendSleepCompatibility(friendId: string | null, enabled: boolean) {
  const { user } = useAuth();
  const selfId = enabled ? user?.id ?? null : null;
  const selfQuery = useComparePeriods(selfId);
  const friendQuery = useComparePeriods(enabled ? friendId : null);

  const result: SleepCompatibilityScore | null = useMemo(() => {
    const selfHabits = habitsFromPeriod(selfQuery.data?.month ?? null);
    const friendHabits = habitsFromPeriod(friendQuery.data?.month ?? null);
    if (!selfHabits || !friendHabits) return null;
    try {
      return scoreSleepCompatibility(selfHabits, friendHabits);
    } catch {
      return null;
    }
  }, [selfQuery.data?.month, friendQuery.data?.month]);

  return {
    result,
    loading: enabled && (selfQuery.isLoading || friendQuery.isLoading),
  };
}
