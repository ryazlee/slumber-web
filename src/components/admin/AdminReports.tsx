import { useMemo, useState } from 'react';
import type { CommentReportRow, PostReportRow } from '../../lib/admin';
import { groupCommentReports, groupPostReports } from '../../lib/groupReports';
import {
  useAdminDeleteComment,
  useAdminSoftDeletePost,
  useCommentReportsPage,
  useCommentReportsQueue,
  useDismissCommentReports,
  useDismissPostReports,
  usePostReportsPage,
  usePostReportsQueue,
} from '../../hooks/useAdmin';
import { useAdminGridPagination } from '../../hooks/useAdminGridPagination';
import AdminDataGrid from './AdminDataGrid';
import AdminReportReviewQueue from './AdminReportReviewQueue';
import AdminSection, { AdminTableSummary } from './AdminSection';
import AdminTabs from './AdminTabs';
import {
  buildCommentReportColumns,
  buildPostReportColumns,
  reportTableColumnVisibility,
} from './reportGridColumns';

type Tab = 'posts' | 'comments';
type View = 'queue' | 'table';

const postColumns = buildPostReportColumns();
const commentColumns = buildCommentReportColumns();

export default function AdminReports() {
  const [tab, setTab] = useState<Tab>('posts');
  const [view, setView] = useState<View>('queue');
  const [actingKey, setActingKey] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const { paginationModel, setPaginationModel } = useAdminGridPagination([tab, view]);

  const tableFilters = useMemo(() => ({
    page: paginationModel.page,
    pageSize: paginationModel.pageSize,
  }), [paginationModel.page, paginationModel.pageSize]);

  const postQueueQuery = usePostReportsQueue();
  const commentQueueQuery = useCommentReportsQueue();
  const postTableQuery = usePostReportsPage(tableFilters, view === 'table' && tab === 'posts');
  const commentTableQuery = useCommentReportsPage(tableFilters, view === 'table' && tab === 'comments');

  const postReports = postQueueQuery.data?.rows ?? [];
  const commentReports = commentQueueQuery.data?.rows ?? [];
  const tableRows = tab === 'posts'
    ? (postTableQuery.data?.rows ?? [])
    : (commentTableQuery.data?.rows ?? []);
  const tableTotal = tab === 'posts'
    ? (postTableQuery.data?.total ?? 0)
    : (commentTableQuery.data?.total ?? 0);

  const loading = view === 'queue'
    ? (tab === 'posts' ? postQueueQuery.isLoading : commentQueueQuery.isLoading)
    : (tab === 'posts' ? postTableQuery.isFetching : commentTableQuery.isFetching);

  const queueError = postQueueQuery.error ?? commentQueueQuery.error;
  const tableError = postTableQuery.error ?? commentTableQuery.error;
  const error = view === 'queue' ? queueError : tableError;
  const errorMessage = error instanceof Error ? error.message : error ? 'Could not load reports.' : null;

  const reportCounts = useMemo(() => ({
    posts: postQueueQuery.data?.total ?? 0,
    comments: commentQueueQuery.data?.total ?? 0,
  }), [postQueueQuery.data?.total, commentQueueQuery.data?.total]);

  const dismissPostMutation = useDismissPostReports();
  const dismissCommentMutation = useDismissCommentReports();
  const removePostMutation = useAdminSoftDeletePost();
  const removeCommentMutation = useAdminDeleteComment();

  const postGroups = useMemo(() => groupPostReports(postReports), [postReports]);
  const commentGroups = useMemo(() => groupCommentReports(commentReports), [commentReports]);

  const columns = tab === 'posts' ? postColumns : commentColumns;
  const total = tab === 'posts' ? reportCounts.posts : reportCounts.comments;
  const groupCount = tab === 'posts' ? postGroups.length : commentGroups.length;

  const runAction = async (key: string, action: () => Promise<unknown>) => {
    setActionError(null);
    setActingKey(key);
    try {
      await action();
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : 'Action failed.');
    } finally {
      setActingKey(null);
    }
  };

  const dismissPost = (postId: string) => {
    if (!window.confirm('Close all reports on this post? They will be removed from the queue.')) return;
    void runAction(`post:${postId}`, () => dismissPostMutation.mutateAsync(postId));
  };

  const dismissComment = (commentId: string) => {
    if (!window.confirm('Close all reports on this comment? They will be removed from the queue.')) return;
    void runAction(`comment:${commentId}`, () => dismissCommentMutation.mutateAsync(commentId));
  };

  const removePost = (postId: string) => {
    if (!window.confirm('Remove this post and close its reports? This cannot be undone.')) return;
    void runAction(`post:${postId}`, () => removePostMutation.mutateAsync(postId));
  };

  const removeComment = (commentId: string) => {
    if (!window.confirm('Delete this comment and close its reports? This cannot be undone.')) return;
    void runAction(`comment:${commentId}`, () => removeCommentMutation.mutateAsync(commentId));
  };

  return (
    <AdminSection
      lead="Review reported posts and comments. Each card groups reports on the same item — check reporter contact info, take action if needed, then close the reports when you're done."
      error={errorMessage}
    >
      <AdminTabs
        ariaLabel="Report type"
        active={tab}
        onChange={setTab}
        tabs={[
          { id: 'posts', label: `Post reports (${reportCounts.posts})` },
          { id: 'comments', label: `Comment reports (${reportCounts.comments})` },
        ]}
      />

      <AdminTabs
        ariaLabel="Reports view"
        active={view}
        onChange={setView}
        className="admin-tabs-view"
        tabs={[
          { id: 'queue', label: 'Review queue' },
          { id: 'table', label: 'All reports (table)' },
        ]}
      />

      {loading && view === 'queue' ? <p className="admin-muted">Loading reports…</p> : null}

      {!loading && view === 'queue' ? (
        <>
          {groupCount > 0 ? (
            <AdminTableSummary>
              {groupCount} {tab === 'posts' ? 'post' : 'comment'}
              {groupCount === 1 ? '' : 's'} with reports ({total} total report{total === 1 ? '' : 's'})
            </AdminTableSummary>
          ) : null}
          <AdminReportReviewQueue
            tab={tab}
            postGroups={postGroups}
            commentGroups={commentGroups}
            actingKey={actingKey}
            actionError={actionError}
            onDismissPost={dismissPost}
            onDismissComment={dismissComment}
            onRemovePost={removePost}
            onRemoveComment={removeComment}
          />
        </>
      ) : null}

      {!loading && view === 'table' && tableTotal > 0 ? (
        <AdminTableSummary>
          {tableTotal} {tab} report{tableTotal === 1 ? '' : 's'}
          {' · toolbar search and column filters apply to the current page'}
        </AdminTableSummary>
      ) : null}

      {!loading && view === 'table' && tableTotal === 0 ? (
        <p className="admin-muted admin-empty">No {tab} reports yet.</p>
      ) : !loading && view === 'table' ? (
        <AdminDataGrid
          persistKey={`admin-reports-${tab}`}
          rows={tableRows as PostReportRow[] | CommentReportRow[]}
          columns={columns}
          getRowId={(row) => row.id}
          loading={loading}
          label={`${tab} reports`}
          paginationMode="server"
          rowCount={tableTotal}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[25, 50, 100]}
          disableColumnSorting
          initialState={{
            sorting: { sortModel: [{ field: 'created_at', sort: 'desc' }] },
            columns: {
              columnVisibilityModel: reportTableColumnVisibility,
            },
          }}
        />
      ) : null}
    </AdminSection>
  );
}
