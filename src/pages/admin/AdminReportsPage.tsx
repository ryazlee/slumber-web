import { useMemo } from 'react';
import AdminReports from '../../components/admin/AdminReports';
import { useCommentReports, usePostReports } from '../../hooks/useAdmin';

export default function AdminReportsPage() {
  const postReportsQuery = usePostReports();
  const commentReportsQuery = useCommentReports();

  const postReports = postReportsQuery.data ?? [];
  const commentReports = commentReportsQuery.data ?? [];
  const loading = postReportsQuery.isLoading || commentReportsQuery.isLoading;
  const error = postReportsQuery.error ?? commentReportsQuery.error;
  const errorMessage = error instanceof Error ? error.message : error ? 'Could not load reports.' : null;

  const reportCounts = useMemo(() => ({
    posts: postReports.length,
    comments: commentReports.length,
  }), [postReports.length, commentReports.length]);

  return (
    <AdminReports
      postReports={postReports}
      commentReports={commentReports}
      loading={loading}
      error={errorMessage}
      reportCounts={reportCounts}
    />
  );
}
