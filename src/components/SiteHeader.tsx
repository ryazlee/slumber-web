import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useIsModerator } from '../hooks/useAdmin';

const base = import.meta.env.BASE_URL;

function metaClass({ isActive }: { isActive: boolean }) {
  return isActive ? 'site-header-link active' : 'site-header-link';
}

function appTabClass(active: boolean) {
  return active ? 'site-app-tab active' : 'site-app-tab';
}

export default function SiteHeader() {
  const { session, user, signOut } = useAuth();
  const isLoggedIn = Boolean(session);
  const moderatorQuery = useIsModerator(isLoggedIn);
  const isModerator = moderatorQuery.data === true;
  const location = useLocation();
  const profilePath = user ? `/profile/${user.id}` : '/profile';
  const profileActive = location.pathname === '/profile' || location.pathname.startsWith('/profile/');
  const adminActive = location.pathname === '/admin' || location.pathname.startsWith('/admin/');

  const brandTarget = isLoggedIn ? '/feed' : '/home';

  return (
    <header className="site-header">
      <div className={`site-header-bar content-wrap${isLoggedIn ? ' site-header-bar--app' : ''}`}>
        <div className="site-header-start">
          <NavLink to={brandTarget} className="brand">
            <img src={`${base}moon.png`} alt="" width={28} height={28} />
            <span>Slumber</span>
          </NavLink>

          {isLoggedIn && (
            <nav className="site-app-nav" aria-label="App">
              <NavLink to="/feed" className={({ isActive }) => appTabClass(isActive)}>
                Feed
              </NavLink>
              <NavLink to="/social" className={({ isActive }) => appTabClass(isActive)}>
                Social
              </NavLink>
              <NavLink to={profilePath} className={appTabClass(profileActive)}>
                Profile
              </NavLink>
              <NavLink to="/challenges" className={({ isActive }) => appTabClass(isActive)}>
                Challenges
              </NavLink>
              {isModerator ? (
                <NavLink to="/admin" className={appTabClass(adminActive)}>
                  Admin
                </NavLink>
              ) : null}
            </nav>
          )}
        </div>

        <div className="site-header-end">
          <nav className="site-header-links" aria-label="Site">
            <NavLink to="/home" className={metaClass}>Home</NavLink>
            <NavLink to="/privacy" className={metaClass}>Privacy</NavLink>
            <NavLink to="/terms" className={metaClass}>Terms</NavLink>
          </nav>

          <div className="site-header-actions">
            {isLoggedIn ? (
              <button
                className="site-header-btn site-header-btn--ghost"
                type="button"
                onClick={() => signOut()}
              >
                Log out
              </button>
            ) : (
              <NavLink to="/" end className="site-header-btn site-header-btn--primary">
                Log in
              </NavLink>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
