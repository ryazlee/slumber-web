import { useQuery } from '@tanstack/react-query';
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
