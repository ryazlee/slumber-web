import type { ReactNode } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAssignableRoles, useAvatarRoleStyles, useTags } from '../hooks/useCatalog';
import { useProfile } from '../hooks/useProfile';
import AppMuiProvider from './AppMuiProvider';

type Props = {
  children?: ReactNode;
};

export default function AppShell({ children }: Props) {
  const { user } = useAuth();
  const profileQuery = useProfile(user?.id ?? null);
  useTags();
  useAssignableRoles();
  useAvatarRoleStyles();

  const username = profileQuery.data?.username;

  return (
    <AppMuiProvider>
      <div className="app-shell">
        <main className="app-main">
          {children ?? <Outlet />}
        </main>

        <footer className="app-footer content-wrap content-wrap--feed">
          <div className="app-footer-inner">
            {user && username ? (
              <NavLink to={`/profile/${user.id}`} className="app-footer-user">
                @{username}
              </NavLink>
            ) : null}
            <span className="app-footer-note">Browse on web · log sleep in the iOS app</span>
            <NavLink to="/home">About</NavLink>
            <NavLink to="/privacy">Privacy</NavLink>
            <NavLink to="/terms">Terms</NavLink>
          </div>
        </footer>
      </div>
    </AppMuiProvider>
  );
}
