import { useCallback, useEffect, useMemo, useState } from 'react';
import AdminReports from '../../components/admin/AdminReports';
import { useAdmin } from '../../context/AdminContext';
import { fetchCommentReports, fetchPostReports } from '../../lib/admin';

export default function AdminReportsPage() {
  const { refreshKey } = useAdmin();
  const [postReports, setPostReports] = useState<Awaited<ReturnType<typeof fetchPostReports>>>([]);
  const [commentReports, setCommentReports] = useState<Awaited<ReturnType<typeof fetchCommentReports>>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [posts, comments] = await Promise.all([
        fetchPostReports(),
        fetchCommentReports(),
      ]);
      setPostReports(posts);
      setCommentReports(comments);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not load reports.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const reportCounts = useMemo(() => ({
    posts: postReports.length,
    comments: commentReports.length,
  }), [postReports.length, commentReports.length]);

  return (
    <AdminReports
      postReports={postReports}
      commentReports={commentReports}
      loading={loading}
      error={error}
      reportCounts={reportCounts}
    />
  );
}
