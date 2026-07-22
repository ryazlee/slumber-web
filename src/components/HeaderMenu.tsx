import { useEffect, useId, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { APP_STORE_URL } from '../lib/deepLinks';

type Props = {
  showAdmin: boolean;
  adminActive: boolean;
};

export default function HeaderMenu({ showAdmin, adminActive }: Props) {
  const { session, signOut } = useAuth();
  const isLoggedIn = Boolean(session);
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="header-menu" ref={rootRef}>
      <button
        type="button"
        className={`header-menu-trigger${open ? ' header-menu-trigger--open' : ''}`}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        aria-label="Menu"
        onClick={() => setOpen((v) => !v)}
      >
        ···
      </button>
      {open ? (
        <div id={menuId} className="header-menu-panel" role="menu">
          {showAdmin ? (
            <NavLink
              to="/admin"
              role="menuitem"
              className={`header-menu-item${adminActive ? ' active' : ''}`}
              onClick={() => setOpen(false)}
            >
              Admin
            </NavLink>
          ) : null}
          <NavLink to="/home" role="menuitem" className="header-menu-item" onClick={() => setOpen(false)}>
            About
          </NavLink>
          <NavLink to="/privacy" role="menuitem" className="header-menu-item" onClick={() => setOpen(false)}>
            Privacy
          </NavLink>
          <NavLink to="/terms" role="menuitem" className="header-menu-item" onClick={() => setOpen(false)}>
            Terms
          </NavLink>
          {!isLoggedIn ? (
            <a
              href={APP_STORE_URL}
              role="menuitem"
              className="header-menu-item header-menu-item--store"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
            >
              App Store
            </a>
          ) : null}
          {isLoggedIn ? (
            <button
              type="button"
              role="menuitem"
              className="header-menu-item header-menu-item--button"
              onClick={() => {
                setOpen(false);
                void signOut();
              }}
            >
              Log out
            </button>
          ) : (
            <NavLink
              to="/"
              end
              role="menuitem"
              className="header-menu-item"
              onClick={() => setOpen(false)}
            >
              Log in
            </NavLink>
          )}
        </div>
      ) : null}
    </div>
  );
}
