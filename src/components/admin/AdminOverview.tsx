import type { DashboardMetrics, RecentUserRow } from '../../lib/admin';
import { formatNumber, formatWhen } from './format';

type Props = {
  metrics: DashboardMetrics | null;
  users: RecentUserRow[];
  loading: boolean;
  error: string | null;
};

function MetricCard({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <div className="admin-metric-card">
      <p className="admin-metric-label">{label}</p>
      <p className="admin-metric-value">{formatNumber(value)}</p>
      {sub ? <p className="admin-metric-sub">{sub}</p> : null}
    </div>
  );
}

export default function AdminOverview({ metrics, users, loading, error }: Props) {
  if (loading && !metrics) {
    return <p className="admin-muted">Loading metrics…</p>;
  }

  if (error) {
    return <p className="admin-error admin-error-banner">{error}</p>;
  }

  if (!metrics) return null;

  return (
    <div className="admin-overview">
      <div className="admin-metric-grid">
        <MetricCard label="Total users" value={metrics.total_users} sub={`+${metrics.new_users_7d} this week`} />
        <MetricCard label="Active users (7d)" value={metrics.active_users_7d} sub={`${metrics.active_users_30d} in 30d`} />
        <MetricCard label="Sleep posts" value={metrics.total_posts} sub={`+${metrics.posts_7d} this week`} />
        <MetricCard label="Comments" value={metrics.total_comments} sub={`+${metrics.comments_7d} this week`} />
        <MetricCard label="Kudos" value={metrics.total_kudos} sub={`+${metrics.kudos_7d} this week`} />
        <MetricCard label="Friendships" value={metrics.friendships} />
        <MetricCard label="Active challenges" value={metrics.active_challenges} />
        <MetricCard label="Premium users" value={metrics.premium_users} />
        <MetricCard
          label="Open reports"
          value={metrics.pending_post_reports + metrics.pending_comment_reports}
          sub={`${metrics.pending_post_reports} posts · ${metrics.pending_comment_reports} comments`}
        />
      </div>

      <section className="admin-section">
        <h2 className="admin-section-title">Recent signups</h2>
        {users.length === 0 ? (
          <p className="admin-muted">No users yet.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table admin-table--cards">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Joined</th>
                  <th>Posts</th>
                  <th>Roles</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td data-label="Username">@{u.username}</td>
                    <td data-label="Joined">{formatWhen(u.created_at)}</td>
                    <td data-label="Posts">{u.posts_count}</td>
                    <td data-label="Roles" className="admin-td-stack">
                      {u.is_premium && !u.user_roles?.includes('premium') ? 'premium ' : ''}
                      {u.user_roles?.length ? u.user_roles.join(', ') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
