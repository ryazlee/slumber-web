import { NavLink, Outlet } from 'react-router-dom';

export default function AppShell() {
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
