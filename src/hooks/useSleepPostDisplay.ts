import { useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import type { PostSocialPatch } from '../components/PostSocial';
import type { SleepPost } from '../lib/types';
import { isManualSleepPost } from '../lib/sleepPostCustom';
import { sleepPostDisplayTitle } from '../lib/sleepPostTitle';
import { countNaps, hasNapDay } from '../lib/napDay';
import { segmentsForPost } from '../lib/timeline';

export function useSleepPostDisplay(post: SleepPost) {
  const { user } = useAuth();
  const isManual = isManualSleepPost(post);
  const isOwnPost = user?.id === post.userId;
  const canReadDream = Boolean(post.dreamLog) && (!post.blurDream || isOwnPost);
  const isNapDay = !isManual && hasNapDay(post);
  const napCount = countNaps(post.sessionBreakdown) || (isNapDay ? 1 : 0);
  const sessions = post.sessionBreakdown ?? [];
  const showWearableSleep = !isManual && post.asleepMinutes > 0;
  const timelineSegments = segmentsForPost(post);
  const displayTitle = sleepPostDisplayTitle(post.title, post.sleepDate);

  return {
    isManual,
    isOwnPost,
    canReadDream,
    isNapDay,
    napCount,
    sessions,
    showWearableSleep,
    timelineSegments,
    displayTitle,
  };
}

export function usePostSocialPatch(
  postId: string,
  onSocialPatch?: (postId: string, patch: PostSocialPatch) => void,
) {
  return useCallback(
    (patch: PostSocialPatch) => { onSocialPatch?.(postId, patch); },
    [onSocialPatch, postId],
  );
}
