import { useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import SleepPostCard from '../../components/SleepPostCard';
import StageBreakdown from '../../components/StageBreakdown';
import type { PostSocialPatch } from '../../components/PostSocial';
import { usePost } from '../../hooks/usePost';
import { formatMins } from '../../lib/format';
import { isManualSleepPost } from '../../lib/sleepPostCustom';

export default function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: post, isLoading, error } = usePost(id);

  const handleSocialPatch = useCallback((_postId: string, _patch: PostSocialPatch) => {
    // PostSocial mutations update the query cache directly.
  }, []);

  if (isLoading) {
    return (
      <div className="app-page">
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
      <div className="app-page">
        <p className="admin-error">{errorMessage ?? 'Post not found.'}</p>
        <Link to="/feed" className="app-back-link">← Back to feed</Link>
      </div>
    );
  }

  const isManual = isManualSleepPost(post);

  return (
    <div className="app-page post-detail-page">
      <Link to="/feed" className="app-back-link">← Feed</Link>

      <SleepPostCard
        post={post}
        showAuthor
        clickable={false}
        defaultCommentsOpen
        onSocialPatch={handleSocialPatch}
      />

      {!isManual && (
        <section className="post-detail-section">
          <h2 className="post-detail-section-title">Stages</h2>
          <StageBreakdown post={post} />
        </section>
      )}

      {(post.inBedMinutes > 0 || post.asleepMinutes > 0 || post.awakeMinutes > 0) && (
        <section className="post-detail-section">
          <h2 className="post-detail-section-title">Details</h2>
          <dl className="post-detail-metrics">
            {post.inBedMinutes > 0 && (
              <div className="post-detail-metric">
                <dt>In bed</dt>
                <dd>{formatMins(post.inBedMinutes)}</dd>
              </div>
            )}
            {!isManual && post.asleepMinutes > 0 && (
              <div className="post-detail-metric">
                <dt>Asleep</dt>
                <dd>{formatMins(post.asleepMinutes)}</dd>
              </div>
            )}
            {post.awakeMinutes > 0 && (
              <div className="post-detail-metric post-detail-metric--awake">
                <dt>Awake</dt>
                <dd>{formatMins(post.awakeMinutes)}</dd>
              </div>
            )}
            {post.awakeEvents > 0 && (
              <div className="post-detail-metric">
                <dt>Wakes</dt>
                <dd>{post.awakeEvents}</dd>
              </div>
            )}
          </dl>
        </section>
      )}
    </div>
  );
}
