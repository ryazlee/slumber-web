import type { SleepPost } from './types';
import { addDaysToDateISO, getLocalDateISO } from './dates';

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

/** Last night's sleep_date in the viewer's local calendar. */
export function getViewerLastNightSleepDateISO(todayISO = getLocalDateISO()): string {
  return addDaysToDateISO(todayISO, -1);
}

export function isLatestSleepPost(
  post: SleepPost,
  latestIds: Set<string>,
  todayISO = getLocalDateISO(),
): boolean {
  return latestIds.has(post.id) && post.sleepDate === getViewerLastNightSleepDateISO(todayISO);
}
