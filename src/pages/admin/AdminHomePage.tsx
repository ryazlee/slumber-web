import { Link } from 'react-router-dom';
import AdminSection from '../../components/admin/AdminSection';
import { useAdmin } from '../../context/AdminContext';
import { formatNumber } from '../../components/admin/format';

type QuickStatProps = {
  label: string;
  value: number;
  sub?: string;
  to?: string;
  urgent?: boolean;
};

function QuickStat({ label, value, sub, to, urgent }: QuickStatProps) {
  const body = (
    <>
      <p className="admin-stat-label">{label}</p>
      <p className="admin-stat-value">{formatNumber(value)}</p>
      {sub ? <p className="admin-stat-sub">{sub}</p> : null}
    </>
  );

  if (to) {
    return (
      <Link
        to={to}
        className={`admin-stat-card admin-stat-card--link${urgent ? ' admin-stat-card--urgent' : ''}`}
      >
        {body}
      </Link>
    );
  }

  return <div className="admin-stat-card">{body}</div>;
}

export default function AdminHomePage() {
  const { metrics } = useAdmin();
  const pendingReports = (metrics?.pending_post_reports ?? 0) + (metrics?.pending_comment_reports ?? 0);

  const quickActions = [
    { to: '/admin/premium', label: 'Manage Premium', hint: 'Grants, expiry & stats' },
    { to: '/admin/users', label: 'Find a user', hint: 'Search & edit roles' },
    { to: '/admin/notify', label: 'Send notification', hint: 'Push + in-app' },
    { to: '/admin/posts', label: 'Browse posts', hint: 'Fix stages & open posts' },
    { to: '/admin/analytics', label: 'View analytics', hint: 'Charts & tables' },
    { to: '/admin/configure/tags', label: 'Edit tags', hint: 'Composer catalog' },
  ];

  return (
    <AdminSection className="admin-home">
      {pendingReports > 0 ? (
        <Link to="/admin/reports" className="admin-attention-banner">
          <span className="admin-attention-banner-title">
            {pendingReports} report{pendingReports === 1 ? '' : 's'} need review
          </span>
          <span className="admin-attention-banner-action">Open reports →</span>
        </Link>
      ) : null}

      {metrics ? (
        <div className="admin-stat-grid">
          <QuickStat
            label="Pending reports"
            value={pendingReports}
            sub={pendingReports > 0 ? 'Tap to review' : 'All clear'}
            to="/admin/reports"
            urgent={pendingReports > 0}
          />
          <QuickStat
            label="New users"
            value={metrics.new_users_7d}
            sub="Last 7 days"
            to="/admin/users"
          />
          <QuickStat
            label="Sleep posts"
            value={metrics.posts_7d}
            sub="Last 7 days"
            to="/admin/posts"
          />
          <QuickStat
            label="Premium users"
            value={metrics.premium_users}
            sub={`${metrics.total_users ? Math.round((metrics.premium_users / metrics.total_users) * 1000) / 10 : 0}% of all users`}
            to="/admin/premium"
          />
          <QuickStat
            label="Total users"
            value={metrics.total_users}
            sub="All accounts"
            to="/admin/users"
          />
        </div>
      ) : (
        <p className="admin-muted">Loading dashboard metrics…</p>
      )}

      <div className="admin-quick-actions">
        <p className="admin-field-group-title">Shortcuts</p>
        <div className="admin-quick-actions-grid">
          {quickActions.map((action) => (
            <Link key={action.to} to={action.to} className="admin-quick-action">
              <span className="admin-quick-action-label">{action.label}</span>
              <span className="admin-quick-action-hint">{action.hint}</span>
            </Link>
          ))}
        </div>
      </div>
    </AdminSection>
  );
}
