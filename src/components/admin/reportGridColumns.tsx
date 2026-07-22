import type { GridColDef } from '@mui/x-data-grid';
import type { CommentReportRow, PostReportRow } from '../../lib/admin';
import {
  emailColumn,
  idCodeColumn,
  loggedAtColumn,
  sleepDateColumn,
  usernameColumn,
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
    loggedAtColumn<T>('author_joined', 'Author joined', { flex: 0.9, minWidth: 130 }),
    {
      field: 'author_posts_count',
      headerName: 'Author posts',
      type: 'number',
      width: 100,
      valueGetter: (_value, row) => Number(row.author_posts_count ?? 0),
    },
    {
      field: 'author_report_count',
      headerName: 'Author prior reports',
      type: 'number',
      width: 140,
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
      type: 'boolean',
      width: 90,
      valueGetter: (_value, row) => row.author_is_premium,
    },
  ];
}

function reporterColumns<T extends {
  reporter: string;
  reporter_email?: string | null;
  reporter_id: string;
}>(): GridColDef<T>[] {
  return [
    usernameColumn<T>('Reporter', { flex: 0.8, minWidth: 110 }),
    emailColumn<T>('Reporter email', { field: 'reporter_email', flex: 1.2, minWidth: 180 }),
    idCodeColumn<T>('reporter_id', 'Reporter ID'),
  ];
}

export function buildPostReportColumns(): GridColDef<PostReportRow>[] {
  return [
    idCodeColumn<PostReportRow>('id', 'Report ID'),
    loggedAtColumn<PostReportRow>('created_at', 'Reported'),
    { field: 'reason', headerName: 'Reason', flex: 1, minWidth: 120 },
    ...reporterColumns<PostReportRow>(),
    idCodeColumn<PostReportRow>('post_id', 'Post ID'),
    {
      field: 'title',
      headerName: 'Post title',
      flex: 1.5,
      minWidth: 160,
      valueGetter: (_value, row) => row.title?.trim() || '',
      valueFormatter: (value) => (value ? String(value) : '—'),
    },
    {
      field: 'dream_log',
      headerName: 'Dream',
      flex: 2,
      minWidth: 180,
      valueGetter: (_value, row) => row.dream_log?.trim() || '',
      valueFormatter: (value) => (value ? String(value) : '—'),
    },
    {
      field: 'morning_notes',
      headerName: 'Notes',
      flex: 1.5,
      minWidth: 140,
      valueGetter: (_value, row) => row.morning_notes?.trim() || '',
      valueFormatter: (value) => (value ? String(value) : '—'),
    },
    sleepDateColumn<PostReportRow>('post_sleep_date', 'Sleep date'),
    loggedAtColumn<PostReportRow>('post_created_at', 'Post logged'),
    {
      field: 'post_deleted',
      headerName: 'Deleted',
      type: 'boolean',
      width: 90,
      valueGetter: (_value, row) => row.post_deleted,
    },
    {
      field: 'post_report_count',
      headerName: 'Reports on post',
      type: 'number',
      width: 120,
      valueGetter: (_value, row) => Number(row.post_report_count ?? 0),
    },
    usernameColumn<PostReportRow>('Author', { field: 'author', flex: 0.8, minWidth: 110 }),
    idCodeColumn<PostReportRow>('author_id', 'Author ID'),
    ...authorContextColumns<PostReportRow>(),
  ];
}

export function buildCommentReportColumns(): GridColDef<CommentReportRow>[] {
  return [
    idCodeColumn<CommentReportRow>('id', 'Report ID'),
    loggedAtColumn<CommentReportRow>('created_at', 'Reported'),
    { field: 'reason', headerName: 'Reason', flex: 1, minWidth: 120 },
    ...reporterColumns<CommentReportRow>(),
    idCodeColumn<CommentReportRow>('comment_id', 'Comment ID'),
    idCodeColumn<CommentReportRow>('post_id', 'Post ID'),
    {
      field: 'post_title',
      headerName: 'Post title',
      flex: 1.2,
      minWidth: 140,
      valueGetter: (_value, row) => row.post_title?.trim() || '',
      valueFormatter: (value) => (value ? String(value) : '—'),
    },
    {
      field: 'comment_text',
      headerName: 'Comment',
      flex: 2,
      minWidth: 200,
    },
    loggedAtColumn<CommentReportRow>('comment_created_at', 'Comment posted'),
    {
      field: 'comment_report_count',
      headerName: 'Reports on comment',
      type: 'number',
      width: 140,
      valueGetter: (_value, row) => Number(row.comment_report_count ?? 0),
    },
    usernameColumn<CommentReportRow>('Author', { field: 'author', flex: 0.8, minWidth: 110 }),
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
  post_deleted: false,
  comment_created_at: false,
  reporter_id: false,
  reporter_email: false,
  author_id: false,
  post_id: false,
  comment_id: false,
};
