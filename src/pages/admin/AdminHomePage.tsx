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
    { to: '/admin/reports', label: 'Review reports', hint: pendingReports > 0 ? `${pendingReports} pending` : 'All clear' },
    { to: '/admin/users', label: 'Find a user', hint: 'Search & edit roles' },
    { to: '/admin/notify', label: 'Send notification', hint: 'Push + in-app' },
    { to: '/admin/analytics', label: 'View analytics', hint: 'Charts & tables' },
  ];

  return (
    <AdminSection
      className="admin-home"
      lead="Your at-a-glance dashboard. Jump to what needs attention."
    >
      {metrics ? (
        <div className="admin-stat-grid">
          <QuickStat
            label="Pending reports"
            value={pendingReports}
            sub={pendingReports > 0 ? 'Needs review' : 'Nothing queued'}
            to="/admin/reports"
            urgent={pendingReports > 0}
          />
          <QuickStat
            label="New users"
            value={metrics.new_users_7d}
            sub="Last 7 days"
            to="/admin/analytics"
          />
          <QuickStat
            label="Sleep posts"
            value={metrics.posts_7d}
            sub="Last 7 days"
            to="/admin/analytics"
          />
          <QuickStat
            label="Total users"
            value={metrics.total_users}
            sub={`${metrics.premium_users} premium`}
            to="/admin/users"
          />
        </div>
      ) : (
        <p className="admin-muted">Loading dashboard metrics…</p>
      )}

      <div className="admin-quick-actions">
        <p className="admin-field-group-title">Quick actions</p>
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
