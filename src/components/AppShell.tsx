import { useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { loadAvatarRoleStyles } from '../lib/avatarRoles';
import { loadTags } from '../lib/tags';
import { loadRoleDefinitions } from '../lib/userRoles';

export default function AppShell() {
  useEffect(() => {
    void loadAvatarRoleStyles();
    void loadRoleDefinitions();
    void loadTags();
  }, []);

  return (
    <div className="app-shell">
      <main className="app-main">
        <Outlet />
      </main>

      <footer className="app-footer content-wrap">
        <span>Read-only web view</span>
        <NavLink to="/home">About</NavLink>
        <NavLink to="/privacy">Privacy</NavLink>
        <NavLink to="/terms">Terms</NavLink>
      </footer>
    </div>
  );
}
