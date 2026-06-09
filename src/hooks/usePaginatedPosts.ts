import { useCallback, useEffect, useState } from 'react';
import { PAGE_SIZE } from '../lib/feed';
import type { SleepPost } from '../lib/types';

export function usePaginatedPosts(
  fetchPage: (cursor?: string) => Promise<SleepPost[]>,
  resetKey?: string,
) {
  const [posts, setPosts] = useState<SleepPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const loadInitial = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const next = await fetchPage();
      setPosts(next);
      setHasMore(next.length >= PAGE_SIZE);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not load posts.');
    } finally {
      setLoading(false);
    }
  }, [fetchPage]);

  useEffect(() => {
    setPosts([]);
    setHasMore(false);
    loadInitial();
  }, [loadInitial, resetKey]);

  const loadMore = async () => {
    const cursor = posts[posts.length - 1]?.createdAt;
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    setError(null);
    try {
      const next = await fetchPage(cursor);
      setPosts((prev) => [...prev, ...next]);
      setHasMore(next.length >= PAGE_SIZE);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not load more posts.');
    } finally {
      setLoadingMore(false);
    }
  };

  return { posts, loading, loadingMore, error, hasMore, loadMore };
}
