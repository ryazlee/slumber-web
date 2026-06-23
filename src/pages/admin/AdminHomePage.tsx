import { Link } from 'react-router-dom';
import AdminCohortChart from '../../components/admin/AdminCohortChart';
import AdminMetricCard from '../../components/admin/AdminMetricCard';
import AdminSection from '../../components/admin/AdminSection';
import AdminSubsection from '../../components/admin/AdminSubsection';
import AdminVersionChart from '../../components/admin/AdminVersionChart';
import { formatNumber } from '../../components/admin/format';
import { useAdmin } from '../../context/AdminContext';
import {
  useAppVersions,
  useCohortRetention,
  useHealthMetrics,
  useRepairInflatedStages,
} from '../../hooks/useAdmin';

function pct(part: number, whole: number): string {
  if (!whole) return '0%';
  return `${Math.round((part / whole) * 1000) / 10}%`;
}

export default function AdminHomePage() {
  const { metrics } = useAdmin();
  const healthQuery = useHealthMetrics(7);
  const versionsQuery = useAppVersions();
  const cohortQuery = useCohortRetention(8);
  const repairMutation = useRepairInflatedStages();

  const health = healthQuery.data ?? null;
  const versions = versionsQuery.data ?? [];
  const cohort = cohortQuery.data ?? [];
  const pendingReports = (metrics?.pending_post_reports ?? 0) + (metrics?.pending_comment_reports ?? 0);

  const dreamRate = health && health.engagement.posts > 0
    ? pct(health.engagement.posts_with_dreams, health.engagement.posts)
    : '—';
  const postsPerActive = health && health.engagement.active_posters > 0
    ? (health.engagement.posts / health.engagement.active_posters).toFixed(1)
    : '—';
  const wauMau = health && health.retention.mau > 0
    ? pct(health.retention.wau, health.retention.mau)
    : '—';
  const inflatedWindow = health?.data_quality.inflated_stage_posts_window ?? 0;
  const inflatedTotal = health?.data_quality.inflated_stage_posts_total ?? 0;

  const repairAllInflated = async () => {
    if (!window.confirm(`Repair up to 50 inflated wearable posts${inflatedWindow ? ' from the last 7 days' : ''}?`)) return;
    try {
      const result = await repairMutation.mutateAsync({ limit: 50, days: 7 });
      const failed = result.errors.length;
      window.alert(
        failed
          ? `Repaired ${result.fixed}, unchanged ${result.skipped}, failed ${failed}.`
          : `Repaired ${result.fixed} post(s)${result.skipped ? ` · ${result.skipped} unchanged` : ''}.`,
      );
    } catch (err: unknown) {
      window.alert(err instanceof Error ? err.message : 'Repair failed.');
    }
  };

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

      {inflatedWindow > 0 ? (
        <div className="admin-attention-banner admin-attention-banner--inline">
          <span className="admin-attention-banner-title">
            {inflatedWindow} wearable post{inflatedWindow === 1 ? '' : 's'} in the last 7 days have inflated stage minutes
            {inflatedTotal > inflatedWindow ? ` (${inflatedTotal} total)` : ''}
          </span>
          <span className="admin-attention-banner-actions">
            <Link to="/admin/posts" className="admin-attention-banner-action">Browse posts</Link>
            <button
              type="button"
              className="admin-button admin-button-sm admin-button-ghost"
              disabled={repairMutation.isPending}
              onClick={() => void repairAllInflated()}
            >
              {repairMutation.isPending ? 'Repairing…' : 'Repair 50'}
            </button>
          </span>
        </div>
      ) : null}

      {health ? (
        <>
          <AdminSubsection title="Activation (7 days)" className="admin-health-block">
            <div className="admin-metric-grid admin-metric-grid--dense">
              <AdminMetricCard
                label="Signups"
                value={health.activation.signups}
                sub={`${health.activation.first_time_posters} first-time posters`}
              />
              <AdminMetricCard
                label="Never logged sleep"
                value={health.activation.never_posted_in_window}
                sub={(
                  <Link to="/admin/users?filter=never-posted">
                    {health.activation.never_posted_in_window > 0 ? 'View users →' : 'In signup window'}
                  </Link>
                )}
              />
              <AdminMetricCard
                label="Inactive posters"
                value={health.activation.inactive_posters}
                sub={(
                  <Link to="/admin/users?filter=inactive">
                    No post in 14 days · view →
                  </Link>
                )}
              />
              <AdminMetricCard
                label="Never posted (all time)"
                value={health.activation.never_posted_total}
                sub="Accounts with zero sleep logs"
              />
            </div>
          </AdminSubsection>

          <AdminSubsection title="Engagement (7 days)" className="admin-health-block">
            <div className="admin-metric-grid admin-metric-grid--dense">
              <AdminMetricCard
                label="Sleep posts"
                value={health.engagement.posts}
                sub={`${health.engagement.wearable_posts} wearable · ${health.engagement.manual_posts} manual`}
              />
              <AdminMetricCard
                label="Active posters"
                value={health.engagement.active_posters}
                sub={`${postsPerActive} posts per poster`}
              />
              <AdminMetricCard label="Comments" value={health.engagement.comments} sub="In range" />
              <AdminMetricCard label="Kudos" value={health.engagement.kudos} sub="In range" />
              <AdminMetricCard
                label="Dream log rate"
                value={dreamRate}
                sub={`${health.engagement.posts_with_dreams} with dream text`}
              />
              <AdminMetricCard
                label="Push enabled"
                value={health.engagement.users_with_push}
                sub="Users with device tokens"
              />
            </div>
          </AdminSubsection>

          <AdminSubsection title="Retention & social" className="admin-health-block">
            <div className="admin-metric-grid admin-metric-grid--dense">
              <AdminMetricCard
                label="WAU / MAU"
                value={wauMau}
                sub={`${health.retention.wau} weekly · ${health.retention.mau} monthly posters`}
              />
              {metrics ? (
                <>
                  <AdminMetricCard
                    label="Friendships"
                    value={metrics.friendships}
                    sub={`${metrics.pending_friend_requests} pending requests`}
                  />
                  <AdminMetricCard
                    label="Challenges"
                    value={metrics.active_challenges}
                    sub={(
                      <>
                        {metrics.pending_challenges} pending ·{' '}
                        <Link to="/admin/community">Community →</Link>
                      </>
                    )}
                  />
                  <AdminMetricCard
                    label="Premium"
                    value={metrics.premium_users}
                    sub={`${metrics.total_users ? pct(metrics.premium_users, metrics.total_users) : '0%'} of ${formatNumber(metrics.total_users)} users`}
                  />
                </>
              ) : null}
            </div>
          </AdminSubsection>
        </>
      ) : (
        <p className="admin-muted">Loading health metrics…</p>
      )}

      <div className="admin-chart-grid admin-chart-grid--pair">
        <AdminVersionChart versions={versions} />
        <AdminCohortChart rows={cohort} />
      </div>

      <div className="admin-quick-actions">
        <p className="admin-field-group-title">Shortcuts</p>
        <div className="admin-quick-actions-grid">
          {[
            { to: '/admin/reports', label: 'Review reports', hint: 'Dismiss or remove content' },
            { to: '/admin/users', label: 'Find a user', hint: 'Detail panel · roles · suspend' },
            { to: '/admin/posts', label: 'Browse posts', hint: 'Fix stages · soft-delete' },
            { to: '/admin/community', label: 'Community', hint: 'Challenges & clubs' },
            { to: '/admin/analytics', label: 'Analytics', hint: 'Charts & date filters' },
            { to: '/admin/notify', label: 'Notify', hint: 'DM or broadcast' },
          ].map((action) => (
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
