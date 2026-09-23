import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdmin } from '../../context/AdminContext';
import {
  useAppVersions,
  useCohortRetention,
  useHealthMetrics,
  useRepairInflatedStages,
} from '../../hooks/useAdmin';
import AdminCohortChart from './AdminCohortChart';
import AdminMetricCard from './AdminMetricCard';
import AdminSnapshotCommunity from './AdminSnapshotCommunity';
import AdminSubsection from './AdminSubsection';
import AdminVersionChart from './AdminVersionChart';
import { formatNumber, metricDelta } from './format';

type HealthWindow = 1 | 7 | 30;

const HEALTH_WINDOW_CHIPS: { days: HealthWindow; label: string }[] = [
  { days: 1, label: 'Day' },
  { days: 7, label: 'Week' },
  { days: 30, label: 'Month' },
];

function pct(part: number, whole: number): string {
  if (!whole) return '0%';
  return `${Math.round((part / whole) * 1000) / 10}%`;
}

function healthWindowLabel(days: number): string {
  if (days === 1) return '1 day';
  return `${days} days`;
}

function priorPeriodLabel(days: HealthWindow): string {
  if (days === 1) return 'vs prior day';
  if (days === 7) return 'vs prior week';
  return 'vs prior 30d';
}

function deltaProps(
  current: number,
  previous: number | undefined,
  label: string,
  invertDelta = false,
) {
  const delta = metricDelta(current, previous);
  if (delta == null || previous == null) return {};
  return { delta, previous, deltaLabel: label, invertDelta };
}

export default function AdminHealthSnapshot() {
  const { metrics } = useAdmin();
  const [windowDays, setWindowDays] = useState<HealthWindow>(7);
  const healthQuery = useHealthMetrics(windowDays);
  const versionsQuery = useAppVersions();
  const cohortQuery = useCohortRetention(8);
  const repairMutation = useRepairInflatedStages();

  const health = healthQuery.data ?? null;
  const versions = versionsQuery.data ?? [];
  const cohort = cohortQuery.data ?? [];
  const pendingReports = (metrics?.pending_post_reports ?? 0) + (metrics?.pending_comment_reports ?? 0);
  const windowLabel = healthWindowLabel(windowDays);

  const dreamRate = health && health.engagement.posts > 0
    ? pct(health.engagement.posts_with_dreams, health.engagement.posts)
    : '—';
  const commentedRate = health
    && typeof health.engagement.posts_with_comments === 'number'
    && health.engagement.posts > 0
    ? pct(health.engagement.posts_with_comments, health.engagement.posts)
    : null;
  const kudosRate = health
    && typeof health.engagement.posts_with_kudos === 'number'
    && health.engagement.posts > 0
    ? pct(health.engagement.posts_with_kudos, health.engagement.posts)
    : null;
  const privateRate = health
    && typeof health.engagement.private_posts === 'number'
    && health.engagement.posts > 0
    ? pct(health.engagement.private_posts, health.engagement.posts)
    : null;
  const postsPerActive = health && health.engagement.active_posters > 0
    ? (health.engagement.posts / health.engagement.active_posters).toFixed(1)
    : '—';
  const wauMau = health && health.retention.mau > 0
    ? pct(health.retention.wau, health.retention.mau)
    : '—';
  const inflatedWindow = health?.data_quality.inflated_stage_posts_window ?? 0;
  const inflatedTotal = health?.data_quality.inflated_stage_posts_total ?? 0;
  const previous = health?.previous;
  const vsPrior = priorPeriodLabel(windowDays);

  const repairAllInflated = async () => {
    if (!window.confirm(
      `Repair up to 50 inflated wearable posts${inflatedWindow ? ` from the last ${windowLabel}` : ''}?`,
    )) return;
    try {
      const result = await repairMutation.mutateAsync({ limit: 50, days: windowDays });
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
    <div className="admin-home admin-analytics-panel">
      {pendingReports > 0 ? (
        <Link to="/admin/reports" className="admin-attention-banner">
          <span className="admin-attention-banner-title">
            {pendingReports} report{pendingReports === 1 ? '' : 's'} need review
          </span>
          <span className="admin-attention-banner-action">Open reports →</span>
        </Link>
      ) : null}

      <div
        className={`admin-analytics-bar${healthQuery.isFetching ? ' admin-analytics-bar--loading' : ''}`}
        aria-busy={healthQuery.isFetching || undefined}
      >
        <div className="admin-tabs admin-tabs-sub" role="group" aria-label="Health window">
          {HEALTH_WINDOW_CHIPS.map((item) => (
            <button
              key={item.days}
              type="button"
              className={windowDays === item.days ? 'admin-tab active' : 'admin-tab'}
              onClick={() => setWindowDays(item.days)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {inflatedWindow > 0 ? (
        <div className="admin-attention-banner admin-attention-banner--inline">
          <span className="admin-attention-banner-title">
            {inflatedWindow} wearable post{inflatedWindow === 1 ? '' : 's'} in the last {windowLabel} have inflated stage minutes
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
          <AdminSubsection title={`Activation (${windowLabel})`} className="admin-health-block">
            <div className="admin-metric-grid admin-metric-grid--dense">
              <AdminMetricCard
                label="Signups"
                value={health.activation.signups}
                sub={`${health.activation.first_time_posters} first-time posters`}
                to="/admin/users?filter=new"
                {...deltaProps(health.activation.signups, previous?.activation.signups, vsPrior)}
              />
              <AdminMetricCard
                label="Never logged sleep"
                value={health.activation.never_posted_in_window}
                sub={health.activation.never_posted_in_window > 0 ? 'View users' : 'In signup window'}
                to="/admin/users?filter=never-posted"
                {...deltaProps(
                  health.activation.never_posted_in_window,
                  previous?.activation.never_posted_in_window,
                  vsPrior,
                  true,
                )}
              />
              <AdminMetricCard
                label="Inactive posters"
                value={health.activation.inactive_posters}
                sub="No post in 14 days"
                to="/admin/users?filter=inactive"
              />
              <AdminMetricCard
                label="Never posted (all time)"
                value={health.activation.never_posted_total}
                sub="Accounts with zero sleep logs"
                to="/admin/users?filter=never-posted"
              />
            </div>
          </AdminSubsection>

          <AdminSubsection title={`Engagement (${windowLabel})`} className="admin-health-block">
            <div className="admin-metric-grid admin-metric-grid--dense">
              <AdminMetricCard
                label="Sleep posts"
                value={health.engagement.posts}
                sub={`${health.engagement.wearable_posts} wearable · ${health.engagement.manual_posts} manual`}
                to="/admin/posts"
                {...deltaProps(health.engagement.posts, previous?.engagement.posts, vsPrior)}
              />
              <AdminMetricCard
                label="Active posters"
                value={health.engagement.active_posters}
                sub={`${postsPerActive} posts per poster`}
                to="/admin/users"
                {...deltaProps(health.engagement.active_posters, previous?.engagement.active_posters, vsPrior)}
              />
              <AdminMetricCard
                label="Dream log rate"
                value={dreamRate}
                sub={`${health.engagement.posts_with_dreams} with dream text`}
                to="/admin/dreams"
              />
              <AdminMetricCard
                label="Comments"
                value={health.engagement.comments}
                sub={[
                  commentedRate ? `${commentedRate} of nights` : null,
                  typeof health.engagement.commenters === 'number'
                    ? `${formatNumber(health.engagement.commenters)} people`
                    : null,
                ].filter(Boolean).join(' · ') || windowLabel}
                {...deltaProps(health.engagement.comments, previous?.engagement.comments, vsPrior)}
              />
              <AdminMetricCard
                label="Kudos"
                value={health.engagement.kudos}
                sub={kudosRate ? `${kudosRate} of nights got kudos` : windowLabel}
                {...deltaProps(health.engagement.kudos, previous?.engagement.kudos, vsPrior)}
              />
              {typeof health.engagement.nap_posts === 'number' ? (
                <AdminMetricCard
                  label="Naps"
                  value={health.engagement.nap_posts}
                  sub={typeof health.engagement.overnight_posts === 'number'
                    ? `${formatNumber(health.engagement.overnight_posts)} overnight`
                    : windowLabel}
                  {...deltaProps(health.engagement.nap_posts, previous?.engagement.nap_posts, vsPrior)}
                />
              ) : null}
              {typeof health.engagement.private_posts === 'number' ? (
                <AdminMetricCard
                  label="Private logs"
                  value={health.engagement.private_posts}
                  sub={privateRate ? `${privateRate} of nights` : windowLabel}
                  {...deltaProps(health.engagement.private_posts, previous?.engagement.private_posts, vsPrior)}
                />
              ) : null}
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
              {typeof health.engagement.friendships_accepted === 'number' ? (
                <AdminMetricCard
                  label="New friendships"
                  value={health.engagement.friendships_accepted}
                  sub="Accepted in this window"
                  {...deltaProps(
                    health.engagement.friendships_accepted,
                    previous?.engagement.friendships_accepted,
                    vsPrior,
                  )}
                />
              ) : null}
              {typeof health.engagement.friend_requests === 'number' ? (
                <AdminMetricCard
                  label="Friend requests"
                  value={health.engagement.friend_requests}
                  sub="Still waiting, sent in this window"
                  {...deltaProps(
                    health.engagement.friend_requests,
                    previous?.engagement.friend_requests,
                    vsPrior,
                  )}
                />
              ) : null}
              {typeof health.engagement.club_joins === 'number' ? (
                <AdminMetricCard
                  label="Club joins"
                  value={health.engagement.club_joins}
                  sub={typeof health.engagement.clubs_created === 'number'
                    ? `${formatNumber(health.engagement.clubs_created)} new clubs`
                    : windowLabel}
                  to="/admin/community"
                  {...deltaProps(health.engagement.club_joins, previous?.engagement.club_joins, vsPrior)}
                />
              ) : null}
              {typeof health.engagement.challenges_created === 'number' ? (
                <AdminMetricCard
                  label="New challenges"
                  value={health.engagement.challenges_created}
                  sub="Created in this window"
                  to="/admin/community"
                  {...deltaProps(
                    health.engagement.challenges_created,
                    previous?.engagement.challenges_created,
                    vsPrior,
                  )}
                />
              ) : null}
              {typeof health.engagement.buddy_tags === 'number' ? (
                <AdminMetricCard
                  label="Sleep buddy tags"
                  value={health.engagement.buddy_tags}
                  sub="Friends tagged on a night"
                  {...deltaProps(health.engagement.buddy_tags, previous?.engagement.buddy_tags, vsPrior)}
                />
              ) : null}
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
                    sub={`${metrics.pending_challenges} pending`}
                    to="/admin/community"
                  />
                  <AdminMetricCard
                    label="Premium"
                    value={metrics.premium_users}
                    sub={`${metrics.total_users ? pct(metrics.premium_users, metrics.total_users) : '0%'} of ${formatNumber(metrics.total_users)} users`}
                    to="/admin/premium"
                  />
                </>
              ) : null}
            </div>
          </AdminSubsection>
        </>
      ) : (
        <p className="admin-muted">Loading health metrics…</p>
      )}

      <AdminSnapshotCommunity />

      <div className="admin-chart-grid admin-chart-grid--pair">
        <AdminVersionChart versions={versions} />
        <AdminCohortChart rows={cohort} />
      </div>
    </div>
  );
}
