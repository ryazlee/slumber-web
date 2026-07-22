import { useCallback, useEffect, useId, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import AdminMuiProvider from '../../components/admin/AdminMuiProvider';
import AdminNav, { ADMIN_PAGE_TITLES } from '../../components/admin/AdminNav';
import LoginForm from '../../components/LoginForm';
import { AdminProvider, useAdmin } from '../../context/AdminContext';
import { useAuth } from '../../context/AuthContext';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { useIsModerator } from '../../hooks/useAdmin';
import { useMediaQuery } from '../../hooks/useMediaQuery';

function AdminShell() {
  const { user, signOut } = useAuth();
  const { metrics, triggerRefresh, refreshing } = useAdmin();
  const location = useLocation();
  const pageTitle = ADMIN_PAGE_TITLES[location.pathname] ?? 'Admin';
  const isNarrow = useMediaQuery('(max-width: 900px)');
  const [navOpen, setNavOpen] = useState(false);
  const navId = useId();

  const pendingReports = (metrics?.pending_post_reports ?? 0) + (metrics?.pending_comment_reports ?? 0);

  const closeNav = useCallback(() => setNavOpen(false), []);
  const openNav = useCallback(() => setNavOpen(true), []);

  useEffect(() => {
    closeNav();
  }, [location.pathname, closeNav]);

  useEffect(() => {
    if (!isNarrow) closeNav();
  }, [isNarrow, closeNav]);

  useEscapeKey(navOpen && isNarrow, closeNav);

  useEffect(() => {
    if (!(navOpen && isNarrow)) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [navOpen, isNarrow]);

  return (
    <AdminMuiProvider>
      <div className={`admin-shell${navOpen && isNarrow ? ' admin-shell--nav-open' : ''}`}>
        {isNarrow ? (
          <header className="admin-mobile-bar">
            <div className="admin-mobile-bar-brand">
              <p className="admin-sidebar-eyebrow">Slumber Admin</p>
              <h1 className="admin-mobile-bar-title">{pageTitle}</h1>
            </div>
            <button
              type="button"
              className="admin-button admin-button-ghost admin-button-sm admin-mobile-menu-btn"
              aria-expanded={navOpen}
              aria-controls={navId}
              onClick={navOpen ? closeNav : openNav}
            >
              {navOpen ? 'Close' : 'Menu'}
              {!navOpen && pendingReports > 0 ? (
                <span className="admin-nav-badge">{pendingReports}</span>
              ) : null}
            </button>
          </header>
        ) : null}

        {navOpen && isNarrow ? (
          <button
            type="button"
            className="admin-nav-backdrop"
            aria-label="Close navigation"
            onClick={closeNav}
          />
        ) : null}

        <aside
          id={navId}
          className={`admin-sidebar${navOpen && isNarrow ? ' admin-sidebar--open' : ''}`}
          aria-hidden={isNarrow && !navOpen ? true : undefined}
          inert={isNarrow && !navOpen ? true : undefined}
        >
          <div className="admin-sidebar-brand">
            <p className="admin-sidebar-eyebrow">Slumber</p>
            <p className="admin-sidebar-title">Admin</p>
          </div>

          <AdminNav onNavigate={isNarrow ? closeNav : undefined} />

          <div className="admin-sidebar-footer">
            <p className="admin-sidebar-user" title={user?.email ?? undefined}>
              {user?.email}
            </p>
            <div className="admin-sidebar-actions">
              <button
                className="admin-button admin-button-ghost admin-button-sm"
                type="button"
                onClick={triggerRefresh}
                disabled={refreshing}
              >
                {refreshing ? 'Refreshing…' : 'Refresh'}
              </button>
              <button
                className="admin-button admin-button-ghost admin-button-sm"
                type="button"
                onClick={() => signOut()}
              >
                Sign out
              </button>
            </div>
          </div>
        </aside>

        <main className="admin-main">
          {!isNarrow ? (
            <header className="admin-main-header">
              <h1 className="admin-main-title">{pageTitle}</h1>
            </header>
          ) : null}
          <div className="admin-main-content">
            <Outlet />
          </div>
        </main>
      </div>
    </AdminMuiProvider>
  );
}

function AdminGate() {
  const { user, loading: authLoading, signOut } = useAuth();
  const sessionEmail = user?.email ?? null;
  const moderatorQuery = useIsModerator(Boolean(sessionEmail) && !authLoading);
  const isModerator = moderatorQuery.data === true;
  const moderatorChecked = !sessionEmail || moderatorQuery.isFetched;

  if (authLoading || (sessionEmail && !moderatorChecked)) {
    return (
      <div className="admin-page admin-page--centered">
        <p className="admin-muted">Loading…</p>
      </div>
    );
  }

  if (!sessionEmail) {
    return (
      <div className="admin-page admin-page--centered">
        <LoginForm
          eyebrow="Admin"
          description="Requires a role with is_admin in role_definitions (e.g. developer, founder) on your profile."
        />
      </div>
    );
  }

  if (!isModerator) {
    return (
      <div className="admin-page admin-page--centered">
        <div className="admin-card admin-card-narrow">
          <h1>Access denied</h1>
          <p className="lead admin-lead">
            Signed in as {sessionEmail}. Assign an admin role (e.g. <code>developer</code>) in <code>profiles.user_roles</code>.
          </p>
          <button className="admin-button" type="button" onClick={() => signOut()}>Sign out</button>
        </div>
      </div>
    );
  }

  return (
    <AdminProvider enabled>
      <AdminShell />
    </AdminProvider>
  );
}

export default function AdminLayout() {
  return <AdminGate />;
}
