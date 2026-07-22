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
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { usePaginatedFilters } from '../../hooks/usePaginatedFilters';
import type { AdminAnalyticsScreenProps } from './adminAnalyticsTypes';
import AdminActivityChart from './AdminActivityChart';
import AdminAnalyticsFilters from './AdminAnalyticsFilters';
import AdminDataGrid from './AdminDataGrid';
import AdminMetricCard from './AdminMetricCard';
import AdminSection, { AdminTableSummary } from './AdminSection';
import AdminSubsection from './AdminSubsection';
import AdminTabs from './AdminTabs';
import { formatWhen } from './format';
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
        loading={(loading || fetching || refreshing) && !metrics}
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

      {loading && !metrics ? <p className="admin-muted">Loading analytics…</p> : null}

      {metrics ? (
        <div className={fetching || refreshing ? 'admin-analytics-panel-wrap--refreshing' : undefined}>
          {tab === 'overview' && (
            <OverviewPanel
              metrics={metrics}
              activity={activity}
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
        </div>
      ) : null}
    </AdminSection>
  );
}

function OverviewPanel({
  metrics,
  activity,
  rangeLabel,
  versionLabel,
  postsPerActive,
  appliedVersion,
}: {
  metrics: AnalyticsMetrics;
  activity: DailyActivityRow[];
  rangeLabel: string;
  versionLabel: string;
  postsPerActive: string;
  appliedVersion: string;
}) {
  return (
    <div className="admin-analytics-panel">
      <FilterSummary rangeLabel={rangeLabel} versionLabel={versionLabel} metrics={metrics} />
      <p className="admin-muted admin-panel-lead">
        Headline metrics and daily trends for the selected range. Browse and fix individual posts on{' '}
        <Link to="/admin/posts">Posts</Link>.
      </p>

      <div className="admin-metric-grid admin-metric-grid--hero">
        <AdminMetricCard label="Signups" value={metrics.signups} sub={`Joined ${rangeLabel}`} />
        <AdminMetricCard
          label="Active posters"
          value={metrics.active_users}
          sub={`${postsPerActive} posts per active user`}
        />
        <AdminMetricCard label="Sleep posts" value={metrics.posts} sub={rangeLabel} />
      </div>

      <div className="admin-metric-grid admin-metric-grid--dense">
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

      {activity.length > 0 ? (
        <div className="admin-chart-grid admin-chart-grid--pair">
          <AdminActivityChart
            title="Daily active posters"
            rows={activity}
            series="active_users"
            color="var(--accent)"
          />
          <AdminActivityChart
            title="Daily sleep posts"
            rows={activity}
            series="posts"
            color="var(--deep)"
          />
          <AdminActivityChart
            title="Daily signups"
            rows={activity}
            series="signups"
            color="var(--rem)"
          />
          <AdminActivityChart
            title="Daily comments"
            rows={activity}
            series="comments"
            color="var(--text-muted)"
          />
        </div>
      ) : null}
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
        <div className="admin-chart-grid admin-chart-grid--pair">
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
          <RecentSignupsList
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

function RecentSignupsList({
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
  const isNarrow = useMediaQuery('(max-width: 720px)');

  if (isNarrow) {
    return (
      <SignupMobileCards
        users={users}
        usersTotal={usersTotal}
        showVersion={showVersion}
        paginationModel={paginationModel}
        onPaginationModelChange={onPaginationModelChange}
        loading={loading}
      />
    );
  }

  return (
    <RecentSignupsGrid
      users={users}
      usersTotal={usersTotal}
      showVersion={showVersion}
      paginationModel={paginationModel}
      onPaginationModelChange={onPaginationModelChange}
      loading={loading}
    />
  );
}

function SignupMobileCards({
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
  const pageCount = Math.max(1, Math.ceil(usersTotal / paginationModel.pageSize));
  const canPrev = paginationModel.page > 0;
  const canNext = paginationModel.page + 1 < pageCount;

  return (
    <div className={`admin-mobile-card-list${loading ? ' admin-mobile-card-list--loading' : ''}`}>
      <ul className="admin-mobile-card-list-items">
        {users.map((user) => (
          <li key={user.id} className="admin-mobile-card">
            <div className="admin-mobile-card-header">
              <Link to={`/admin/users?q=${encodeURIComponent(user.username)}`} className="admin-mobile-card-title">
                @{user.username}
              </Link>
              <span className="admin-mobile-card-meta">{formatWhen(user.created_at)}</span>
            </div>
            <dl className="admin-mobile-card-facts">
              <div>
                <dt>Posts</dt>
                <dd>{user.posts_count}</dd>
              </div>
              {user.is_premium ? (
                <div>
                  <dt>Premium</dt>
                  <dd>Yes</dd>
                </div>
              ) : null}
              {showVersion && user.last_app_version ? (
                <div>
                  <dt>Version</dt>
                  <dd>v{user.last_app_version}</dd>
                </div>
              ) : null}
            </dl>
            {user.email ? <p className="admin-mobile-card-email">{user.email}</p> : null}
          </li>
        ))}
      </ul>

      {pageCount > 1 ? (
        <div className="admin-mobile-card-pager">
          <button
            type="button"
            className="admin-button admin-button-ghost admin-button-sm"
            disabled={!canPrev || loading}
            onClick={() => onPaginationModelChange({ ...paginationModel, page: paginationModel.page - 1 })}
          >
            Previous
          </button>
          <span className="admin-muted">
            Page {paginationModel.page + 1} of {pageCount}
          </span>
          <button
            type="button"
            className="admin-button admin-button-ghost admin-button-sm"
            disabled={!canNext || loading}
            onClick={() => onPaginationModelChange({ ...paginationModel, page: paginationModel.page + 1 })}
          >
            Next
          </button>
        </div>
      ) : null}
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
