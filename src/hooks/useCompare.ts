import { useQueries, useQuery } from '@tanstack/react-query';
import { fetchComparePeriods } from '../lib/compareStats';
import { queryKeys } from './queryKeys';

export function useComparePeriods(userId: string | null) {
  return useQuery({
    queryKey: queryKeys.comparePeriods(userId ?? ''),
    queryFn: () => fetchComparePeriods(userId!),
    staleTime: 5 * 60_000,
    enabled: !!userId,
  });
}

export function useComparePeriodsBatch(userIds: string[]) {
  return useQueries({
    queries: userIds.map((userId) => ({
      queryKey: queryKeys.comparePeriods(userId),
      queryFn: () => fetchComparePeriods(userId),
      staleTime: 5 * 60_000,
      enabled: !!userId,
    })),
  });
}
