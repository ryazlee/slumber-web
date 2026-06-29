/** @username mention parsing. Usernames are lowercase [a-z0-9_]. */

const USERNAME_PATTERN = '[a-z0-9_]+';

export function extractMentionUsernames(text: string): string[] {
  const regex = new RegExp(`@(${USERNAME_PATTERN})`, 'gi');
  const seen = new Set<string>();
  const result: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    const username = match[1].toLowerCase();
    if (!seen.has(username)) {
      seen.add(username);
      result.push(username);
    }
  }
  return result;
}

export type MentionSegment =
  | { type: 'text'; value: string }
  | { type: 'mention'; username: string };

export function parseMentionSegments(text: string): MentionSegment[] {
  const regex = new RegExp(`@(${USERNAME_PATTERN})`, 'gi');
  const segments: MentionSegment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', value: text.slice(lastIndex, match.index) });
    }
    segments.push({ type: 'mention', username: match[1].toLowerCase() });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    segments.push({ type: 'text', value: text.slice(lastIndex) });
  }

  return segments.length ? segments : [{ type: 'text', value: text }];
}

/** Strava-style flat reply — prepopulate the composer with @author. */
export function buildCommentReplyPrefix(username: string): string {
  return `@${username.toLowerCase()} `;
}
