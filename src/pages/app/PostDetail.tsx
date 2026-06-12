import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import SleepPostCard from '../../components/SleepPostCard';
import StageBreakdown from '../../components/StageBreakdown';
import type { PostSocialPatch } from '../../components/PostSocial';
import { fetchPost } from '../../lib/feed';
import { formatMins } from '../../lib/format';
import { isManualSleepPost } from '../../lib/sleepPostCustom';
import type { SleepPost } from '../../lib/types';

export default function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<SleepPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleSocialPatch = useCallback((_postId: string, patch: PostSocialPatch) => {
    setPost((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const row = await fetchPost(id);
      if (!row) {
        setPost(null);
        setError('Post not found.');
        return;
      }
      setPost(row);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not load post.');
      setPost(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="app-page">
        <p className="app-muted">Loading post…</p>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="app-page">
        <p className="admin-error">{error ?? 'Post not found.'}</p>
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

      <dl className="post-detail-stats">
        <div>
          <dt>In bed</dt>
          <dd>{formatMins(post.inBedMinutes)}</dd>
        </div>
        {post.awakeMinutes > 0 && (
          <div>
            <dt>Awake</dt>
            <dd>{formatMins(post.awakeMinutes)}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}
