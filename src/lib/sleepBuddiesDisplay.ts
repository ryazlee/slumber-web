import type { SleepBuddyProfile, SleepBuddyStatus, SleepPost } from './types';

export type SleepBuddyDisplay = SleepBuddyProfile & {
  status?: SleepBuddyStatus;
};

/** Buddies visible on feed/detail for the current viewer. Author sees pending + accepted; others see accepted only. */
export function sleepBuddiesForViewer(
  post: SleepPost,
  viewerUserId: string | undefined,
): SleepBuddyDisplay[] {
  if (viewerUserId && post.userId === viewerUserId && post.sleepBuddyTags?.length) {
    return post.sleepBuddyTags
      .filter((t) => t.status !== 'declined')
      .map(({ userId, username, avatarUrl, userRoles, status }) => ({
        userId,
        username,
        avatarUrl,
        userRoles,
        status,
      }));
  }
  return (post.sleepBuddies ?? []).map((b) => ({ ...b }));
}

export function hasVisibleSleepBuddies(
  post: SleepPost,
  viewerUserId: string | undefined,
): boolean {
  return sleepBuddiesForViewer(post, viewerUserId).length > 0;
}
