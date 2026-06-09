import { useAuth } from '../context/AuthContext';
import type { SleepPost } from '../lib/types';
import { formatMins, formatSleepDate } from '../lib/format';
import PostSocial from './PostSocial';
import UserLink from './UserLink';

type SleepPostCardProps = {
  post: SleepPost;
  showAuthor?: boolean;
};

function stageFlex(post: SleepPost): Array<{ type: string; flex: number }> {
  if (post.stageSegments.length > 0) {
    const total = post.stageSegments.reduce((s, seg) => s + seg.minutes, 0) || 1;
    return post.stageSegments.map((seg) => ({
      type: seg.type.toLowerCase(),
      flex: seg.minutes / total,
    }));
  }

  const parts = [
    { type: 'core', flex: post.coreMinutes },
    { type: 'deep', flex: post.deepMinutes },
    { type: 'rem', flex: post.remMinutes },
    { type: 'awake', flex: post.awakeMinutes },
  ].filter((p) => p.flex > 0);

  const total = parts.reduce((s, p) => s + p.flex, 0) || 1;
  return parts.map((p) => ({ ...p, flex: p.flex / total }));
}

export default function SleepPostCard({ post, showAuthor = true }: SleepPostCardProps) {
  const { user } = useAuth();
  const segments = stageFlex(post);
  const isOwnPost = user?.id === post.userId;
  const canReadDream = Boolean(post.dreamLog) && (!post.blurDream || isOwnPost);

  return (
    <article className="post-card">
      <header className="post-card-header">
        {showAuthor && (
          <UserLink
            userId={post.userId}
            username={post.username}
            avatarUrl={post.avatarUrl}
            showAvatar
            avatarSize="md"
            className="post-author-link"
          />
        )}
        <div className="post-card-meta">
          <span className="post-date">{formatSleepDate(post.sleepDate)}</span>
          {post.isPrivate && <span className="post-badge">Private</span>}
          {post.isPR && <span className="post-badge post-badge-pr">PR</span>}
        </div>
      </header>

      <h2 className="post-title">{post.title}</h2>

      <div className="hypno-demo post-hypno">
        <div className="hypno-labels">
          <span>{post.bedtime}</span>
          <span>{post.wakeTime}</span>
        </div>
        <div className="hypno-bar">
          {segments.length > 0 ? segments.map((seg, i) => (
            <div
              key={`${seg.type}-${i}`}
              className={`hypno-seg ${seg.type}`}
              style={{ flex: seg.flex }}
            />
          )) : (
            <div className="hypno-seg core" style={{ flex: 1 }} />
          )}
        </div>
        <div className="hypno-stats">
          <span><strong>{formatMins(post.asleepMinutes)}</strong> asleep</span>
          {post.coreMinutes > 0 && <span><strong>Core</strong> {formatMins(post.coreMinutes)}</span>}
          {post.deepMinutes > 0 && <span><strong>Deep</strong> {formatMins(post.deepMinutes)}</span>}
          {post.remMinutes > 0 && <span><strong>REM</strong> {formatMins(post.remMinutes)}</span>}
        </div>
      </div>

      {post.tags.length > 0 && (
        <div className="post-tags">
          {post.tags.map((tag) => (
            <span key={tag} className="post-tag">{tag}</span>
          ))}
        </div>
      )}

      {post.notes && <p className="post-notes">{post.notes}</p>}

      {post.dreamLog && (
        <div className="post-dream">
          {canReadDream ? (
            <>
              {post.blurDream && isOwnPost && (
                <span className="post-dream-badge">Private dream</span>
              )}
              <p className="post-dream-text">
                <span className="post-dream-icon" aria-hidden="true">💭</span>
                {post.dreamLog}
              </p>
            </>
          ) : (
            <div className="post-dream-private">
              <span className="post-dream-badge">Private dream</span>
              <p className="post-dream-hint">Dream logged (only they can read it)</p>
            </div>
          )}
        </div>
      )}

      <PostSocial
        postId={post.id}
        kudosCount={post.kudosCount}
        commentCount={post.commentCount}
        sourceDevice={post.sourceDevice}
      />
    </article>
  );
}
