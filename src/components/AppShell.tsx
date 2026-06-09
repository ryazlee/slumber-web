import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const base = import.meta.env.BASE_URL;

export default function AppShell() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const profileActive = location.pathname === '/profile' || location.pathname.startsWith('/profile/');

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header-inner">
          <NavLink to="/feed" className="brand">
            <img src={`${base}moon.png`} alt="" width={28} height={28} />
            Slumber
          </NavLink>

          <nav className="app-nav" aria-label="App">
            <NavLink to="/home" className={({ isActive }) => isActive ? 'app-nav-link active' : 'app-nav-link'}>
              Home
            </NavLink>
            <NavLink to="/feed" className={({ isActive }) => isActive ? 'app-nav-link active' : 'app-nav-link'}>
              Feed
            </NavLink>
            <NavLink
              to={user ? `/profile/${user.id}` : '/profile'}
              className={profileActive ? 'app-nav-link active' : 'app-nav-link'}
            >
              Profile
            </NavLink>
            <NavLink to="/challenges" className={({ isActive }) => isActive ? 'app-nav-link active' : 'app-nav-link'}>
              Challenges
            </NavLink>
          </nav>

          <div className="app-header-actions">
            <span className="app-user-email" title={user?.email ?? undefined}>
              {user?.email}
            </span>
            <button className="admin-button admin-button-ghost app-sign-out" type="button" onClick={() => signOut()}>
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="app-main">
        <Outlet />
      </main>

      <footer className="app-footer">
        <span>Read-only web view</span>
        <NavLink to="/home">About Slumber</NavLink>
      </footer>
    </div>
  );
}
