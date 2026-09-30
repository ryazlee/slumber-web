import type { GridColDef } from '@mui/x-data-grid';
import type { CommentReportRow, PostReportRow } from '../../lib/admin';
import { formatWhen } from './format';
import {
  AdminStatusPill,
  emailColumn,
  idCodeColumn,
  loggedAtColumn,
  sleepDateColumn,
  usernameColumn,
  type AdminMobileSummary,
} from './gridColumnHelpers';

function authorRolesLabel(roles: string[] | null | undefined, isPremium?: boolean): string {
  const parts: string[] = [];
  if (isPremium && !roles?.includes('premium')) parts.push('premium');
  if (roles?.length) parts.push(...roles);
  return parts.length ? parts.join(', ') : '—';
}

function authorContextColumns<T extends {
  author_joined: string;
  author_posts_count: number;
  author_report_count: number;
  author_roles: string[] | null;
  author_is_premium: boolean;
}>(): GridColDef<T>[] {
  return [
    loggedAtColumn<T>('author_joined', 'Author joined'),
    {
      field: 'author_posts_count',
      headerName: 'Author posts',
      type: 'number',
      width: 110,
      flex: 0,
      valueGetter: (_value, row) => Number(row.author_posts_count ?? 0),
    },
    {
      field: 'author_report_count',
      headerName: 'Author prior reports',
      type: 'number',
      width: 140,
      flex: 0,
      valueGetter: (_value, row) => Number(row.author_report_count ?? 0),
    },
    {
      field: 'author_roles',
      headerName: 'Author roles',
      flex: 1,
      minWidth: 120,
      valueGetter: (_value, row) => authorRolesLabel(row.author_roles, row.author_is_premium),
    },
    {
      field: 'author_is_premium',
      headerName: 'Premium',
      width: 96,
      flex: 0,
      valueGetter: (_value, row) => (row.author_is_premium ? 'Premium' : 'Free'),
    },
  ];
}

function reporterColumns<T extends {
  reporter: string;
  reporter_email?: string | null;
  reporter_id: string;
}>(): GridColDef<T>[] {
  return [
    usernameColumn<T>('Reporter', { flex: 0.8, minWidth: 110, width: 130 }),
    emailColumn<T>('Reporter email', { field: 'reporter_email', flex: 1, minWidth: 160 }),
    idCodeColumn<T>('reporter_id', 'Reporter ID'),
  ];
}

export const postReportMobileSummary: AdminMobileSummary = {
  title: (row: PostReportRow) => row.reason?.trim() || 'Report',
  searchText: (row: PostReportRow) => [row.reason, row.title, row.author, row.reporter, row.dream_log].filter(Boolean).join(' '),
  status: (row: PostReportRow) => (
    <AdminStatusPill tone={row.post_deleted ? 'off' : 'neutral'}>
      {row.post_deleted ? 'Deleted' : 'Up'}
    </AdminStatusPill>
  ),
  facts: [
    { label: 'Post', value: (row: PostReportRow) => row.title?.trim() || '—' },
    { label: 'Author', value: (row: PostReportRow) => `@${row.author}` },
    { label: 'Reporter', value: (row: PostReportRow) => `@${row.reporter}` },
    { label: 'When', value: (row: PostReportRow) => (row.created_at ? formatWhen(row.created_at) : '—') },
  ],
};

export const commentReportMobileSummary: AdminMobileSummary = {
  title: (row: CommentReportRow) => row.reason?.trim() || 'Report',
  searchText: (row: CommentReportRow) => [row.reason, row.comment_text, row.post_title, row.author, row.reporter].filter(Boolean).join(' '),
  facts: [
    { label: 'Comment', value: (row: CommentReportRow) => row.comment_text?.trim() || '—' },
    { label: 'Post', value: (row: CommentReportRow) => row.post_title?.trim() || '—' },
    { label: 'Author', value: (row: CommentReportRow) => `@${row.author}` },
    { label: 'When', value: (row: CommentReportRow) => (row.created_at ? formatWhen(row.created_at) : '—') },
  ],
};

export function buildPostReportColumns(): GridColDef<PostReportRow>[] {
  return [
    { field: 'reason', headerName: 'Reason', width: 140, flex: 0 },
    {
      field: 'title',
      headerName: 'Post',
      flex: 1.2,
      minWidth: 140,
      valueGetter: (_value, row) => row.title?.trim() || '',
      valueFormatter: (value) => (value ? String(value) : '—'),
    },
    usernameColumn<PostReportRow>('Author', { field: 'author', flex: 0.7, minWidth: 110, width: 130 }),
    ...reporterColumns<PostReportRow>(),
    loggedAtColumn<PostReportRow>('created_at', 'Reported'),
    {
      field: 'post_report_count',
      headerName: 'Reports',
      type: 'number',
      width: 96,
      flex: 0,
      valueGetter: (_value, row) => Number(row.post_report_count ?? 0),
    },
    {
      field: 'post_deleted',
      headerName: 'Deleted',
      width: 96,
      flex: 0,
      valueGetter: (_value, row) => (row.post_deleted ? 'Deleted' : '—'),
    },
    {
      field: 'dream_log',
      headerName: 'Dream',
      flex: 1,
      minWidth: 140,
      valueGetter: (_value, row) => row.dream_log?.trim() || '',
      valueFormatter: (value) => (value ? String(value) : '—'),
    },
    {
      field: 'morning_notes',
      headerName: 'Notes',
      flex: 1,
      minWidth: 120,
      valueGetter: (_value, row) => row.morning_notes?.trim() || '',
      valueFormatter: (value) => (value ? String(value) : '—'),
    },
    sleepDateColumn<PostReportRow>('post_sleep_date', 'Sleep date'),
    loggedAtColumn<PostReportRow>('post_created_at', 'Post logged'),
    idCodeColumn<PostReportRow>('id', 'Report ID'),
    idCodeColumn<PostReportRow>('post_id', 'Post ID'),
    idCodeColumn<PostReportRow>('author_id', 'Author ID'),
    ...authorContextColumns<PostReportRow>(),
  ];
}

export function buildCommentReportColumns(): GridColDef<CommentReportRow>[] {
  return [
    { field: 'reason', headerName: 'Reason', width: 140, flex: 0 },
    {
      field: 'comment_text',
      headerName: 'Comment',
      flex: 1.4,
      minWidth: 160,
    },
    {
      field: 'post_title',
      headerName: 'Post',
      flex: 1,
      minWidth: 130,
      valueGetter: (_value, row) => row.post_title?.trim() || '',
      valueFormatter: (value) => (value ? String(value) : '—'),
    },
    usernameColumn<CommentReportRow>('Author', { field: 'author', flex: 0.7, minWidth: 110, width: 130 }),
    ...reporterColumns<CommentReportRow>(),
    loggedAtColumn<CommentReportRow>('created_at', 'Reported'),
    {
      field: 'comment_report_count',
      headerName: 'Reports',
      type: 'number',
      width: 96,
      flex: 0,
      valueGetter: (_value, row) => Number(row.comment_report_count ?? 0),
    },
    loggedAtColumn<CommentReportRow>('comment_created_at', 'Comment posted'),
    idCodeColumn<CommentReportRow>('id', 'Report ID'),
    idCodeColumn<CommentReportRow>('comment_id', 'Comment ID'),
    idCodeColumn<CommentReportRow>('post_id', 'Post ID'),
    idCodeColumn<CommentReportRow>('author_id', 'Author ID'),
    ...authorContextColumns<CommentReportRow>(),
  ];
}

export const reportTableColumnVisibility = {
  author_joined: false,
  author_posts_count: false,
  author_report_count: false,
  author_roles: false,
  author_is_premium: false,
  post_sleep_date: false,
  post_created_at: false,
  comment_created_at: false,
  reporter_id: false,
  reporter_email: false,
  author_id: false,
  post_id: false,
  comment_id: false,
  id: false,
  dream_log: false,
  morning_notes: false,
};
