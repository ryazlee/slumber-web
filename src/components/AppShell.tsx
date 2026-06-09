import { NavLink, Outlet } from 'react-router-dom';

export default function AppShell() {
  return (
    <div className="app-shell">
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
