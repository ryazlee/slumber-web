import { useQueries, useQuery } from '@tanstack/react-query';
import { fetchChallenge, fetchChallengeContributions, fetchChallengeProgress, fetchChallenges } from '../lib/challenges';
import type { ChallengeProgress } from '../lib/types';
import { queryKeys } from './queryKeys';

const ACTIVE_STATUSES = ['active', 'pending', 'pending_completion'] as const;
const COMPLETED_STATUSES = ['completed'] as const;

export function useActiveChallenges() {
  return useQuery({
    queryKey: queryKeys.challenges(ACTIVE_STATUSES.join(',')),
    queryFn: () => fetchChallenges([...ACTIVE_STATUSES]),
  });
}

export function useCompletedChallenges() {
  return useQuery({
    queryKey: queryKeys.challenges(COMPLETED_STATUSES.join(',')),
    queryFn: () => fetchChallenges([...COMPLETED_STATUSES]),
  });
}

/** Progress for the race cards on the list. Missing ids stay undefined while they load. */
export function useChallengeProgressMap(ids: string[]) {
  const results = useQueries({
    queries: ids.map((id) => ({
      queryKey: queryKeys.challengeProgress(id),
      queryFn: () => fetchChallengeProgress(id),
      staleTime: 30_000,
    })),
  });

  const map: Record<string, ChallengeProgress[] | undefined> = {};
  ids.forEach((id, index) => {
    map[id] = results[index]?.data;
  });
  return map;
}

export function useChallenge(challengeId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.challenge(challengeId ?? ''),
    queryFn: () => fetchChallenge(challengeId!),
    enabled: !!challengeId,
  });
}

export function useChallengeProgress(challengeId: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.challengeProgress(challengeId ?? ''),
    queryFn: () => fetchChallengeProgress(challengeId!),
    enabled: !!challengeId && enabled,
  });
}

export function useChallengeContributions(challengeId: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.challengeContributions(challengeId ?? ''),
    queryFn: () => fetchChallengeContributions(challengeId!),
    enabled: !!challengeId && enabled,
  });
}
