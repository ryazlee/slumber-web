import { NavLink, Outlet, useLocation } from 'react-router-dom';
import AdminMuiProvider from '../../components/admin/AdminMuiProvider';
import LoginForm from '../../components/LoginForm';
import { AdminProvider, useAdmin } from '../../context/AdminContext';
import { useAuth } from '../../context/AuthContext';
import { useIsModerator } from '../../hooks/useAdmin';

const PAGE_TITLES: Record<string, string> = {
  '/admin': 'Admin',
  '/admin/analytics': 'Analytics',
  '/admin/reports': 'Reports',
  '/admin/users': 'Users',
  '/admin/notify': 'Notify',
  '/admin/configure/tags': 'Tags',
  '/admin/configure/roles': 'Roles',
};

function AdminShell() {
  const { user, signOut } = useAuth();
  const { triggerRefresh, refreshing } = useAdmin();
  const location = useLocation();
  const isHub = location.pathname === '/admin' || location.pathname === '/admin/';
  const pageTitle = PAGE_TITLES[location.pathname] ?? 'Admin';

  return (
    <AdminMuiProvider>
    <div className="admin-page">
      <div className="admin-toolbar">
        <div>
          <p className="eyebrow">Slumber Admin</p>
          <h1 className="admin-title">{pageTitle}</h1>
          <p className="admin-muted">Signed in as {user?.email}</p>
        </div>
        <div className="admin-toolbar-actions">
          {!isHub && (
            <NavLink to="/admin" className="admin-button admin-button-ghost">
              All sections
            </NavLink>
          )}
          <button
            className="admin-button admin-button-ghost"
            type="button"
            onClick={triggerRefresh}
            disabled={refreshing}
          >
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
          <button className="admin-button admin-button-ghost" type="button" onClick={() => signOut()}>
            Sign out
          </button>
        </div>
      </div>

      <Outlet />
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
      <div className="admin-page">
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
