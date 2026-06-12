import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { fetchUserPosts, PAGE_SIZE } from '../lib/feed';
import type { SleepPost } from '../lib/types';
import { queryKeys } from './queryKeys';

export function useUserPosts(userId: string | null) {
  const qc = useQueryClient();

  const query = useInfiniteQuery({
    queryKey: queryKeys.userPosts(userId ?? ''),
    queryFn: ({ pageParam }) => fetchUserPosts(userId!, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.length < PAGE_SIZE ? undefined : lastPage[lastPage.length - 1].createdAt,
    enabled: !!userId,
  });

  const posts = useMemo(
    () => query.data?.pages.flat() ?? [],
    [query.data],
  );

  const patchPost = useCallback((postId: string, patch: Partial<SleepPost>) => {
    if (!userId) return;
    qc.setQueryData(queryKeys.userPosts(userId), (old: typeof query.data) => {
      if (!old) return old;
      let changed = false;
      const pages = old.pages.map((page) =>
        page.map((p) => {
          if (p.id !== postId) return p;
          changed = changed || Object.entries(patch).some(
            ([key, value]) => p[key as keyof SleepPost] !== value,
          );
          return { ...p, ...patch };
        }),
      );
      return changed ? { ...old, pages } : old;
    });
    qc.setQueryData(queryKeys.post(postId), (old: SleepPost | null | undefined) => {
      if (!old) return old;
      const changed = Object.entries(patch).some(
        ([key, value]) => old[key as keyof SleepPost] !== value,
      );
      return changed ? { ...old, ...patch } : old;
    });
  }, [qc, userId]);

  return {
    posts,
    loading: query.isLoading,
    loadingMore: query.isFetchingNextPage,
    error: query.error instanceof Error ? query.error.message : null,
    hasMore: query.hasNextPage ?? false,
    loadMore: () => { void query.fetchNextPage(); },
    patchPost,
  };
}
