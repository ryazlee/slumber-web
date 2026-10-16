/** Letters, numbers, underscores, and periods (no leading/trailing dot). */
export const USERNAME_REGEX = /^(?=.{2,20}$)[a-z0-9_](?:[a-z0-9_.]{0,18}[a-z0-9_])?$/;

/** Completed @mention token in notes, dreams, and comments. */
export const USERNAME_MENTION_PATTERN = `[a-z0-9_](?:[a-z0-9_.]{0,18}[a-z0-9_])?`;

export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 20;

/** Reserved brand token — blocked as a substring (case-insensitive via normalize). */
export const USERNAME_RESERVED_SUBSTRING = 'slumber';

export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

/** Returns an error message, or null if valid. */
export function validateUsername(username: string): string | null {
  if (username.length < USERNAME_MIN_LENGTH) {
    return `Username must be at least ${USERNAME_MIN_LENGTH} characters.`;
  }
  if (username.length > USERNAME_MAX_LENGTH) {
    return `Username must be at most ${USERNAME_MAX_LENGTH} characters.`;
  }
  if (!USERNAME_REGEX.test(username)) {
    return 'Only letters, numbers, underscores, and periods.';
  }
  if (username.includes(USERNAME_RESERVED_SUBSTRING)) {
    return 'That username is reserved.';
  }
  return null;
}
