import { useProfile } from './useProfile';

/** Streak data for a user, derived from the profile query cache. */
export function useStreak(userId?: string) {
  const { data: profile, isLoading, error } = useProfile(userId ?? null);

  return {
    data: userId
      ? {
          currentStreak: profile?.streak ?? 0,
          longestStreak: profile?.longestStreak ?? 0,
        }
      : undefined,
    isLoading,
    error,
  };
}
