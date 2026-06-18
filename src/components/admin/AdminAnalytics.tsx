import { useMemo, useState } from 'react';
import {
  type AdminTagRow,
  type AnalyticsFilters,
  type AnalyticsMetrics,
  type DailyActivityRow,
  type RecentUserRow,
} from '../../lib/admin';
import { formatRangeLabel } from '../../lib/analyticsRange';
import { ADMIN_GRID_CLIENT_FILTER_HINT } from '../../lib/adminCopy';
import { Link } from 'react-router-dom';
import { useAdmin } from '../../context/AdminContext';
import { useAdminAnalyticsBundle, useAdminRecentUsers, useAppVersions } from '../../hooks/useAdmin';
import { usePaginatedFilters } from '../../hooks/usePaginatedFilters';
import type { AdminAnalyticsScreenProps } from './adminAnalyticsTypes';
import AdminActivityChart from './AdminActivityChart';
import AdminAnalyticsFilters from './AdminAnalyticsFilters';
import AdminDataGrid from './AdminDataGrid';
import AdminMetricCard from './AdminMetricCard';
import AdminSection, { AdminTableSummary } from './AdminSection';
import AdminSubsection from './AdminSubsection';
import AdminTabs from './AdminTabs';
import { buildRecentSignupColumns } from './userGridColumns';

type AnalyticsTab = 'overview' | 'users' | 'social' | 'tags';

const TABS: { id: AnalyticsTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'users', label: 'Users' },
  { id: 'social', label: 'Social' },
  { id: 'tags', label: 'Tags' },
];

type Props = AdminAnalyticsScreenProps;

function FilterSummary({
  rangeLabel,
  versionLabel,
  metrics,
}: {
  rangeLabel: string;
  versionLabel: string;
  metrics: AnalyticsMetrics | null;
}) {
  if (!metrics) return null;
  return (
    <AdminTableSummary>
      {rangeLabel} · {versionLabel}
      {metrics.version_user_count != null ? ` · ${metrics.version_user_count} users on this version` : ''}
    </AdminTableSummary>
  );
}

export default function AdminAnalytics({
  range,
  preset,
  appVersion,
  onPresetChange,
  onRangeChange,
  onAppVersionChange,
}: Props) {
  const { refreshing } = useAdmin();
  const [tab, setTab] = useState<AnalyticsTab>('overview');

  const filters = useMemo<AnalyticsFilters>(() => ({
    start: range.start,
    end: range.end,
    appVersion: appVersion || null,
  }), [range.start, range.end, appVersion]);

  const versionsQuery = useAppVersions();
  const versions = versionsQuery.data ?? [];
  const versionsLoading = versionsQuery.isLoading;

  const {
    metrics,
    activity,
    tags,
    loading,
    fetching,
    error,
  } = useAdminAnalyticsBundle(filters);

  const rangeLabel = formatRangeLabel(range);
  const versionLabel = appVersion ? `v${appVersion}` : 'all versions';
  const postsPerActive = metrics && metrics.active_users > 0
    ? (metrics.posts / metrics.active_users).toFixed(1)
    : '—';
  const showVersion = versions.length > 0;

  return (
    <AdminSection className="admin-overview">
      <AdminAnalyticsFilters
        range={range}
        preset={preset}
        appVersion={appVersion}
        versions={versions}
        versionsLoading={versionsLoading}
        loading={loading || fetching || refreshing}
        onPresetChange={onPresetChange}
        onRangeChange={onRangeChange}
        onAppVersionChange={onAppVersionChange}
      />

      <AdminTabs
        ariaLabel="Analytics sections"
        active={tab}
        onChange={setTab}
        tabs={TABS}
      />

      {error ? <p className="admin-error admin-error-banner">{error}</p> : null}

      {!loading && metrics && (
        <>
          {tab === 'overview' && (
            <OverviewPanel
              metrics={metrics}
              rangeLabel={rangeLabel}
              versionLabel={versionLabel}
              postsPerActive={postsPerActive}
              appliedVersion={appVersion}
            />
          )}

          {tab === 'users' && (
            <UsersPanel
              metrics={metrics}
              activity={activity}
              filters={filters}
              rangeLabel={rangeLabel}
              versionLabel={versionLabel}
              showVersion={showVersion}
            />
          )}

          {tab === 'social' && (
            <SocialPanel
              metrics={metrics}
              activity={activity}
              rangeLabel={rangeLabel}
              versionLabel={versionLabel}
            />
          )}

          {tab === 'tags' && (
            <TagsPanel tags={tags} rangeLabel={rangeLabel} versionLabel={versionLabel} />
          )}
        </>
      )}
    </AdminSection>
  );
}

function OverviewPanel({
  metrics,
  rangeLabel,
  versionLabel,
  postsPerActive,
  appliedVersion,
}: {
  metrics: AnalyticsMetrics;
  rangeLabel: string;
  versionLabel: string;
  postsPerActive: string;
  appliedVersion: string;
}) {
  return (
    <div className="admin-analytics-panel">
      <FilterSummary rangeLabel={rangeLabel} versionLabel={versionLabel} metrics={metrics} />
      <p className="admin-muted admin-panel-lead">
        Headline metrics for the selected range. Browse and fix individual posts on{' '}
        <Link to="/admin/posts">Posts</Link>.
      </p>
      <div className="admin-metric-grid admin-metric-grid--dense">
        <AdminMetricCard label="Signups" value={metrics.signups} sub={`Joined ${rangeLabel}`} />
        <AdminMetricCard
          label="Active posters"
          value={metrics.active_users}
          sub={`${postsPerActive} posts per active user`}
        />
        <AdminMetricCard label="Sleep posts" value={metrics.posts} sub={rangeLabel} />
        <AdminMetricCard label="Comments" value={metrics.comments} sub={rangeLabel} />
        <AdminMetricCard label="Kudos" value={metrics.kudos} sub={rangeLabel} />
        <AdminMetricCard
          label="New friendships"
          value={metrics.friendships_accepted}
          sub="Accepted in range"
        />
        {appliedVersion ? (
          <AdminMetricCard
            label="Users on version"
            value={metrics.version_user_count ?? 0}
            sub={`Last reported v${appliedVersion}`}
          />
        ) : (
          <AdminMetricCard
            label="Version reporting"
            value={metrics.users_with_version_reported}
            sub="Users with a reported app version"
          />
        )}
      </div>
    </div>
  );
}

function UsersPanel({
  metrics,
  activity,
  filters,
  rangeLabel,
  versionLabel,
  showVersion,
}: {
  metrics: AnalyticsMetrics;
  activity: DailyActivityRow[];
  filters: AnalyticsFilters;
  rangeLabel: string;
  versionLabel: string;
  showVersion: boolean;
}) {
  const { paginationModel, setPaginationModel, filters: userFilters } = usePaginatedFilters(
    filters,
    [filters.start, filters.end, filters.appVersion],
  );

  const usersQuery = useAdminRecentUsers(userFilters);
  const users = usersQuery.data?.rows ?? [];
  const usersTotal = usersQuery.data?.total ?? 0;

  return (
    <div className="admin-analytics-panel">
      <FilterSummary rangeLabel={rangeLabel} versionLabel={versionLabel} metrics={metrics} />
      <div className="admin-metric-grid admin-metric-grid--dense">
        <AdminMetricCard label="Signups" value={metrics.signups} sub={`Joined ${rangeLabel}`} />
        <AdminMetricCard label="Active posters" value={metrics.active_users} sub="Posted at least once in range" />
      </div>

      {activity.length > 0 && (
        <div className="admin-chart-grid admin-chart-grid--single">
          <AdminActivityChart title="Daily signups" rows={activity} series="signups" color="var(--deep)" />
          <AdminActivityChart title="Daily active posters" rows={activity} series="active_users" color="var(--accent)" />
        </div>
      )}

      <AdminSubsection
        title="Signups in range"
        meta={metrics.signups > usersTotal ? `${usersTotal} matching filters` : undefined}
        footer={ADMIN_GRID_CLIENT_FILTER_HINT}
      >
        {usersTotal === 0 ? (
          <p className="admin-muted">No signups match your filters.</p>
        ) : (
          <RecentSignupsGrid
            users={users}
            usersTotal={usersTotal}
            showVersion={showVersion}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            loading={usersQuery.isFetching}
          />
        )}
      </AdminSubsection>
    </div>
  );
}

function SocialPanel({
  metrics,
  activity,
  rangeLabel,
  versionLabel,
}: {
  metrics: AnalyticsMetrics;
  activity: DailyActivityRow[];
  rangeLabel: string;
  versionLabel: string;
}) {
  return (
    <div className="admin-analytics-panel">
      <FilterSummary rangeLabel={rangeLabel} versionLabel={versionLabel} metrics={metrics} />
      <div className="admin-metric-grid admin-metric-grid--dense">
        <AdminMetricCard label="Comments" value={metrics.comments} sub={rangeLabel} />
        <AdminMetricCard label="Kudos" value={metrics.kudos} sub={rangeLabel} />
        <AdminMetricCard
          label="New friendships"
          value={metrics.friendships_accepted}
          sub="Accepted in range"
        />
      </div>

      {activity.length > 0 && (
        <div className="admin-chart-grid admin-chart-grid--single">
          <AdminActivityChart title="Daily comments" rows={activity} series="comments" color="var(--rem)" />
        </div>
      )}
    </div>
  );
}

function TagsPanel({
  tags,
  rangeLabel,
  versionLabel,
}: {
  tags: AdminTagRow[];
  rangeLabel: string;
  versionLabel: string;
}) {
  const usedTags = tags.filter((tag) => tag.usage_count > 0);
  const maxUsage = usedTags[0]?.usage_count ?? 1;

  return (
    <div className="admin-analytics-panel">
      <p className="admin-muted admin-panel-lead">
        Tag usage on posts created {rangeLabel} · {versionLabel}
      </p>
      {usedTags.length === 0 ? (
        <p className="admin-muted">No tagged posts in this range.</p>
      ) : (
        <div className="admin-tag-usage-list">
          {usedTags.map((tag) => (
            <div key={tag.value} className="admin-tag-usage-row">
              <span className="admin-tag-usage-label">{tag.emoji} {tag.label}</span>
              <span className="admin-tag-usage-bar-wrap">
                <span
                  className="admin-tag-usage-bar"
                  style={{ width: `${Math.max(8, (tag.usage_count / maxUsage) * 100)}%` }}
                />
              </span>
              <span className="admin-tag-usage-count">{tag.usage_count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RecentSignupsGrid({
  users,
  usersTotal,
  showVersion,
  paginationModel,
  onPaginationModelChange,
  loading,
}: {
  users: RecentUserRow[];
  usersTotal: number;
  showVersion: boolean;
  paginationModel: { page: number; pageSize: number };
  onPaginationModelChange: (model: { page: number; pageSize: number }) => void;
  loading: boolean;
}) {
  const columns = useMemo(
    () => buildRecentSignupColumns({ showVersion }),
    [showVersion],
  );

  return (
    <AdminDataGrid
      persistKey="admin-analytics-signups"
      rows={users}
      columns={columns}
      getRowId={(row) => row.id}
      label="Signups in range"
      loading={loading}
      serverPagination={{
        rowCount: usersTotal,
        paginationModel,
        onPaginationModelChange,
      }}
      initialState={{
        sorting: { sortModel: [{ field: 'created_at', sort: 'desc' }] },
        columns: {
          columnVisibilityModel: {
            id: false,
          },
        },
      }}
    />
  );
}
