import { useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import PostDetailView from '../../components/PostDetailView';
import type { PostSocialPatch } from '../../components/PostSocial';
import { usePost } from '../../hooks/usePost';
import { queryKeys } from '../../hooks/queryKeys';
import type { SleepPost } from '../../lib/types';

export default function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const { data: post, isLoading, error } = usePost(id);

  const handleSocialPatch = useCallback((postId: string, patch: PostSocialPatch) => {
    qc.setQueryData(queryKeys.post(postId), (old: SleepPost | undefined) => {
      if (!old) return old;
      return { ...old, ...patch };
    });
  }, [qc]);

  if (isLoading) {
    return (
      <div className="app-page app-page--feed post-detail-page">
        <p className="app-muted">Loading post…</p>
      </div>
    );
  }

  const errorMessage = error instanceof Error
    ? error.message
    : !post
      ? 'Post not found.'
      : null;

  if (errorMessage || !post) {
    return (
      <div className="app-page app-page--feed post-detail-page">
        <p className="admin-error">{errorMessage ?? 'Post not found.'}</p>
        <Link to="/feed" className="app-back-link">← Back to feed</Link>
      </div>
    );
  }

  return (
    <div className="app-page app-page--feed post-detail-page">
      <header className="post-detail-page-header">
        <Link to="/feed" className="app-back-link">← Feed</Link>
      </header>

      <PostDetailView post={post} onSocialPatch={handleSocialPatch} />
    </div>
  );
}
