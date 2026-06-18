export type PrimaryNavItem = {
  to: string;
  label: string;
  end?: boolean;
  matchPrefix?: string;
};

export const MAIN_NAV_ITEMS: PrimaryNavItem[] = [
  { to: '/feed', label: 'Feed', end: true },
  { to: '/stats', label: 'Stats', matchPrefix: '/stats' },
  { to: '/social', label: 'Social', matchPrefix: '/social' },
  { to: '/challenges', label: 'Challenges', matchPrefix: '/challenge' },
];

export const STATS_SUBNAV: { to: string; label: string; end?: boolean }[] = [
  { to: '/stats', label: 'My Stats', end: true },
  { to: '/stats/compare', label: 'Compare' },
];

export const SOCIAL_SUBNAV: { to: string; label: string; end?: boolean }[] = [
  { to: '/social', label: 'Friends', end: true },
  { to: '/social/clubs', label: 'Clubs' },
];

export function profileNavItem(userId: string | undefined): PrimaryNavItem {
  return {
    to: userId ? `/profile/${userId}` : '/profile',
    label: 'You',
    matchPrefix: '/profile',
  };
}

export function isNavActive(
  pathname: string,
  item: Pick<PrimaryNavItem, 'to' | 'end' | 'matchPrefix'>,
): boolean {
  if (item.matchPrefix) {
    return pathname === item.matchPrefix || pathname.startsWith(`${item.matchPrefix}/`);
  }
  if (item.end) return pathname === item.to;
  return pathname === item.to || pathname.startsWith(`${item.to}/`);
}
