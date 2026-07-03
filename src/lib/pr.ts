export const PR_LABELS: Record<string, string> = {
  longest_sleep: 'Longest Sleep',
  most_deep_sleep: 'Most Deep',
  most_rem: 'Most REM',
  most_core_sleep: 'Most Core',
};

type PrBadgePost = {
  prTypes?: string[];
  monthlyPrTypes?: string[];
  monthPostCount?: number;
};

/** Hide monthly chips when the author has fewer than two wearable posts that month. */
export function getVisibleMonthlyPrTypes(post: PrBadgePost): string[] {
  const types = post.monthlyPrTypes ?? [];
  if (!types.length || (post.monthPostCount ?? 1) < 2) return [];
  return types;
}
