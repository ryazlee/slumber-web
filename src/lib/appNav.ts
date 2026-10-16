export type PrimaryNavItem = {
  to: string;
  label: string;
  end?: boolean;
  matchPrefix?: string;
  /** Optional unread count badge (e.g. message boards). */
  badgeCount?: number;
};

export const MAIN_NAV_ITEMS: PrimaryNavItem[] = [
  { to: '/feed', label: 'Feed', end: true },
  { to: '/challenges', label: 'Challenges', matchPrefix: '/challenge' },
  { to: '/social', label: 'Social', matchPrefix: '/social' },
  { to: '/stats', label: 'Stats', matchPrefix: '/stats' },
];

export const STATS_SUBNAV: { to: string; label: string; end?: boolean }[] = [
  { to: '/stats', label: 'My Stats', end: true },
  { to: '/stats/compare', label: 'Compare' },
];

export const SOCIAL_SUBNAV: { to: string; label: string; end?: boolean }[] = [
  { to: '/social/global', label: 'Leaderboards' },
  { to: '/social/clubs', label: 'Clubs' },
  { to: '/social/friends', label: 'Friends' },
];

export const ADMIN_NAV_ITEM: PrimaryNavItem = {
  to: '/admin',
  label: 'Admin',
  matchPrefix: '/admin',
};

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
