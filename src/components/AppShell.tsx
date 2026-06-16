import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAssignableRoles, useAvatarRoleStyles, useTags } from '../hooks/useCatalog';
import { useProfile } from '../hooks/useProfile';

export default function AppShell() {
  const { user } = useAuth();
  const profileQuery = useProfile(user?.id ?? null);
  useTags();
  useAssignableRoles();
  useAvatarRoleStyles();

  const username = profileQuery.data?.username;

  return (
    <div className="app-shell">
      <main className="app-main">
        <Outlet />
      </main>

      <footer className="app-footer content-wrap content-wrap--feed">
        <div className="app-footer-inner">
          {user && username ? (
            <NavLink to={`/profile/${user.id}`} className="app-footer-user">
              @{username}
            </NavLink>
          ) : null}
          <span className="app-footer-note">Read-only web view</span>
          <NavLink to="/home">About</NavLink>
          <NavLink to="/privacy">Privacy</NavLink>
          <NavLink to="/terms">Terms</NavLink>
        </div>
      </footer>
    </div>
  );
}
