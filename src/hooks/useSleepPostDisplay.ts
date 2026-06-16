import { useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import type { PostSocialPatch } from '../components/PostSocial';
import type { SleepPost } from '../lib/types';
import { isLatestSleepPost } from '../lib/format';
import { isManualSleepPost } from '../lib/sleepPostCustom';
import { customSleepPostTitle } from '../lib/sleepPostTitle';
import { countNaps, hasNapDay } from '../lib/napDay';
import { VIBE_CONFIG } from '../lib/sleepPostMeta';
import { segmentsForPost } from '../lib/timeline';

export function useSleepPostDisplay(post: SleepPost) {
  const { user } = useAuth();
  const isManual = isManualSleepPost(post);
  const isOwnPost = user?.id === post.userId;
  const canReadDream = Boolean(post.dreamLog) && (!post.blurDream || isOwnPost);
  const isLatest = isLatestSleepPost(post.sleepDate);
  const vibe = post.vibe ? VIBE_CONFIG[post.vibe] : undefined;
  const isNapDay = !isManual && hasNapDay(post);
  const napCount = countNaps(post.sessionBreakdown) || (isNapDay ? 1 : 0);
  const sessions = post.sessionBreakdown ?? [];
  const showWearableSleep = !isManual && post.asleepMinutes > 0;
  const timelineSegments = segmentsForPost(post);
  const displayTitle = customSleepPostTitle(post.title, post.sleepDate);

  return {
    isManual,
    isOwnPost,
    canReadDream,
    isLatest,
    vibe,
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
