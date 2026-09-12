import { Link, Outlet } from 'react-router-dom';

export default function Layout() {
  return (
    <>
      <main className="site-main">
        <Outlet />
      </main>

      <footer className="site-footer">
        <div className="site-footer-inner content-wrap">
          <span>© {new Date().getFullYear()} Slumber</span>
          <Link to="/contact">Contact</Link>
          <Link to="/privacy">Privacy</Link>
          <Link to="/terms">Terms</Link>
        </div>
      </footer>
    </>
  );
}
