import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const base = import.meta.env.BASE_URL;

function navClass({ isActive }: { isActive: boolean }) {
  return isActive ? 'active' : undefined;
}

export default function SiteHeader() {
  const { session, user, signOut } = useAuth();
  const location = useLocation();
  const isLoggedIn = Boolean(session);
  const profileActive = location.pathname === '/profile' || location.pathname.startsWith('/profile/');
  const profilePath = user ? `/profile/${user.id}` : '/profile';

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <NavLink to="/home" className="brand">
          <img src={`${base}moon.png`} alt="" width={28} height={28} />
          Slumber
        </NavLink>

        <nav className="site-nav" aria-label="Main">
          <NavLink to="/home" className={navClass}>Home</NavLink>
          {isLoggedIn ? (
            <>
              <NavLink to="/feed" className={navClass}>Feed</NavLink>
              <NavLink to={profilePath} className={profileActive ? 'active' : undefined}>Profile</NavLink>
              <NavLink to="/challenges" className={navClass}>Challenges</NavLink>
            </>
          ) : (
            <NavLink to="/" end className={navClass}>Sign in</NavLink>
          )}
          <NavLink to="/privacy" className={navClass}>Privacy</NavLink>
          <NavLink to="/terms" className={navClass}>Terms</NavLink>
        </nav>

        {isLoggedIn && (
          <div className="site-header-actions">
            <span className="site-user-email" title={user?.email ?? undefined}>
              {user?.email}
            </span>
            <button
              className="admin-button admin-button-ghost site-sign-out"
              type="button"
              onClick={() => signOut()}
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
