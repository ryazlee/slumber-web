import { useCallback, useEffect, useMemo, useState } from 'react';
import { type GridColDef } from '@mui/x-data-grid';
import {
  fetchAdminTags,
  fetchAnalyticsMetrics,
  fetchAppVersions,
  fetchDailyActivity,
  fetchRecentPosts,
  fetchRecentUsers,
  formatAdminRpcError,
  type AdminTagRow,
  type AnalyticsMetrics,
  type AppVersionRow,
  type DailyActivityRow,
  type RecentPostRow,
  type RecentUserRow,
} from '../../lib/admin';
import {
  formatRangeLabel,
  type DateRange,
  type RangePreset,
} from '../../lib/analyticsRange';
import { useAdmin } from '../../context/AdminContext';
import AdminActivityChart from './AdminActivityChart';
import AdminAnalyticsFilters from './AdminAnalyticsFilters';
import AdminDataGrid from './AdminDataGrid';
import { dateColumn } from './dateColumn';
import { formatNumber } from './format';

type AnalyticsTab = 'overview' | 'users' | 'posts' | 'social' | 'tags';

const TABS: { id: AnalyticsTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'users', label: 'Users' },
  { id: 'posts', label: 'Posts' },
  { id: 'social', label: 'Social' },
  { id: 'tags', label: 'Tags' },
];

type Props = {
  range: DateRange;
  preset: RangePreset;
  appVersion: string;
  onPresetChange: (preset: RangePreset) => void;
  onRangeChange: (range: DateRange) => void;
  onAppVersionChange: (version: string) => void;
  listLimit: number;
};

function formatSleepMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return m ? `${h}h ${m}m` : `${h}h`;
}

function MetricCard({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <div className="admin-metric-card">
      <p className="admin-metric-label">{label}</p>
      <p className="admin-metric-value">{formatNumber(value)}</p>
      {sub ? <p className="admin-metric-sub">{sub}</p> : null}
    </div>
  );
}

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
    <p className="admin-muted admin-filter-summary">
      {rangeLabel} · {versionLabel}
      {metrics.version_user_count != null ? ` · ${metrics.version_user_count} users on this version` : ''}
    </p>
  );
}

export default function AdminAnalytics({
  range,
  preset,
  appVersion,
  onPresetChange,
  onRangeChange,
  onAppVersionChange,
  listLimit,
}: Props) {
  const { refreshKey, refreshing } = useAdmin();
  const [tab, setTab] = useState<AnalyticsTab>('overview');
  const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null);
  const [activity, setActivity] = useState<DailyActivityRow[]>([]);
  const [users, setUsers] = useState<RecentUserRow[]>([]);
  const [posts, setPosts] = useState<RecentPostRow[]>([]);
  const [tags, setTags] = useState<AdminTagRow[]>([]);
  const [versions, setVersions] = useState<AppVersionRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [versionsLoading, setVersionsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setVersionsLoading(true);
    fetchAppVersions()
      .then((rows) => {
        if (!cancelled) setVersions(rows);
      })
      .catch(() => {
        if (!cancelled) setVersions([]);
      })
      .finally(() => {
        if (!cancelled) setVersionsLoading(false);
      });
    return () => { cancelled = true; };
  }, [refreshKey]);

  const loadAnalytics = useCallback(async (nextRange: DateRange, version: string) => {
    setLoading(true);
    setError(null);
    const filters = {
      start: nextRange.start,
      end: nextRange.end,
      appVersion: version || null,
      listLimit,
    };
    const [metricsR, activityR, usersR, postsR, tagsR] = await Promise.allSettled([
      fetchAnalyticsMetrics(filters),
      fetchDailyActivity(filters),
      fetchRecentUsers(filters),
      fetchRecentPosts(filters),
      fetchAdminTags(filters),
    ]);

    const warnings: string[] = [];

    if (metricsR.status === 'fulfilled') {
      setMetrics(metricsR.value);
    } else {
      console.error('Admin analytics metrics failed:', metricsR.reason);
      setError(formatAdminRpcError('Metrics', metricsR.reason));
      setLoading(false);
      return;
    }

    if (activityR.status === 'fulfilled') {
      setActivity(activityR.value);
    } else {
      console.error('Admin analytics activity failed:', activityR.reason);
      setError(formatAdminRpcError('Daily activity', activityR.reason));
      setLoading(false);
      return;
    }

    if (usersR.status === 'fulfilled') {
      setUsers(usersR.value);
    } else {
      console.error('Admin analytics users failed:', usersR.reason);
      warnings.push(formatAdminRpcError('Users', usersR.reason));
      setUsers([]);
    }

    if (postsR.status === 'fulfilled') {
      setPosts(postsR.value);
    } else {
      console.error('Admin analytics posts failed:', postsR.reason);
      warnings.push(formatAdminRpcError('Posts', postsR.reason));
      setPosts([]);
    }

    if (tagsR.status === 'fulfilled') {
      setTags([...tagsR.value].sort((a, b) => b.usage_count - a.usage_count));
    } else {
      console.error('Admin analytics tags failed:', tagsR.reason);
      warnings.push(formatAdminRpcError('Tags', tagsR.reason));
      setTags([]);
    }

    setError(warnings.length > 0 ? warnings.join(' · ') : null);
    setLoading(false);
  }, [listLimit]);

  useEffect(() => {
    loadAnalytics(range, appVersion);
  }, [range, appVersion, refreshKey, loadAnalytics]);

  const rangeLabel = formatRangeLabel(range);
  const versionLabel = appVersion ? `v${appVersion}` : 'all versions';
  const postsPerActive = metrics && metrics.active_users > 0
    ? (metrics.posts / metrics.active_users).toFixed(1)
    : '—';
  const showVersion = versions.length > 0;

  return (
    <div className="admin-overview">
      <AdminAnalyticsFilters
        range={range}
        preset={preset}
        appVersion={appVersion}
        versions={versions}
        versionsLoading={versionsLoading}
        loading={loading || refreshing}
        onPresetChange={onPresetChange}
        onRangeChange={onRangeChange}
        onAppVersionChange={onAppVersionChange}
      />

      <div className="admin-tabs" role="tablist" aria-label="Analytics sections">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            className={tab === item.id ? 'admin-tab active' : 'admin-tab'}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {error && <p className="admin-error admin-error-banner">{error}</p>}

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
              users={users}
              listLimit={listLimit}
              rangeLabel={rangeLabel}
              versionLabel={versionLabel}
              showVersion={showVersion}
            />
          )}

          {tab === 'posts' && (
            <PostsPanel
              metrics={metrics}
              activity={activity}
              posts={posts}
              listLimit={listLimit}
              rangeLabel={rangeLabel}
              versionLabel={versionLabel}
              postsPerActive={postsPerActive}
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
    </div>
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
        Headline metrics for the selected range. Open a tab above for charts and detail tables.
      </p>
      <div className="admin-metric-grid admin-metric-grid--dense">
        <MetricCard label="Signups" value={metrics.signups} sub={`Joined ${rangeLabel}`} />
        <MetricCard
          label="Active posters"
          value={metrics.active_users}
          sub={`${postsPerActive} posts per active user`}
        />
        <MetricCard label="Sleep posts" value={metrics.posts} sub={rangeLabel} />
        <MetricCard label="Comments" value={metrics.comments} sub={rangeLabel} />
        <MetricCard label="Kudos" value={metrics.kudos} sub={rangeLabel} />
        <MetricCard
          label="New friendships"
          value={metrics.friendships_accepted}
          sub="Accepted in range"
        />
        {appliedVersion ? (
          <MetricCard
            label="Users on version"
            value={metrics.version_user_count ?? 0}
            sub={`Last reported v${appliedVersion}`}
          />
        ) : (
          <MetricCard
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
  users,
  listLimit,
  rangeLabel,
  versionLabel,
  showVersion,
}: {
  metrics: AnalyticsMetrics;
  activity: DailyActivityRow[];
  users: RecentUserRow[];
  listLimit: number;
  rangeLabel: string;
  versionLabel: string;
  showVersion: boolean;
}) {
  return (
    <div className="admin-analytics-panel">
      <FilterSummary rangeLabel={rangeLabel} versionLabel={versionLabel} metrics={metrics} />
      <div className="admin-metric-grid admin-metric-grid--dense">
        <MetricCard label="Signups" value={metrics.signups} sub={`Joined ${rangeLabel}`} />
        <MetricCard label="Active posters" value={metrics.active_users} sub="Posted at least once in range" />
      </div>

      {activity.length > 0 && (
        <div className="admin-chart-grid admin-chart-grid--single">
          <AdminActivityChart title="Daily signups" rows={activity} series="signups" color="var(--deep)" />
          <AdminActivityChart title="Daily active posters" rows={activity} series="active_users" color="var(--accent)" />
        </div>
      )}

      <section className="admin-section">
        <h2 className="admin-section-title">
          Signups in range
          {metrics.signups > users.length ? (
            <span className="admin-section-meta"> · showing {users.length} of {metrics.signups}</span>
          ) : null}
        </h2>
        {users.length === 0 ? (
          <p className="admin-muted">No signups match your filters.</p>
        ) : (
          <RecentSignupsGrid users={users} showVersion={showVersion} />
        )}
        {metrics.signups > listLimit ? (
          <p className="admin-muted admin-section-foot">
            Limited to the {listLimit} most recent signups.
          </p>
        ) : null}
      </section>
    </div>
  );
}

function PostsPanel({
  metrics,
  activity,
  posts,
  listLimit,
  rangeLabel,
  versionLabel,
  postsPerActive,
}: {
  metrics: AnalyticsMetrics;
  activity: DailyActivityRow[];
  posts: RecentPostRow[];
  listLimit: number;
  rangeLabel: string;
  versionLabel: string;
  postsPerActive: string;
}) {
  return (
    <div className="admin-analytics-panel">
      <FilterSummary rangeLabel={rangeLabel} versionLabel={versionLabel} metrics={metrics} />
      <div className="admin-metric-grid admin-metric-grid--dense">
        <MetricCard label="Sleep posts" value={metrics.posts} sub={rangeLabel} />
        <MetricCard
          label="Wearable logs"
          value={metrics.wearable_posts}
          sub={`${metrics.manual_posts} manual logs`}
        />
        <MetricCard
          label="Dream logs"
          value={metrics.posts_with_dreams}
          sub="Posts with dream text"
        />
        <MetricCard
          label="Active posters"
          value={metrics.active_users}
          sub={`${postsPerActive} posts per active user`}
        />
      </div>

      {activity.length > 0 && (
        <div className="admin-chart-grid admin-chart-grid--single">
          <AdminActivityChart title="Daily posts" rows={activity} series="posts" color="var(--core)" />
        </div>
      )}

      <section className="admin-section">
        <h2 className="admin-section-title">
          Posts in range
          {metrics.posts > posts.length ? (
            <span className="admin-section-meta"> · showing {posts.length} of {metrics.posts}</span>
          ) : null}
        </h2>
        {posts.length === 0 ? (
          <p className="admin-muted">No posts match your filters.</p>
        ) : (
          <RecentPostsGrid posts={posts} />
        )}
        {metrics.posts > listLimit ? (
          <p className="admin-muted admin-section-foot">
            Limited to the {listLimit} most recent posts.
          </p>
        ) : null}
      </section>
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
        <MetricCard label="Comments" value={metrics.comments} sub={rangeLabel} />
        <MetricCard label="Kudos" value={metrics.kudos} sub={rangeLabel} />
        <MetricCard
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

function RecentPostsGrid({ posts }: { posts: RecentPostRow[] }) {
  const columns = useMemo<GridColDef<RecentPostRow>[]>(() => [
    {
      field: 'username',
      headerName: 'User',
      flex: 1,
      minWidth: 120,
      valueFormatter: (value) => `@${value}`,
    },
    {
      field: 'sleep_date',
      headerName: 'Sleep date',
      width: 120,
      valueFormatter: (value) => {
        if (!value) return '—';
        const d = new Date(`${value}T12:00:00`);
        return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
      },
    },
    {
      field: 'title',
      headerName: 'Title',
      flex: 1.5,
      minWidth: 160,
    },
    {
      field: 'asleep_minutes',
      headerName: 'Asleep',
      width: 90,
      valueFormatter: (value) => formatSleepMinutes(Number(value)),
    },
    {
      field: 'source',
      headerName: 'Source',
      width: 110,
      valueGetter: (_value, row) => {
        if (row.is_custom) return 'Manual';
        return row.source_device?.trim() || 'Wearable';
      },
    },
    {
      field: 'has_dream',
      headerName: 'Dream',
      width: 72,
      valueFormatter: (value) => (value ? 'Yes' : '—'),
    },
    {
      field: 'kudos_count',
      headerName: 'Kudos',
      type: 'number',
      width: 80,
    },
    {
      field: 'comments_count',
      headerName: 'Comments',
      type: 'number',
      width: 100,
    },
    dateColumn('created_at', 'Logged'),
  ], []);

  return (
    <AdminDataGrid
      rows={posts}
      columns={columns}
      getRowId={(row) => row.id}
      label="Posts in range"
      initialState={{
        sorting: { sortModel: [{ field: 'created_at', sort: 'desc' }] },
      }}
    />
  );
}

function RecentSignupsGrid({ users, showVersion }: { users: RecentUserRow[]; showVersion: boolean }) {
  const columns = useMemo<GridColDef<RecentUserRow>[]>(() => {
    const cols: GridColDef<RecentUserRow>[] = [
      {
        field: 'username',
        headerName: 'Username',
        flex: 1,
        minWidth: 140,
        valueFormatter: (value) => `@${value}`,
      },
      {
        field: 'email',
        headerName: 'Email',
        flex: 1.5,
        minWidth: 200,
        valueFormatter: (value) => (value ? String(value) : '—'),
      },
      dateColumn('created_at', 'Joined'),
      {
        field: 'posts_count',
        headerName: 'Posts',
        type: 'number',
        width: 100,
      },
      {
        field: 'user_roles',
        headerName: 'Roles',
        flex: 1.5,
        minWidth: 160,
        valueGetter: (_value, row) => {
          const parts: string[] = [];
          if (row.is_premium && !row.user_roles?.includes('premium')) parts.push('premium');
          if (row.user_roles?.length) parts.push(...row.user_roles);
          return parts.length ? parts.join(', ') : '—';
        },
      },
    ];
    if (showVersion) {
      cols.push({
        field: 'last_app_version',
        headerName: 'App version',
        width: 120,
        valueFormatter: (value) => (value ? `v${value}` : '—'),
      });
    }
    return cols;
  }, [showVersion]);

  return (
    <AdminDataGrid
      rows={users}
      columns={columns}
      getRowId={(row) => row.id}
      label="Signups in range"
      initialState={{
        sorting: { sortModel: [{ field: 'created_at', sort: 'desc' }] },
      }}
    />
  );
}
