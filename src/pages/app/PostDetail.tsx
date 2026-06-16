import { useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { patchPostInCache } from '../../lib/patchPostCache';
import { getOptionalQueryErrorMessage } from '../../lib/queryError';
import PostDetailView from '../../components/PostDetailView';
import type { PostSocialPatch } from '../../components/PostSocial';
import { usePost } from '../../hooks/usePost';

export default function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const { data: post, isLoading, error } = usePost(id);

  const handleSocialPatch = useCallback((postId: string, patch: PostSocialPatch) => {
    patchPostInCache(qc, postId, patch, { userPosts: 'all' });
  }, [qc]);

  if (isLoading) {
    return (
      <div className="app-page app-page--feed post-detail-page">
        <p className="app-muted">Loading post…</p>
      </div>
    );
  }

  const errorMessage = getOptionalQueryErrorMessage(error, 'Post not found.')
    ?? (!post ? 'Post not found.' : null);

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
