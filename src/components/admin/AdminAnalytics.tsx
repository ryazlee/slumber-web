import { useCallback, useMemo, useState } from 'react';
import {
  type AdminTagRow,
  type AnalyticsMetrics,
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
import {
  useAdminAnalyticsBundle,
  useAppVersions,
  useRecalculateSleepPostStages,
  useRecalculateSleepPostStagesBulk,
} from '../../hooks/useAdmin';
import AdminActivityChart from './AdminActivityChart';
import AdminAnalyticsFilters from './AdminAnalyticsFilters';
import AdminDataGrid from './AdminDataGrid';
import AdminSection, { AdminTableSummary } from './AdminSection';
import AdminSubsection from './AdminSubsection';
import AdminTabs from './AdminTabs';
import { buildRecentPostColumns } from './postGridColumns';
import { buildRecentSignupColumns } from './userGridColumns';
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
  listLimit,
}: Props) {
  const { refreshing } = useAdmin();
  const [tab, setTab] = useState<AnalyticsTab>('overview');

  const filters = useMemo(() => ({
    start: range.start,
    end: range.end,
    appVersion: appVersion || null,
    listLimit,
  }), [range.start, range.end, appVersion, listLimit]);

  const versionsQuery = useAppVersions();
  const versions = versionsQuery.data ?? [];
  const versionsLoading = versionsQuery.isLoading;

  const {
    metrics,
    activity,
    users,
    posts,
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

      <AdminSubsection
        title="Signups in range"
        meta={metrics.signups > users.length ? `showing ${users.length} of ${metrics.signups}` : undefined}
        footer={(
          metrics.signups > listLimit
            ? `Limited to the ${listLimit} most recent signups. `
            : ''
        ) + 'Sort and filter any column via headers or the toolbar (filters, columns, search).'}
      >
        {users.length === 0 ? (
          <p className="admin-muted">No signups match your filters.</p>
        ) : (
          <RecentSignupsGrid users={users} showVersion={showVersion} />
        )}
      </AdminSubsection>
    </div>
  );
}

function formatRecalcError(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err) {
    const msg = String((err as { message: string }).message);
    if (msg.includes('no_raw_samples')) return 'No raw_samples on this post.';
    if (msg.includes('manual_post')) return 'Manual posts are skipped.';
    if (msg.includes('post_not_found')) return 'Post not found.';
    return msg;
  }
  return 'Could not recalculate sleep stages.';
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
  const [stageMessage, setStageMessage] = useState<string | null>(null);
  const [actingPostId, setActingPostId] = useState<string | null>(null);
  const recalcMutation = useRecalculateSleepPostStages();
  const bulkMutation = useRecalculateSleepPostStagesBulk();

  const wearablePosts = useMemo(
    () => posts.filter((post) => !post.is_custom && post.source_device !== 'Custom'),
    [posts],
  );

  const recalculatePost = useCallback(async (post: RecentPostRow) => {
    if (!window.confirm(`Recalculate core / deep / REM for “${post.title}” from raw_samples?`)) return;
    setStageMessage(null);
    setActingPostId(post.id);
    try {
      const result = await recalcMutation.mutateAsync(post.id);
      setStageMessage(
        result.changed
          ? `Updated stages for ${post.title}.`
          : `No change for ${post.title} — values already matched raw_samples.`,
      );
    } catch (err: unknown) {
      setStageMessage(formatRecalcError(err));
    } finally {
      setActingPostId(null);
    }
  }, [recalcMutation]);

  const recalculateLoadedWearable = async () => {
    const ids = wearablePosts.map((post) => post.id);
    if (!ids.length) {
      setStageMessage('No wearable posts loaded in this table.');
      return;
    }
    if (!window.confirm(`Recalculate stages for ${ids.length} loaded wearable post(s)?`)) return;
    setStageMessage(null);
    try {
      const result = await bulkMutation.mutateAsync(ids);
      const failed = result.errors.length;
      setStageMessage(
        failed
          ? `Fixed ${result.fixed}, unchanged ${result.skipped}, failed ${failed}.`
          : `Fixed ${result.fixed} post(s)${result.skipped ? ` · ${result.skipped} already correct` : ''}.`,
      );
    } catch (err: unknown) {
      setStageMessage(formatRecalcError(err));
    }
  };

  const recalculating = recalcMutation.isPending || bulkMutation.isPending;

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

      <AdminSubsection
        title="Posts in range"
        meta={metrics.posts > posts.length ? `showing ${posts.length} of ${metrics.posts}` : undefined}
        footer={(
          metrics.posts > listLimit
            ? `Limited to the ${listLimit} most recent posts. `
            : ''
        ) + 'Use Recalc on a row, or recalculate all loaded wearable posts. Applies to the table below only.'}
      >
        <div className="admin-form-actions" style={{ marginBottom: 12 }}>
          <button
            type="button"
            className="admin-button admin-button-ghost"
            disabled={recalculating || wearablePosts.length === 0}
            onClick={() => void recalculateLoadedWearable()}
          >
            {bulkMutation.isPending ? 'Recalculating…' : `Recalculate loaded wearable (${wearablePosts.length})`}
          </button>
        </div>
        {stageMessage ? (
          <p className={stageMessage.startsWith('Fixed') || stageMessage.startsWith('Updated') ? 'admin-muted' : 'admin-error'}>
            {stageMessage}
          </p>
        ) : null}
        {posts.length === 0 ? (
          <p className="admin-muted">No posts match your filters.</p>
        ) : (
          <RecentPostsGrid
            posts={posts}
            actingPostId={actingPostId}
            onRecalculate={recalculatePost}
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

function RecentPostsGrid({
  posts,
  actingPostId,
  onRecalculate,
}: {
  posts: RecentPostRow[];
  actingPostId?: string | null;
  onRecalculate?: (post: RecentPostRow) => void;
}) {
  const columns = useMemo(
    () => buildRecentPostColumns({ actingPostId, onRecalculate }),
    [actingPostId, onRecalculate],
  );

  return (
    <AdminDataGrid
      persistKey="admin-analytics-posts"
      rows={posts}
      columns={columns}
      getRowId={(row) => row.id}
      label="Posts in range"
      ignoreDiacritics
      initialState={{
        sorting: { sortModel: [{ field: 'created_at', sort: 'desc' }] },
        columns: {
          columnVisibilityModel: {
            id: false,
            user_id: false,
            source_device: false,
            is_custom: false,
          },
        },
      }}
    />
  );
}

function RecentSignupsGrid({ users, showVersion }: { users: RecentUserRow[]; showVersion: boolean }) {
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
