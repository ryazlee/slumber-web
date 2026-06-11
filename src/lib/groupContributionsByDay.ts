import type { ChallengeContributionPost } from './types';

export function formatChallengeDayLabel(dateISO: string): string {
  const [year, month, day] = dateISO.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function groupContributionsByDay(
  posts: ChallengeContributionPost[],
  currentUserId: string | null,
): [string, ChallengeContributionPost[]][] {
  const groups = new Map<string, ChallengeContributionPost[]>();
  for (const post of posts) {
    const current = groups.get(post.sleepDate) ?? [];
    current.push(post);
    groups.set(post.sleepDate, current);
  }

  return Array.from(groups.entries())
    .map(([date, dayPosts]) => {
      const sorted = [...dayPosts].sort((a, b) => {
        if (currentUserId && a.userId === currentUserId) return -1;
        if (currentUserId && b.userId === currentUserId) return 1;
        return 0;
      });
      return [date, sorted] as [string, ChallengeContributionPost[]];
    })
    .sort(([a], [b]) => (a < b ? 1 : -1));
}
