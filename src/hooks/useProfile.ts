import { useQuery } from '@tanstack/react-query';
import { isRecentlyCreatedAccount } from '../lib/freshAccount';
import { fetchProfileSummary } from '../lib/profile';
import { queryKeys } from './queryKeys';

/** Matches `queryClient` default. Just-created accounts override this with 0. */
const ESTABLISHED_PROFILE_STALE_MS = 60_000;

export function useProfile(userId: string | null) {
  return useQuery({
    queryKey: queryKeys.profile(userId ?? ''),
    queryFn: () => fetchProfileSummary(userId!),
    enabled: !!userId,
    staleTime: (query) => (
      isRecentlyCreatedAccount(query.state.data?.joinedAt)
        ? 0
        : ESTABLISHED_PROFILE_STALE_MS
    ),
  });
}
