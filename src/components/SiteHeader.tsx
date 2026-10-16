import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useIsModerator } from '../hooks/useAdmin';
import { isNavActive } from '../lib/appNav';
import AppBottomNav, { NavLabel, useBottomNavItems, usePrimaryNavItems } from './AppBottomNav';
import HeaderMenu from './HeaderMenu';
import HeaderProfileLink from './HeaderProfileLink';
import HeaderSearch from './HeaderSearch';

const base = import.meta.env.BASE_URL;

function desktopTabClass(active: boolean) {
  return active ? 'site-app-tab active' : 'site-app-tab';
}

export default function SiteHeader() {
  const { session } = useAuth();
  const isLoggedIn = Boolean(session);
  const moderatorQuery = useIsModerator(isLoggedIn);
  const isModerator = moderatorQuery.data === true;
  const location = useLocation();
  const primaryNav = usePrimaryNavItems();
  const bottomNav = useBottomNavItems();
  const adminActive = location.pathname === '/admin' || location.pathname.startsWith('/admin/');
  const brandTarget = isLoggedIn ? '/feed' : '/';

  return (
    <>
      <header className="site-header">
        <div className={`site-header-bar content-wrap content-wrap--app${isLoggedIn ? ' site-header-bar--app' : ''}`}>
          <div className="site-header-start">
            <NavLink to={brandTarget} className="brand">
              <img src={`${base}moon.png`} alt="" width={28} height={28} />
              <span className="brand-label">Slumber</span>
            </NavLink>

            {isLoggedIn ? (
              <nav className="site-app-nav site-app-nav--desktop" aria-label="App">
                {primaryNav.map((item) => {
                  const active = isNavActive(location.pathname, item);
                  return (
                    <NavLink
                      key={item.label}
                      to={item.to}
                      end={item.end}
                      className={desktopTabClass(active)}
                      aria-current={active ? 'page' : undefined}
                    >
                      <NavLabel label={item.label} badgeCount={item.badgeCount} />
                    </NavLink>
                  );
                })}
              </nav>
            ) : null}
          </div>

          <div className="site-header-end">
            <div className="site-header-actions">
              {isLoggedIn ? (
                <>
                  <HeaderSearch />
                  <HeaderProfileLink />
                  <HeaderMenu showAdmin={isModerator} adminActive={adminActive} />
                </>
              ) : (
                <>
                  <NavLink to="/download" className="site-header-btn site-header-btn--ghost">
                    Download
                  </NavLink>
                  <NavLink to="/login" end className="site-header-btn site-header-btn--primary">
                    Log in
                  </NavLink>
                  <HeaderMenu showAdmin={false} adminActive={false} variant="hamburger" />
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {isLoggedIn ? <AppBottomNav items={bottomNav} /> : null}
    </>
  );
}
