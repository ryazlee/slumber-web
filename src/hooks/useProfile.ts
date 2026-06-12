import { useQuery } from '@tanstack/react-query';
import { fetchProfileSummary } from '../lib/profile';
import { queryKeys } from './queryKeys';

export function useProfile(userId: string | null) {
  return useQuery({
    queryKey: queryKeys.profile(userId ?? ''),
    queryFn: () => fetchProfileSummary(userId!),
    enabled: !!userId,
  });
}
