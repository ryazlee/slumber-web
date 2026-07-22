import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useIsModerator } from '../hooks/useAdmin';
import { isNavActive, MAIN_NAV_ITEMS } from '../lib/appNav';
import { APP_STORE_URL } from '../lib/deepLinks';
import AppBottomNav, { useBottomNavItems } from './AppBottomNav';
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
  const bottomNav = useBottomNavItems();
  const adminActive = location.pathname === '/admin' || location.pathname.startsWith('/admin/');
  const brandTarget = isLoggedIn ? '/feed' : '/home';

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
                {MAIN_NAV_ITEMS.map((item) => {
                  const active = isNavActive(location.pathname, item);
                  return (
                    <NavLink
                      key={item.label}
                      to={item.to}
                      end={item.end}
                      className={desktopTabClass(active)}
                      aria-current={active ? 'page' : undefined}
                    >
                      {item.label}
                    </NavLink>
                  );
                })}
              </nav>
            ) : null}
          </div>

          <div className="site-header-end">
            {!isLoggedIn ? (
              <nav className="site-header-links" aria-label="Site">
                <NavLink to="/home" className={({ isActive }) => (isActive ? 'site-header-link active' : 'site-header-link')}>
                  Home
                </NavLink>
                <NavLink to="/privacy" className={({ isActive }) => (isActive ? 'site-header-link active' : 'site-header-link')}>
                  Privacy
                </NavLink>
                <NavLink to="/terms" className={({ isActive }) => (isActive ? 'site-header-link active' : 'site-header-link')}>
                  Terms
                </NavLink>
              </nav>
            ) : null}

            <div className="site-header-actions">
              {isLoggedIn ? (
                <>
                  <HeaderSearch />
                  <HeaderProfileLink />
                  <HeaderMenu showAdmin={isModerator} adminActive={adminActive} />
                </>
              ) : (
                <>
                  <a
                    href={APP_STORE_URL}
                    className="site-header-btn site-header-btn--ghost site-header-btn--store"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    App Store
                  </a>
                  <NavLink to="/" end className="site-header-btn site-header-btn--primary">
                    Log in
                  </NavLink>
                  <div className="site-header-mobile-menu">
                    <HeaderMenu showAdmin={false} adminActive={false} />
                  </div>
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
