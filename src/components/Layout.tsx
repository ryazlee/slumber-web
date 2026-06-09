import { NavLink, Outlet } from 'react-router-dom';

const base = import.meta.env.BASE_URL;

export default function Layout() {
  return (
    <>
      <header className="site-header">
        <div className="site-header-inner">
          <NavLink to="/home" className="brand">
            <img src={`${base}moon.png`} alt="" width={28} height={28} />
            Slumber
          </NavLink>
          <nav className="site-nav" aria-label="Main">
            <NavLink to="/home">
              Home
            </NavLink>
            <NavLink to="/">App</NavLink>
            <NavLink to="/privacy">Privacy</NavLink>
            <NavLink to="/terms">Terms</NavLink>
          </nav>
        </div>
      </header>

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
