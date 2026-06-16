import type { QueryClient } from '@tanstack/react-query';
import type { SleepPost } from './types';
import { queryKeys } from '../hooks/queryKeys';

type InfinitePostsData = {
  pages: SleepPost[][];
  pageParams: unknown[];
};

function hasPatchChanges(post: SleepPost, patch: Partial<SleepPost>): boolean {
  return Object.entries(patch).some(
    ([key, value]) => post[key as keyof SleepPost] !== value,
  );
}

function patchInfinitePages(
  old: InfinitePostsData | undefined,
  postId: string,
  patch: Partial<SleepPost>,
): InfinitePostsData | undefined {
  if (!old) return old;
  let changed = false;
  const pages = old.pages.map((page) =>
    page.map((p) => {
      if (p.id !== postId) return p;
      const next = { ...p, ...patch };
      if (hasPatchChanges(p, patch)) changed = true;
      return next;
    }),
  );
  return changed ? { ...old, pages } : old;
}

function patchSinglePost(
  old: SleepPost | null | undefined,
  patch: Partial<SleepPost>,
): SleepPost | null | undefined {
  if (!old) return old;
  return hasPatchChanges(old, patch) ? { ...old, ...patch } : old;
}

export type PatchPostScope = {
  feed?: boolean;
  /** Patch one user's post list, or every cached user-posts query when `'all'`. */
  userPosts?: string | 'all';
};

export function patchPostInCache(
  qc: QueryClient,
  postId: string,
  patch: Partial<SleepPost>,
  scope: PatchPostScope = { feed: true },
) {
  if (scope.feed !== false) {
    qc.setQueryData(queryKeys.feed, (old) =>
      patchInfinitePages(old as InfinitePostsData | undefined, postId, patch),
    );
  }

  qc.setQueryData(queryKeys.post(postId), (old: SleepPost | null | undefined) =>
    patchSinglePost(old, patch),
  );

  if (scope.userPosts === 'all') {
    const queries = qc.getQueriesData<InfinitePostsData>({ queryKey: ['user-posts'] });
    for (const [key, data] of queries) {
      const next = patchInfinitePages(data, postId, patch);
      if (next !== data) qc.setQueryData(key, next);
    }
  } else if (scope.userPosts) {
    qc.setQueryData(queryKeys.userPosts(scope.userPosts), (old) =>
      patchInfinitePages(old as InfinitePostsData | undefined, postId, patch),
    );
  }
}
