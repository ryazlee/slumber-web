import { useMemo, useState } from 'react';
import { type GridColDef } from '@mui/x-data-grid';
import type { CommentReportRow, PostReportRow } from '../../lib/admin';
import AdminDataGrid from './AdminDataGrid';
import { dateColumn } from './dateColumn';
import { formatWhen } from './format';

type Tab = 'posts' | 'comments';

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

const postColumns: GridColDef<PostReportRow>[] = [
  dateColumn('created_at', 'When'),
  { field: 'reason', headerName: 'Reason', flex: 1, minWidth: 120 },
  {
    field: 'reporter',
    headerName: 'Reporter',
    flex: 0.8,
    minWidth: 110,
    valueFormatter: (value) => `@${value}`,
  },
  {
    field: 'author',
    headerName: 'Author',
    flex: 0.8,
    minWidth: 110,
    valueFormatter: (value) => `@${value}`,
  },
  {
    field: 'author_joined',
    headerName: 'Author joined',
    flex: 0.9,
    minWidth: 130,
    valueFormatter: (value) => (value ? formatWhen(String(value)) : '—'),
    sortComparator: (v1, v2) => new Date(String(v1)).getTime() - new Date(String(v2)).getTime(),
  },
  {
    field: 'author_posts_count',
    headerName: 'Posts',
    type: 'number',
    width: 80,
    valueFormatter: (value) => (value == null ? '—' : String(value)),
  },
  {
    field: 'author_report_count',
    headerName: 'Prior reports',
    type: 'number',
    width: 110,
    valueFormatter: (value) => (value == null ? '—' : String(value)),
  },
  {
    field: 'author_roles',
    headerName: 'Roles',
    flex: 1,
    minWidth: 120,
    valueGetter: (_value, row) => authorRolesLabel(row.author_roles, row.author_is_premium),
  },
  {
    field: 'author_is_premium',
    headerName: 'Premium',
    type: 'boolean',
    width: 90,
  },
  {
    field: 'author_id',
    headerName: 'Author ID',
    flex: 1,
    minWidth: 200,
    renderCell: ({ value }) => (value ? <code className="admin-code">{value}</code> : '—'),
  },
  {
    field: 'title',
    headerName: 'Post',
    flex: 1.5,
    minWidth: 160,
    valueFormatter: (value) => (value ? String(value) : '—'),
  },
];

const commentColumns: GridColDef<CommentReportRow>[] = [
  dateColumn('created_at', 'When'),
  { field: 'reason', headerName: 'Reason', flex: 1, minWidth: 120 },
  {
    field: 'reporter',
    headerName: 'Reporter',
    flex: 1,
    minWidth: 120,
    valueFormatter: (value) => `@${value}`,
  },
  {
    field: 'author',
    headerName: 'Author',
    flex: 1,
    minWidth: 120,
    valueFormatter: (value) => `@${value}`,
  },
  {
    field: 'comment_text',
    headerName: 'Comment',
    flex: 2,
    minWidth: 200,
  },
];

export default function AdminReports({
  postReports,
  commentReports,
  loading,
  error,
  reportCounts,
}: Props) {
  const [tab, setTab] = useState<Tab>('posts');

  const rows = tab === 'posts' ? postReports : commentReports;
  const columns = tab === 'posts' ? postColumns : commentColumns;
  const total = tab === 'posts' ? reportCounts.posts : reportCounts.comments;

  const gridKey = useMemo(() => `${tab}-${rows.length}`, [tab, rows.length]);

  return (
    <>
      <div className="admin-tabs admin-tabs-sub" role="tablist" aria-label="Report type">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'posts'}
          className={tab === 'posts' ? 'admin-tab active' : 'admin-tab'}
          onClick={() => setTab('posts')}
        >
          Post reports ({reportCounts.posts})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'comments'}
          className={tab === 'comments' ? 'admin-tab active' : 'admin-tab'}
          onClick={() => setTab('comments')}
        >
          Comment reports ({reportCounts.comments})
        </button>
      </div>

      <p className="admin-muted admin-filter-summary">
        {total} {tab} report{total === 1 ? '' : 's'} — sort and filter in the table toolbar
      </p>

      {error && <p className="admin-error admin-error-banner">{error}</p>}
      {loading && <p className="admin-muted">Loading reports…</p>}

      {!loading && rows.length === 0 ? (
        <p className="admin-muted admin-empty">No {tab} reports yet.</p>
      ) : !loading ? (
        <AdminDataGrid
          key={gridKey}
          rows={rows}
          columns={columns}
          getRowId={(row) => row.id}
          loading={loading}
          label={`${tab} reports`}
          initialState={
            tab === 'posts'
              ? { columns: { columnVisibilityModel: { author_id: false } } }
              : undefined
          }
        />
      ) : null}
    </>
  );
}
