import { useQuery } from '@tanstack/react-query';
import { fetchDreamSleepAnalytics } from '../lib/dreamSleep';
import { fetchLifetimeStats, fetchUserStats } from '../lib/stats';
import { queryKeys } from './queryKeys';

export function useUserStats(userId: string | null) {
  return useQuery({
    queryKey: queryKeys.userStats(userId ?? ''),
    queryFn: () => fetchUserStats(userId!),
    staleTime: 5 * 60_000,
    enabled: !!userId,
  });
}

export function useLifetimeStats(userId: string | null) {
  return useQuery({
    queryKey: queryKeys.lifetimeStats(userId ?? ''),
    queryFn: () => fetchLifetimeStats(userId!),
    staleTime: 5 * 60_000,
    enabled: !!userId,
  });
}

export function useDreamSleepAnalytics(userId: string | null, enabled = true) {
  return useQuery({
    queryKey: queryKeys.dreamAnalytics(userId ?? ''),
    queryFn: () => fetchDreamSleepAnalytics(userId!),
    staleTime: 5 * 60_000,
    enabled: !!userId && enabled,
  });
}
