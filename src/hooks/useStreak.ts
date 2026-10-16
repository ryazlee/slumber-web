import { useQuery } from '@tanstack/react-query';
import { fetchCurrentStreak } from '../lib/currentStreaks';

/** Current streak for any user via get_current_streaks (streaks RLS is select-own). */
export function useStreak(userId?: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['current-streak', userId],
    queryFn: () => fetchCurrentStreak(userId!),
    enabled: !!userId,
    staleTime: 5 * 60_000,
  });

  return {
    data: userId
      ? {
          currentStreak: data ?? 0,
          longestStreak: 0,
        }
      : undefined,
    isLoading: !!userId && isLoading,
    error,
  };
}
