import type { SleepPost } from './types';
import { addDaysToDateISO, getLocalDateISO } from './dates';

/**
 * Max age (viewer-local calendar days) for the green Latest badge.
 * Covers timezone skew: `sleep_date` is the author's night on their device, so
 * their "last night" may be the viewer's today or up to ~2 days ago.
 */
export const LATEST_POST_MAX_AGE_DAYS = 2;

/** Negative when `a` is more recent than `b` (by sleep night, then publish time). */
export function compareSleepPostsByRecency(a: SleepPost, b: SleepPost): number {
  if (a.sleepDate !== b.sleepDate) {
    return a.sleepDate > b.sleepDate ? -1 : 1;
  }
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}

/** One latest post id per author in the given list. */
export function buildLatestPostIdsByUser(posts: SleepPost[]): Set<string> {
  const bestByUser = new Map<string, SleepPost>();
  for (const post of posts) {
    const prev = bestByUser.get(post.userId);
    if (!prev || compareSleepPostsByRecency(post, prev) < 0) {
      bestByUser.set(post.userId, post);
    }
  }
  return new Set([...bestByUser.values()].map((p) => p.id));
}

/**
 * Green "Latest" badge: author's most recent post in the loaded list, and not older
 * than {@link LATEST_POST_MAX_AGE_DAYS} on the viewer's local calendar.
 */
export function isLatestSleepPost(
  post: SleepPost,
  latestIds: Set<string>,
  todayISO = getLocalDateISO(),
): boolean {
  if (!latestIds.has(post.id)) return false;
  const oldestFreshISO = addDaysToDateISO(todayISO, -LATEST_POST_MAX_AGE_DAYS);
  return post.sleepDate >= oldestFreshISO;
}
