import { useQuery } from '@tanstack/react-query';
import { fetchPost } from '../lib/feed';
import { queryKeys } from './queryKeys';

export function usePost(postId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.post(postId ?? ''),
    queryFn: () => fetchPost(postId!),
    enabled: !!postId,
  });
}
