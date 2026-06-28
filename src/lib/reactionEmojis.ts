/** Keep in sync with ../../lib/reactionEmojis.ts */
export const REACTION = {
  active: '🫶',
  inactive: '🩶',
} as const;

export function kudosEmoji(hasKudoed: boolean): string {
  return hasKudoed ? REACTION.active : REACTION.inactive;
}

export function commentLikeEmoji(hasLiked: boolean): string {
  return hasLiked ? REACTION.active : REACTION.inactive;
}
