import type { ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { isNavActive } from '../lib/appNav';

type SubnavItem = { to: string; label: string; end?: boolean };

type Props = {
  title: string;
  hubClassName: string;
  navClassName: string;
  navLabel: string;
  subnav: SubnavItem[];
  toolbar?: ReactNode;
  children: ReactNode;
};

function hubTabClass(active: boolean) {
  return active ? 'app-tab-bar-link active' : 'app-tab-bar-link';
}

export default function AppHubLayout({
  title,
  hubClassName,
  navClassName,
  navLabel,
  subnav,
  toolbar,
  children,
}: Props) {
  const location = useLocation();

  const nav = (
    <nav className={`app-tab-bar ${navClassName}`} aria-label={navLabel}>
      {subnav.map((item) => {
        const active = isNavActive(location.pathname, item);
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={hubTabClass(active)}
            aria-current={active ? 'page' : undefined}
          >
            {item.label}
          </NavLink>
        );
      })}
    </nav>
  );

  return (
    <div className={`app-page ${hubClassName}`}>
      <div className="app-hub-head">
        <header className="app-page-header app-page-header--compact">
          <h1>{title}</h1>
        </header>

        {toolbar ? (
          <div className="stats-hub-toolbar">
            {nav}
            {toolbar}
          </div>
        ) : nav}
      </div>

      {children}
    </div>
  );
}
