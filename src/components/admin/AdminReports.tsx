import { useMemo, useState } from 'react';
import type { CommentReportRow, PostReportRow } from '../../lib/admin';
import { groupCommentReports, groupPostReports } from '../../lib/groupReports';
import {
  useAdminDeleteComment,
  useAdminSoftDeletePost,
  useDismissCommentReports,
  useDismissPostReports,
} from '../../hooks/useAdmin';
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

type Props = {
  postReports: PostReportRow[];
  commentReports: CommentReportRow[];
  loading: boolean;
  error: string | null;
  reportCounts: { posts: number; comments: number };
};

const postColumns = buildPostReportColumns();
const commentColumns = buildCommentReportColumns();

export default function AdminReports({
  postReports,
  commentReports,
  loading,
  error,
  reportCounts,
}: Props) {
  const [tab, setTab] = useState<Tab>('posts');
  const [view, setView] = useState<View>('queue');
  const [actingKey, setActingKey] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const dismissPostMutation = useDismissPostReports();
  const dismissCommentMutation = useDismissCommentReports();
  const removePostMutation = useAdminSoftDeletePost();
  const removeCommentMutation = useAdminDeleteComment();

  const postGroups = useMemo(() => groupPostReports(postReports), [postReports]);
  const commentGroups = useMemo(() => groupCommentReports(commentReports), [commentReports]);

  const rows = tab === 'posts' ? postReports : commentReports;
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
      error={error}
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

      {loading && <p className="admin-muted">Loading reports…</p>}

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

      {!loading && view === 'table' && rows.length > 0 ? (
        <AdminTableSummary>
          {total} {tab} report{total === 1 ? '' : 's'} — sort and filter in the table toolbar
        </AdminTableSummary>
      ) : null}

      {!loading && view === 'table' && rows.length === 0 ? (
        <p className="admin-muted admin-empty">No {tab} reports yet.</p>
      ) : !loading && view === 'table' ? (
        <AdminDataGrid
          persistKey={`admin-reports-${tab}`}
          rows={rows}
          columns={columns}
          getRowId={(row) => row.id}
          loading={loading}
          label={`${tab} reports`}
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
