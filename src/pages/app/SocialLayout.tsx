import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { SOCIAL_SUBNAV } from '../../lib/appNav';

function socialTabClass(active: boolean) {
  return active ? 'app-tab-bar-link active' : 'app-tab-bar-link';
}

export default function SocialLayout() {
  const location = useLocation();

  return (
    <div className="app-page social-hub">
      <div className="app-hub-head">
        <header className="app-page-header app-page-header--compact">
          <h1>Social</h1>
        </header>

        <nav className="app-tab-bar social-hub-nav" aria-label="Social sections">
          {SOCIAL_SUBNAV.map((item) => {
            const active = item.end
              ? location.pathname === item.to
              : location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={socialTabClass(active)}
                aria-current={active ? 'page' : undefined}
              >
                {item.label}
              </NavLink>
            );
          })}
        </nav>
      </div>

      <Outlet />
    </div>
  );
}
