import { Link } from 'react-router-dom';
import { useCallback, useMemo, useState } from 'react';
import type { GridColDef } from '@mui/x-data-grid';
import type { RecentPostRow } from '../../lib/admin';
import {
  formatRangeLabel,
  type DateRange,
  type RangePreset,
} from '../../lib/analyticsRange';
import { formatRecalcStagesError } from '../../lib/adminPostStages';
import { useAdmin } from '../../context/AdminContext';
import {
  useAdminPostsPageData,
  useAppVersions,
  useRecalculateSleepPostStages,
  useRecalculateSleepPostStagesBulk,
} from '../../hooks/useAdmin';
import AdminActivityChart from './AdminActivityChart';
import AdminAnalyticsFilters from './AdminAnalyticsFilters';
import AdminDataGrid from './AdminDataGrid';
import AdminFilterBar, { AdminFilterField } from './AdminFilterBar';
import AdminListToolbar from './AdminListToolbar';
import AdminSection, { AdminTableSummary } from './AdminSection';
import { gridActionsColumn } from './gridColumnHelpers';
import { buildRecentPostColumns } from './postGridColumns';
import { formatNumber } from './format';

type Props = {
  range: DateRange;
  preset: RangePreset;
  appVersion: string;
  listLimit: number;
  onPresetChange: (preset: RangePreset) => void;
  onRangeChange: (range: DateRange) => void;
  onAppVersionChange: (version: string) => void;
  onListLimitChange: (limit: number) => void;
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

export default function AdminPosts({
  range,
  preset,
  appVersion,
  listLimit,
  onPresetChange,
  onRangeChange,
  onAppVersionChange,
  onListLimitChange,
}: Props) {
  const { refreshing } = useAdmin();
  const [stageMessage, setStageMessage] = useState<string | null>(null);
  const [actingPostId, setActingPostId] = useState<string | null>(null);

  const filters = useMemo(() => ({
    start: range.start,
    end: range.end,
    appVersion: appVersion || null,
    listLimit,
  }), [range.start, range.end, appVersion, listLimit]);

  const versionsQuery = useAppVersions();
  const versions = versionsQuery.data ?? [];
  const versionsLoading = versionsQuery.isLoading;

  const { metrics, activity, posts, loading, fetching, error } = useAdminPostsPageData(filters);
  const recalcMutation = useRecalculateSleepPostStages();
  const bulkMutation = useRecalculateSleepPostStagesBulk();

  const rangeLabel = formatRangeLabel(range);
  const versionLabel = appVersion ? `v${appVersion}` : 'all versions';
  const postsPerActive = metrics && metrics.active_users > 0
    ? (metrics.posts / metrics.active_users).toFixed(1)
    : '—';

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
      setStageMessage(formatRecalcStagesError(err));
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
      setStageMessage(formatRecalcStagesError(err));
    }
  };

  const recalculating = recalcMutation.isPending || bulkMutation.isPending;

  const columns = useMemo<GridColDef<RecentPostRow>[]>(() => [
    ...buildRecentPostColumns({ actingPostId, onRecalculate: recalculatePost }),
    {
      field: 'open',
      headerName: '',
      ...gridActionsColumn,
      width: 64,
      renderCell: ({ row }) => (
        <Link to={`/post/${row.id}`} className="admin-report-link" onClick={(e) => e.stopPropagation()}>
          Open
        </Link>
      ),
    },
  ], [actingPostId, recalculatePost]);

  return (
    <AdminSection
      className="admin-posts"
      lead="Browse sleep posts in a date range, sort and filter the table, recalculate stage minutes from raw_samples, or open a post in the app. Reported posts are handled under Reports."
      error={error}
    >
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

      <AdminFilterBar nested>
        <AdminFilterField label="List size" htmlFor="admin-posts-limit">
          <select
            id="admin-posts-limit"
            className="admin-input admin-input-select"
            value={listLimit}
            onChange={(e) => onListLimitChange(Number(e.target.value))}
          >
            <option value={50}>50 posts</option>
            <option value={100}>100 posts</option>
            <option value={200}>200 posts</option>
          </select>
        </AdminFilterField>
      </AdminFilterBar>

      {!loading && metrics ? (
        <>
          <AdminTableSummary>
            {rangeLabel} · {versionLabel}
            {metrics.posts > posts.length ? ` · showing ${posts.length} of ${metrics.posts}` : ''}
          </AdminTableSummary>

          <div className="admin-metric-grid admin-metric-grid--dense">
            <MetricCard label="Sleep posts" value={metrics.posts} sub={rangeLabel} />
            <MetricCard
              label="Wearable logs"
              value={metrics.wearable_posts}
              sub={`${metrics.manual_posts} manual`}
            />
            <MetricCard
              label="Dream logs"
              value={metrics.posts_with_dreams}
              sub="With dream text"
            />
            <MetricCard
              label="Active posters"
              value={metrics.active_users}
              sub={`${postsPerActive} posts per poster`}
            />
          </div>

          {activity.length > 0 ? (
            <div className="admin-chart-grid admin-chart-grid--single">
              <AdminActivityChart title="Daily posts" rows={activity} series="posts" color="var(--core)" />
            </div>
          ) : null}

          <AdminListToolbar
            actions={(
              <button
                type="button"
                className="admin-button admin-button-ghost"
                disabled={recalculating || wearablePosts.length === 0}
                onClick={() => void recalculateLoadedWearable()}
              >
                {bulkMutation.isPending ? 'Recalculating…' : `Recalc loaded wearable (${wearablePosts.length})`}
              </button>
            )}
          >
            <AdminTableSummary>
              Sort and filter via column headers or the toolbar.
              {' · '}
              <Link to="/admin/reports">Post reports</Link>
            </AdminTableSummary>
          </AdminListToolbar>

          {stageMessage ? (
            <p className={
              stageMessage.startsWith('Fixed') || stageMessage.startsWith('Updated')
                ? 'admin-muted'
                : 'admin-error'
            }
            >
              {stageMessage}
            </p>
          ) : null}

          {posts.length === 0 ? (
            <p className="admin-muted">No posts match your filters.</p>
          ) : (
            <AdminDataGrid
              persistKey="admin-posts"
              rows={posts}
              columns={columns}
              getRowId={(row) => row.id}
              loading={fetching || refreshing}
              label="Sleep posts"
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
          )}
        </>
      ) : null}

      {loading ? <p className="admin-muted">Loading posts…</p> : null}
    </AdminSection>
  );
}
