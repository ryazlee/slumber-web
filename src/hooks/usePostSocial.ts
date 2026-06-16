import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addComment, fetchComments, fetchKudosUsers, toggleKudos } from '../lib/posts';
import { patchPostInCache } from '../lib/patchPostCache';
import type { Comment, SleepPost } from '../lib/types';
import { queryKeys } from './queryKeys';

export function usePostKudos(postId: string, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.postKudos(postId),
    queryFn: () => fetchKudosUsers(postId),
    enabled,
  });
}

export function usePostComments(postId: string, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.postComments(postId),
    queryFn: () => fetchComments(postId),
    enabled,
  });
}

export function useToggleKudos(postId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      kudosCount,
      hasKudoed,
    }: {
      userId: string;
      kudosCount: number;
      hasKudoed: boolean;
    }) => toggleKudos(postId, userId, kudosCount, hasKudoed),
    onSuccess: (res) => {
      patchPostInCache(qc, postId, {
        kudosCount: res.kudosCount,
        hasKudoed: res.hasKudoed,
      }, { userPosts: 'all' });
      void qc.invalidateQueries({ queryKey: queryKeys.postKudos(postId) });
    },
  });
}

export function useAddComment(postId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, text }: { userId: string; text: string }) =>
      addComment(postId, userId, text),
    onSuccess: (comment) => {
      qc.setQueryData(queryKeys.postComments(postId), (old: Comment[] | undefined) =>
        old ? [...old, comment] : [comment],
      );
      let nextCount = 0;
      const cachedPost = qc.getQueryData<SleepPost | null>(queryKeys.post(postId));
      if (cachedPost) {
        nextCount = (cachedPost.commentCount ?? 0) + 1;
      } else {
        const feed = qc.getQueryData<{ pages: SleepPost[][] }>(queryKeys.feed);
        const fromFeed = feed?.pages.flat().find((p) => p.id === postId);
        nextCount = (fromFeed?.commentCount ?? 0) + 1;
      }
      patchPostInCache(qc, postId, { commentCount: nextCount }, { userPosts: 'all' });
    },
  });
}
