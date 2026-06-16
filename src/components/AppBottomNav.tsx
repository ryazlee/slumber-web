import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isNavActive, MAIN_NAV_ITEMS, profileNavItem, type PrimaryNavItem } from '../lib/appNav';

function bottomTabClass(active: boolean) {
  return active ? 'app-bottom-tab active' : 'app-bottom-tab';
}

export function useBottomNavItems(): PrimaryNavItem[] {
  const { user } = useAuth();
  return [...MAIN_NAV_ITEMS, profileNavItem(user?.id)];
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
            {item.label}
          </NavLink>
        );
      })}
    </nav>
  );
}
