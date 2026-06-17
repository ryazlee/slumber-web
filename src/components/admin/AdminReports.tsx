import { useMemo, useState } from 'react';
import { type GridColDef } from '@mui/x-data-grid';
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
import { dateColumn } from './dateColumn';
import { formatWhen } from './format';

type Tab = 'posts' | 'comments';
type View = 'queue' | 'table';

type Props = {
  postReports: PostReportRow[];
  commentReports: CommentReportRow[];
  loading: boolean;
  error: string | null;
  reportCounts: { posts: number; comments: number };
};

function authorRolesLabel(roles: string[] | null | undefined, isPremium?: boolean): string {
  const parts: string[] = [];
  if (isPremium && !roles?.includes('premium')) parts.push('premium');
  if (roles?.length) parts.push(...roles);
  return parts.length ? parts.join(', ') : '—';
}

function idCell(value: unknown) {
  return value ? <code className="admin-code">{String(value)}</code> : '—';
}

function sleepDateCell(value: unknown) {
  if (!value) return '—';
  const d = new Date(`${value}T12:00:00`);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

const authorContextColumns = <T extends {
  author_joined: string;
  author_posts_count: number;
  author_report_count: number;
  author_roles: string[] | null;
  author_is_premium: boolean;
}>() => [
  {
    field: 'author_joined',
    headerName: 'Author joined',
    flex: 0.9,
    minWidth: 130,
    valueFormatter: (value: unknown) => (value ? formatWhen(String(value)) : '—'),
    sortComparator: (v1: unknown, v2: unknown) => (
      new Date(String(v1)).getTime() - new Date(String(v2)).getTime()
    ),
  },
  {
    field: 'author_posts_count',
    headerName: 'Author posts',
    type: 'number' as const,
    width: 100,
  },
  {
    field: 'author_report_count',
    headerName: 'Author prior reports',
    type: 'number' as const,
    width: 140,
  },
  {
    field: 'author_roles',
    headerName: 'Author roles',
    flex: 1,
    minWidth: 120,
    valueGetter: (_value: unknown, row: T) => authorRolesLabel(row.author_roles, row.author_is_premium),
  },
  {
    field: 'author_is_premium',
    headerName: 'Premium',
    type: 'boolean' as const,
    width: 90,
  },
];

const postColumns: GridColDef<PostReportRow>[] = [
  {
    field: 'id',
    headerName: 'Report ID',
    flex: 1.1,
    minWidth: 200,
    renderCell: ({ value }) => idCell(value),
  },
  dateColumn('created_at', 'Reported'),
  { field: 'reason', headerName: 'Reason', flex: 1, minWidth: 120 },
  {
    field: 'reporter',
    headerName: 'Reporter',
    flex: 0.8,
    minWidth: 110,
    valueFormatter: (value) => `@${value}`,
  },
  {
    field: 'reporter_email',
    headerName: 'Reporter email',
    flex: 1.2,
    minWidth: 180,
    valueFormatter: (value) => (value ? String(value) : '—'),
  },
  {
    field: 'reporter_id',
    headerName: 'Reporter ID',
    flex: 1.1,
    minWidth: 200,
    renderCell: ({ value }) => idCell(value),
  },
  {
    field: 'post_id',
    headerName: 'Post ID',
    flex: 1.1,
    minWidth: 200,
    renderCell: ({ value }) => idCell(value),
  },
  {
    field: 'title',
    headerName: 'Post title',
    flex: 1.5,
    minWidth: 160,
    valueFormatter: (value) => (value ? String(value) : '—'),
  },
  {
    field: 'post_sleep_date',
    headerName: 'Sleep date',
    width: 120,
    renderCell: ({ value }) => sleepDateCell(value),
  },
  dateColumn('post_created_at', 'Post logged'),
  {
    field: 'post_deleted',
    headerName: 'Deleted',
    type: 'boolean',
    width: 90,
  },
  {
    field: 'post_report_count',
    headerName: 'Reports on post',
    type: 'number',
    width: 120,
  },
  {
    field: 'author',
    headerName: 'Author',
    flex: 0.8,
    minWidth: 110,
    valueFormatter: (value) => `@${value}`,
  },
  {
    field: 'author_id',
    headerName: 'Author ID',
    flex: 1.1,
    minWidth: 200,
    renderCell: ({ value }) => idCell(value),
  },
  ...authorContextColumns<PostReportRow>(),
];

const commentColumns: GridColDef<CommentReportRow>[] = [
  {
    field: 'id',
    headerName: 'Report ID',
    flex: 1.1,
    minWidth: 200,
    renderCell: ({ value }) => idCell(value),
  },
  dateColumn('created_at', 'Reported'),
  { field: 'reason', headerName: 'Reason', flex: 1, minWidth: 120 },
  {
    field: 'reporter',
    headerName: 'Reporter',
    flex: 0.8,
    minWidth: 110,
    valueFormatter: (value) => `@${value}`,
  },
  {
    field: 'reporter_email',
    headerName: 'Reporter email',
    flex: 1.2,
    minWidth: 180,
    valueFormatter: (value) => (value ? String(value) : '—'),
  },
  {
    field: 'reporter_id',
    headerName: 'Reporter ID',
    flex: 1.1,
    minWidth: 200,
    renderCell: ({ value }) => idCell(value),
  },
  {
    field: 'comment_id',
    headerName: 'Comment ID',
    flex: 1.1,
    minWidth: 200,
    renderCell: ({ value }) => idCell(value),
  },
  {
    field: 'post_id',
    headerName: 'Post ID',
    flex: 1.1,
    minWidth: 200,
    renderCell: ({ value }) => idCell(value),
  },
  {
    field: 'post_title',
    headerName: 'Post title',
    flex: 1.2,
    minWidth: 140,
    valueFormatter: (value) => (value ? String(value) : '—'),
  },
  {
    field: 'comment_text',
    headerName: 'Comment',
    flex: 2,
    minWidth: 200,
  },
  dateColumn('comment_created_at', 'Comment posted'),
  {
    field: 'comment_report_count',
    headerName: 'Reports on comment',
    type: 'number',
    width: 140,
  },
  {
    field: 'author',
    headerName: 'Author',
    flex: 0.8,
    minWidth: 110,
    valueFormatter: (value) => `@${value}`,
  },
  {
    field: 'author_id',
    headerName: 'Author ID',
    flex: 1.1,
    minWidth: 200,
    renderCell: ({ value }) => idCell(value),
  },
  ...authorContextColumns<CommentReportRow>(),
];

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

  const gridKey = useMemo(() => `${tab}-${rows.length}`, [tab, rows.length]);

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
          key={gridKey}
          persistKey={`admin-reports-${tab}`}
          rows={rows}
          columns={columns}
          getRowId={(row) => row.id}
          loading={loading}
          label={`${tab} reports`}
          initialState={{
            columns: {
              columnVisibilityModel: {
                author_joined: false,
                author_posts_count: false,
                author_report_count: false,
                author_roles: false,
                author_is_premium: false,
                post_sleep_date: false,
                post_created_at: false,
                post_deleted: false,
                comment_created_at: false,
              },
            },
          }}
        />
      ) : null}
    </AdminSection>
  );
}
