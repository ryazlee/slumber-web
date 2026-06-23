import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  addComment,
  deleteComment,
  fetchCommentLikeUsers,
  fetchComments,
  fetchKudosUsers,
  toggleCommentLike,
  toggleKudos,
  updateComment,
} from '../lib/posts';
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

export function useCommentLikes(commentId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.postCommentLikes(commentId ?? ''),
    queryFn: () => fetchCommentLikeUsers(commentId!),
    enabled: enabled && !!commentId,
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

export function useToggleCommentLike(postId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      commentId,
      userId,
      likeCount,
      hasLiked,
    }: {
      commentId: string;
      userId: string;
      likeCount: number;
      hasLiked: boolean;
    }) => toggleCommentLike(commentId, userId, likeCount, hasLiked),
    onSuccess: (res, vars) => {
      qc.setQueryData(queryKeys.postComments(postId), (old: Comment[] | undefined) =>
        old?.map((c) =>
          c.id === vars.commentId ? { ...c, likeCount: res.likeCount, hasLiked: res.hasLiked } : c,
        ),
      );
      void qc.invalidateQueries({ queryKey: queryKeys.postCommentLikes(vars.commentId) });
    },
  });
}

export function useUpdateComment(postId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      commentId,
      userId,
      text,
    }: {
      commentId: string;
      userId: string;
      text: string;
    }) => updateComment(commentId, userId, text),
    onSuccess: (updated) => {
      qc.setQueryData(queryKeys.postComments(postId), (old: Comment[] | undefined) =>
        old?.map((c) => (c.id === updated.id ? updated : c)),
      );
    },
  });
}

export function useDeleteComment(postId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ commentId, userId }: { commentId: string; userId: string }) =>
      deleteComment(commentId, userId),
    onSuccess: (_, vars) => {
      qc.setQueryData(queryKeys.postComments(postId), (old: Comment[] | undefined) =>
        old?.filter((c) => c.id !== vars.commentId),
      );
      let nextCount = 0;
      const cachedPost = qc.getQueryData<SleepPost | null>(queryKeys.post(postId));
      if (cachedPost) {
        nextCount = Math.max(0, (cachedPost.commentCount ?? 0) - 1);
      } else {
        const feed = qc.getQueryData<{ pages: SleepPost[][] }>(queryKeys.feed);
        const fromFeed = feed?.pages.flat().find((p) => p.id === postId);
        nextCount = Math.max(0, (fromFeed?.commentCount ?? 0) - 1);
      }
      patchPostInCache(qc, postId, { commentCount: nextCount }, { userPosts: 'all' });
    },
  });
}
