import { Link, useNavigate } from 'react-router-dom';
import { useCallback, useMemo, useState } from 'react';
import type { GridColDef } from '@mui/x-data-grid';
import type { RecentPostRow } from '../../lib/admin';
import { formatRangeLabel } from '../../lib/analyticsRange';
import { formatRecalcStagesError } from '../../lib/adminPostStages';
import { useAdmin } from '../../context/AdminContext';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { usePaginatedFilters } from '../../hooks/usePaginatedFilters';
import {
  useAdminPostsPageData,
  useAppVersions,
  useRepairDoubledSleepPostStages,
  useRepairDoubledSleepPostStagesBulk,
  useAdminSoftDeletePostFromGrid,
  useRepairInflatedStages,
} from '../../hooks/useAdmin';
import type { AdminAnalyticsScreenProps } from './adminAnalyticsTypes';
import AdminActivityChart from './AdminActivityChart';
import AdminAnalyticsFilters from './AdminAnalyticsFilters';
import AdminDataGrid from './AdminDataGrid';
import AdminFilterBar, { AdminFilterField } from './AdminFilterBar';
import AdminGridActions from './AdminGridActions';
import AdminGridClientFilterHint from './AdminGridClientFilterHint';
import AdminListToolbar from './AdminListToolbar';
import AdminMetricCard from './AdminMetricCard';
import AdminPostRawPanel from './AdminPostRawPanel';
import AdminSection, { AdminTableSummary } from './AdminSection';
import { ADMIN_POST_RAW_ID, scrollAdminPanelIntoView } from './adminScroll';
import { gridActionsColumn } from './gridColumnHelpers';
import { buildRecentPostColumns } from './postGridColumns';

const POST_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type RawPostTarget = {
  id: string;
  title?: string | null;
  username?: string | null;
};

type Props = AdminAnalyticsScreenProps & {
  userId?: string | null;
};

export default function AdminPosts({
  range,
  preset,
  appVersion,
  onPresetChange,
  onRangeChange,
  onAppVersionChange,
  userId = null,
}: Props) {
  const navigate = useNavigate();
  const { refreshing } = useAdmin();
  const [stageMessage, setStageMessage] = useState<string | null>(null);
  const [actingPostId, setActingPostId] = useState<string | null>(null);
  const [postIdLookup, setPostIdLookup] = useState('');
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [rawPost, setRawPost] = useState<RawPostTarget | null>(null);
  const [expandedRawIds, setExpandedRawIds] = useState<ReadonlySet<string>>(() => new Set());

  const baseFilters = useMemo(() => ({
    start: range.start,
    end: range.end,
    appVersion: appVersion || null,
    userId,
  }), [range.start, range.end, appVersion, userId]);

  const { paginationModel, setPaginationModel, filters } = usePaginatedFilters(
    baseFilters,
    [range.start, range.end, appVersion],
  );

  const versionsQuery = useAppVersions();
  const versions = versionsQuery.data ?? [];
  const versionsLoading = versionsQuery.isLoading;

  const { metrics, activity, posts, postsTotal, loading, fetching, error } = useAdminPostsPageData(filters);
  const repairMutation = useRepairDoubledSleepPostStages();
  const repairBulkMutation = useRepairDoubledSleepPostStagesBulk();
  const softDeleteMutation = useAdminSoftDeletePostFromGrid();
  const repairAllMutation = useRepairInflatedStages();

  const rangeLabel = formatRangeLabel(range);
  const versionLabel = appVersion ? `v${appVersion}` : 'all versions';
  const postsPerActive = metrics && metrics.active_users > 0
    ? (metrics.posts / metrics.active_users).toFixed(1)
    : '—';

  const wearablePosts = useMemo(
    () => posts.filter((post) => !post.is_custom && post.source_device !== 'Custom'),
    [posts],
  );

  const inflatedWearablePosts = useMemo(
    () => wearablePosts.filter(
      (post) => post.in_bed_minutes > 0 && post.asleep_minutes > post.in_bed_minutes + 5,
    ),
    [wearablePosts],
  );

  const closeRaw = useCallback(() => setRawPost(null), []);

  const openRaw = useCallback((target: RawPostTarget) => {
    setLookupError(null);
    setRawPost(target);
    scrollAdminPanelIntoView(ADMIN_POST_RAW_ID);
  }, []);

  useEscapeKey(Boolean(rawPost), closeRaw);

  const parsePostId = useCallback((rawId: string): string | null => {
    const id = rawId.trim();
    if (!POST_ID_RE.test(id)) {
      setLookupError('Enter a valid post UUID.');
      return null;
    }
    setLookupError(null);
    return id;
  }, []);

  const repairPost = useCallback(async (post: RecentPostRow) => {
    if (!window.confirm(
      `Repair doubled stage minutes for “${post.title}”? `
      + `(${post.asleep_minutes}m asleep vs ${post.in_bed_minutes}m in bed)`,
    )) return;
    setStageMessage(null);
    setActingPostId(post.id);
    try {
      const result = await repairMutation.mutateAsync(post.id);
      const after = result.after;
      setStageMessage(
        result.changed
          ? `Repaired ${post.title}: asleep ${result.before.asleep_minutes}m → ${after.asleep_minutes}m.`
          : `No change for ${post.title}.`,
      );
    } catch (err: unknown) {
      setStageMessage(formatRecalcStagesError(err));
    } finally {
      setActingPostId(null);
    }
  }, [repairMutation]);

  const softDeletePost = useCallback(async (post: RecentPostRow) => {
    if (!window.confirm(`Soft-delete “${post.title}”? Reports will be dismissed.`)) return;
    setStageMessage(null);
    setActingPostId(post.id);
    try {
      await softDeleteMutation.mutateAsync(post.id);
      setStageMessage(`Removed ${post.title}.`);
    } catch (err: unknown) {
      setStageMessage(err instanceof Error ? err.message : 'Could not delete post.');
    } finally {
      setActingPostId(null);
    }
  }, [softDeleteMutation]);

  const openPostById = useCallback((rawId: string) => {
    const id = parsePostId(rawId);
    if (!id) return;
    navigate(`/post/${id}?from=admin`);
  }, [navigate, parsePostId]);

  const openRawById = useCallback((rawId: string) => {
    const id = parsePostId(rawId);
    if (!id) return;
    const match = posts.find((post) => post.id === id);
    openRaw({
      id,
      title: match?.title,
      username: match?.username,
    });
  }, [openRaw, parsePostId, posts]);

  const toggleRaw = useCallback((postId: string) => {
    setExpandedRawIds((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) next.delete(postId);
      else next.add(postId);
      return next;
    });
  }, []);

  const repairLoadedInflated = async () => {
    const ids = inflatedWearablePosts.map((post) => post.id);
    if (!ids.length) {
      setStageMessage('No inflated wearable posts in this table (asleep > in bed).');
      return;
    }
    if (!window.confirm(`Repair ${ids.length} inflated wearable post(s)?`)) return;
    setStageMessage(null);
    try {
      const result = await repairBulkMutation.mutateAsync(ids);
      const failed = result.errors.length;
      setStageMessage(
        failed
          ? `Repaired ${result.fixed}, unchanged ${result.skipped}, failed ${failed}.`
          : `Repaired ${result.fixed} post(s)${result.skipped ? ` · ${result.skipped} unchanged` : ''}.`,
      );
    } catch (err: unknown) {
      setStageMessage(formatRecalcStagesError(err));
    }
  };

  const repairAllInflated = async () => {
    if (!window.confirm('Repair up to 50 inflated wearable posts in the current date filter?')) return;
    setStageMessage(null);
    try {
      const daySpan = range.start && range.end
        ? Math.ceil((new Date(range.end).getTime() - new Date(range.start).getTime()) / 86400000) + 1
        : null;
      const result = await repairAllMutation.mutateAsync({ limit: 50, days: daySpan });
      const failed = result.errors.length;
      setStageMessage(
        failed
          ? `Repaired ${result.fixed}, unchanged ${result.skipped}, failed ${failed}.`
          : `Repaired ${result.fixed} post(s)${result.skipped ? ` · ${result.skipped} unchanged` : ''}.`,
      );
    } catch (err: unknown) {
      setStageMessage(formatRecalcStagesError(err));
    }
  };

  const acting = repairMutation.isPending || repairBulkMutation.isPending
    || softDeleteMutation.isPending || repairAllMutation.isPending;

  const columns = useMemo<GridColDef<RecentPostRow>[]>(() => [
    ...buildRecentPostColumns({
      actingPostId,
      expandedRawIds,
      onToggleRaw: toggleRaw,
      onRepair: repairPost,
      onSoftDelete: softDeletePost,
    }),
    {
      field: 'open',
      headerName: '',
      ...gridActionsColumn,
      width: 72,
      renderCell: ({ row }) => (
        <AdminGridActions>
          <Link
            to={`/post/${row.id}?from=admin`}
            className="admin-action-btn admin-action-btn--link"
            onClick={(e) => e.stopPropagation()}
          >
            Open
          </Link>
        </AdminGridActions>
      ),
    },
  ], [actingPostId, expandedRawIds, toggleRaw, repairPost, softDeletePost]);

  return (
    <AdminSection
      className="admin-posts"
      lead={userId
        ? 'Posts for one user in the selected date range.'
        : 'Browse sleep posts in the selected date range (paginated). Inspect the raw sleep_posts row, repair inflated stage minutes, soft-delete, or open a post. Lookup any post by ID (not shown in the friends feed). Bulk repair applies to the current page.'}
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
        <AdminFilterField label="Open post by ID" htmlFor="admin-post-id-lookup" className="admin-filter-field--wide">
          <div className="admin-post-id-lookup">
            <input
              id="admin-post-id-lookup"
              className="admin-input"
              type="search"
              inputMode="text"
              autoComplete="off"
              spellCheck={false}
              placeholder="Paste post UUID…"
              value={postIdLookup}
              onChange={(e) => {
                setPostIdLookup(e.target.value);
                if (lookupError) setLookupError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  openRawById(postIdLookup);
                }
              }}
            />
            <button
              type="button"
              className="admin-button admin-button-ghost"
              onClick={() => openRawById(postIdLookup)}
            >
              Raw
            </button>
            <button
              type="button"
              className="admin-button admin-button-ghost"
              onClick={() => openPostById(postIdLookup)}
            >
              Open
            </button>
          </div>
          {lookupError ? <p className="admin-error admin-filter-note">{lookupError}</p> : null}
        </AdminFilterField>
      </AdminFilterBar>

      {rawPost ? (
        <AdminPostRawPanel
          postId={rawPost.id}
          title={rawPost.title}
          username={rawPost.username}
          onClose={closeRaw}
        />
      ) : null}

      {!loading && metrics ? (
        <>
          <AdminTableSummary>
            {rangeLabel} · {versionLabel}
            {postsTotal > 0
              ? ` · ${postsTotal} post${postsTotal === 1 ? '' : 's'}`
              + ` · page ${paginationModel.page + 1}`
              + ` (${posts.length} shown)`
              : ''}
          </AdminTableSummary>

          <div className="admin-metric-grid admin-metric-grid--dense">
            <AdminMetricCard label="Sleep posts" value={metrics.posts} sub={rangeLabel} />
            <AdminMetricCard
              label="Wearable logs"
              value={metrics.wearable_posts}
              sub={`${metrics.manual_posts} manual`}
            />
            <AdminMetricCard
              label="Dream logs"
              value={metrics.posts_with_dreams}
              sub="With dream text"
            />
            <AdminMetricCard
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
              <>
                <button
                  type="button"
                  className="admin-button admin-button-ghost"
                  disabled={acting}
                  onClick={() => void repairAllInflated()}
                >
                  {repairAllMutation.isPending ? 'Repairing…' : 'Repair inflated (50)'}
                </button>
                <button
                  type="button"
                  className="admin-button admin-button-ghost"
                  disabled={acting || inflatedWearablePosts.length === 0}
                  onClick={() => void repairLoadedInflated()}
                >
                  {repairBulkMutation.isPending
                    ? 'Repairing…'
                    : `Repair inflated on page (${inflatedWearablePosts.length})`}
                </button>
              </>
            )}
          >
            <AdminTableSummary>
              <AdminGridClientFilterHint fullSentence />
              {' · '}
              <Link to="/admin/reports">Post reports</Link>
            </AdminTableSummary>
          </AdminListToolbar>

          {stageMessage ? (
            <p className={
              stageMessage.startsWith('Fixed') || stageMessage.startsWith('Updated')
                || stageMessage.startsWith('Repaired')
                ? 'admin-muted'
                : 'admin-error'
            }
            >
              {stageMessage}
            </p>
          ) : null}

          {postsTotal === 0 ? (
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
              getRowHeight={(params) => (expandedRawIds.has(String(params.id)) ? 'auto' : undefined)}
              serverPagination={{
                rowCount: postsTotal,
                paginationModel,
                onPaginationModelChange: setPaginationModel,
              }}
              initialState={{
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
