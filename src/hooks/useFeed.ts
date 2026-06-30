import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo } from 'react';
import { fetchFeed, PAGE_SIZE } from '../lib/feed';
import { prefetchCachedImageUrls } from '../lib/imageCache';
import { patchPostInCache } from '../lib/patchPostCache';
import { getOptionalQueryErrorMessage } from '../lib/queryError';
import type { SleepPost } from '../lib/types';
import { queryKeys } from './queryKeys';

export function useFeed() {
  const qc = useQueryClient();

  const query = useInfiniteQuery({
    queryKey: queryKeys.feed,
    queryFn: ({ pageParam }) => fetchFeed(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.length < PAGE_SIZE ? undefined : lastPage[lastPage.length - 1].createdAt,
  });

  const posts = useMemo(
    () => query.data?.pages.flat() ?? [],
    [query.data],
  );

  useEffect(() => {
    if (posts.length === 0) return;
    prefetchCachedImageUrls(posts.map((post) => post.avatarUrl));
  }, [posts]);

  const patchPost = useCallback((postId: string, patch: Partial<SleepPost>) => {
    patchPostInCache(qc, postId, patch, { feed: true });
  }, [qc]);

  return {
    posts,
    loading: query.isLoading,
    loadingMore: query.isFetchingNextPage,
    error: getOptionalQueryErrorMessage(query.error, 'Failed to load feed'),
    hasMore: query.hasNextPage ?? false,
    loadMore: () => { void query.fetchNextPage(); },
    patchPost,
  };
}
