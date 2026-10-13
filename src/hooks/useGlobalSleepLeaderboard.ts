import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  fetchGlobalSleepLeaderboard,
  type GlobalLeaderboardPeriod,
} from '../lib/globalLeaderboard';
import { queryKeys } from './queryKeys';

export function useGlobalSleepLeaderboard(
  enabled = true,
  period: GlobalLeaderboardPeriod = 'all_time',
  clubId: string | null = null,
) {
  return useQuery({
    queryKey: queryKeys.globalSleepLeaderboard(period, clubId),
    queryFn: () => fetchGlobalSleepLeaderboard({ period, limit: 10, clubId }),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
    enabled,
  });
}
