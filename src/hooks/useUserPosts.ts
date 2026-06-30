import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo } from 'react';
import { fetchUserPosts, PAGE_SIZE } from '../lib/feed';
import { prefetchCachedImageUrls } from '../lib/imageCache';
import { patchPostInCache } from '../lib/patchPostCache';
import { getOptionalQueryErrorMessage } from '../lib/queryError';
import type { SleepPost } from '../lib/types';
import { queryKeys } from './queryKeys';

export function useUserPosts(userId: string | null, options?: { enabled?: boolean }) {
  const qc = useQueryClient();
  const enabled = (options?.enabled ?? true) && !!userId;

  const query = useInfiniteQuery({
    queryKey: queryKeys.userPosts(userId ?? ''),
    queryFn: ({ pageParam }) => fetchUserPosts(userId!, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.length < PAGE_SIZE ? undefined : lastPage[lastPage.length - 1].createdAt,
    enabled,
  });

  const posts = useMemo(
    () => query.data?.pages.flat() ?? [],
    [query.data],
  );

  useEffect(() => {
    if (posts.length > 0) prefetchCachedImageUrls(posts.map((post) => post.avatarUrl));
  }, [posts]);

  const patchPost = useCallback((postId: string, patch: Partial<SleepPost>) => {
    if (!userId) return;
    patchPostInCache(qc, postId, patch, { feed: false, userPosts: userId });
  }, [qc, userId]);

  return {
    posts,
    loading: query.isLoading,
    loadingMore: query.isFetchingNextPage,
    error: getOptionalQueryErrorMessage(query.error, 'Failed to load posts'),
    hasMore: query.hasNextPage ?? false,
    loadMore: () => { void query.fetchNextPage(); },
    patchPost,
  };
}
