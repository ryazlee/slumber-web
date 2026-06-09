import { NavLink, Outlet } from 'react-router-dom';

export default function Layout() {
  return (
    <>
      <main>
        <Outlet />
      </main>

      <footer className="site-footer">
        <div className="site-footer-inner">
          <span>© {new Date().getFullYear()} Slumber</span>
          <NavLink to="/privacy">Privacy Policy</NavLink>
          <NavLink to="/terms">Terms of Service</NavLink>
          <a href="mailto:useslumber@gmail.com">useslumber@gmail.com</a>
        </div>
      </footer>
    </>
  );
}
