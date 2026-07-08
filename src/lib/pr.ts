export const PR_LABELS: Record<string, string> = {
  longest_sleep: 'Longest Sleep',
  most_deep_sleep: 'Most Deep',
  most_rem: 'Most REM',
  most_core_sleep: 'Most Core',
};

// Maps record_type → diff vs #2 in the user's own lifetime top-3
export type PRDiffs = Record<string, number>;

type PrBadgePost = {
  prTypes?: string[];
  monthlyPrTypes?: string[];
  /** Wearable (non-custom) posts by this author in the post's calendar month. */
  monthPostCount?: number;
};

/**
 * Hide monthly PR chips when the author has fewer than two wearable posts
 * in that calendar month — a "monthly best" among one night is not meaningful.
 */
export function isMonthlyPrBadgeHidden(post: Pick<PrBadgePost, 'monthPostCount'>): boolean {
  return (post.monthPostCount ?? 1) < 2;
}

export function getVisibleMonthlyPrTypes(post: PrBadgePost): string[] {
  const types = post.monthlyPrTypes ?? [];
  if (!types.length || isMonthlyPrBadgeHidden(post)) return [];
  return types;
}

export function hasVisiblePrBadges(post: PrBadgePost): boolean {
  return (post.prTypes?.length ?? 0) > 0 || getVisibleMonthlyPrTypes(post).length > 0;
}
