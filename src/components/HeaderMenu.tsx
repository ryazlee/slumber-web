import { useEffect, useId, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

type Props = {
  showAdmin: boolean;
  adminActive: boolean;
  variant?: 'dots' | 'hamburger';
};

export default function HeaderMenu({ showAdmin, adminActive, variant = 'dots' }: Props) {
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
        className={`header-menu-trigger${open ? ' header-menu-trigger--open' : ''}${
          variant === 'hamburger' ? ' header-menu-trigger--hamburger' : ''
        }`}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        aria-label="Menu"
        onClick={() => setOpen((v) => !v)}
      >
        {variant === 'hamburger' ? (
          <span className="header-menu-bars" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        ) : (
          '···'
        )}
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
          {isLoggedIn ? (
            <NavLink to="/download" role="menuitem" className="header-menu-item" onClick={() => setOpen(false)}>
              Download
            </NavLink>
          ) : null}
          <NavLink to="/contact" role="menuitem" className="header-menu-item" onClick={() => setOpen(false)}>
            Contact
          </NavLink>
          <NavLink to="/privacy" role="menuitem" className="header-menu-item" onClick={() => setOpen(false)}>
            Privacy
          </NavLink>
          <NavLink to="/terms" role="menuitem" className="header-menu-item" onClick={() => setOpen(false)}>
            Terms
          </NavLink>
          <NavLink to="/delete-account" role="menuitem" className="header-menu-item" onClick={() => setOpen(false)}>
            Delete account
          </NavLink>
          <NavLink to="/delete-data" role="menuitem" className="header-menu-item" onClick={() => setOpen(false)}>
            Delete data
          </NavLink>
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
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
