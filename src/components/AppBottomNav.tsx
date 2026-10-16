import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useIsModerator } from '../hooks/useAdmin';
import { useBoardUnreadBadges } from '../hooks/useBoardUnreadBadges';
import {
  ADMIN_NAV_ITEM,
  isNavActive,
  MAIN_NAV_ITEMS,
  type PrimaryNavItem,
} from '../lib/appNav';

function bottomTabClass(active: boolean) {
  return active ? 'app-bottom-tab active' : 'app-bottom-tab';
}

function withBoardBadges(
  items: PrimaryNavItem[],
  challengeBoardUnread: number,
  clubBoardUnread: number,
): PrimaryNavItem[] {
  return items.map((item) => {
    if (item.to === '/challenges') {
      return { ...item, badgeCount: challengeBoardUnread };
    }
    if (item.to === '/social') {
      return { ...item, badgeCount: clubBoardUnread };
    }
    return item;
  });
}

export function useBottomNavItems(): PrimaryNavItem[] {
  const { session } = useAuth();
  const moderatorQuery = useIsModerator(Boolean(session));
  const { challengeBoardUnread, clubBoardUnread } = useBoardUnreadBadges(Boolean(session));
  const items = [...MAIN_NAV_ITEMS];
  if (moderatorQuery.data === true) {
    items.push(ADMIN_NAV_ITEM);
  }
  return withBoardBadges(items, challengeBoardUnread, clubBoardUnread);
}

export function usePrimaryNavItems(): PrimaryNavItem[] {
  const { session } = useAuth();
  const moderatorQuery = useIsModerator(Boolean(session));
  const { challengeBoardUnread, clubBoardUnread } = useBoardUnreadBadges(Boolean(session));
  const items = moderatorQuery.data === true
    ? [...MAIN_NAV_ITEMS, ADMIN_NAV_ITEM]
    : [...MAIN_NAV_ITEMS];
  return withBoardBadges(items, challengeBoardUnread, clubBoardUnread);
}

function NavLabel({ label, badgeCount }: { label: string; badgeCount?: number }) {
  const count = badgeCount ?? 0;
  return (
    <span className="nav-label-with-badge">
      {label}
      {count > 0 ? (
        <span className="nav-unread-badge" aria-label={`${count} unread`}>
          {count > 9 ? '9+' : count}
        </span>
      ) : null}
    </span>
  );
}

export default function AppBottomNav({ items }: { items: PrimaryNavItem[] }) {
  const location = useLocation();

  return (
    <nav className="app-bottom-nav" aria-label="Main">
      {items.map((item) => {
        const active = isNavActive(location.pathname, item);
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={bottomTabClass(active)}
            aria-current={active ? 'page' : undefined}
          >
            <NavLabel label={item.label} badgeCount={item.badgeCount} />
          </NavLink>
        );
      })}
    </nav>
  );
}

export { NavLabel };
