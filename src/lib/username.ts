/** Letters, numbers, underscores, and periods (no leading/trailing dot). */
export const USERNAME_REGEX = /^(?=.{2,20}$)[a-z0-9_](?:[a-z0-9_.]{0,18}[a-z0-9_])?$/;

/** Completed @mention token in notes, dreams, and comments. */
export const USERNAME_MENTION_PATTERN = `[a-z0-9_](?:[a-z0-9_.]{0,18}[a-z0-9_])?`;

export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}
