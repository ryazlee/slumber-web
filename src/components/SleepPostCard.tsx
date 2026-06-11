import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { SleepPost } from '../lib/types';
import { formatMins, formatSleepDate, isLatestSleepPost } from '../lib/format';
import { isManualSleepPost } from '../lib/sleepPostCustom';
import { segmentsForPost } from '../lib/timeline';
import ManualLogSleepBlock from './ManualLogSleepBlock';
import PostSocial, { type PostSocialPatch } from './PostSocial';
import SleepTimelineBar from './SleepTimelineBar';
import PostTagList from './PostTagList';
import UserLink from './UserLink';

type SleepPostCardProps = {
  post: SleepPost;
  showAuthor?: boolean;
  clickable?: boolean;
  defaultCommentsOpen?: boolean;
  onSocialPatch?: (postId: string, patch: PostSocialPatch) => void;
};

export default function SleepPostCard({
  post,
  showAuthor = true,
  clickable = true,
  defaultCommentsOpen = false,
  onSocialPatch,
}: SleepPostCardProps) {
  const { user } = useAuth();
  const isManual = isManualSleepPost(post);
  const timelineSegments = segmentsForPost(post);
  const timelineVariant = clickable ? 'card' : 'detail';
  const isOwnPost = user?.id === post.userId;
  const canReadDream = Boolean(post.dreamLog) && (!post.blurDream || isOwnPost);
  const isLatest = isLatestSleepPost(post.sleepDate);

  return (
    <article className={`post-card${clickable ? ' post-card--clickable' : ''}${isLatest ? ' post-card--latest' : ''}`}>
      {clickable && (
        <Link
          to={`/post/${post.id}`}
          className="post-card-stretch-link"
          aria-label={`View post: ${post.title}`}
        />
      )}

      <header className={`post-card-header${showAuthor ? ' post-card-interactive' : ''}`}>
        {showAuthor && (
          <div className="post-card-author">
            <UserLink
              userId={post.userId}
              username={post.username}
              avatarUrl={post.avatarUrl}
              userRoles={post.userRoles}
              showAvatar
              avatarSize="md"
              className="post-author-link"
            />
            {isLatest && <span className="post-badge post-badge-latest">🕒 Latest</span>}
          </div>
        )}
        <div className="post-card-meta">
          <span className="post-date">{formatSleepDate(post.sleepDate)}</span>
          {!showAuthor && isLatest && <span className="post-badge post-badge-latest">🕒 Latest</span>}
          {post.isPrivate && <span className="post-badge">Private</span>}
          {post.isPR && !isManual && <span className="post-badge post-badge-pr">PR</span>}
          {isManual && <span className="post-badge post-badge-manual">Manual</span>}
        </div>
      </header>

      <h2 className="post-title">{post.title}</h2>

      {isManual ? (
        <ManualLogSleepBlock post={post} />
      ) : (
        <div className="post-card-interactive post-hypno-wrap">
          <SleepTimelineBar
            segments={timelineSegments}
            bedtime={post.bedtime}
            wakeTime={post.wakeTime}
            sessionBreakdown={post.sessionBreakdown}
            variant={timelineVariant}
          />
          <div className="hypno-stats">
            <span><strong>{formatMins(post.asleepMinutes)}</strong> asleep</span>
            {post.coreMinutes > 0 && <span><strong>Core</strong> {formatMins(post.coreMinutes)}</span>}
            {post.deepMinutes > 0 && <span><strong>Deep</strong> {formatMins(post.deepMinutes)}</span>}
            {post.remMinutes > 0 && <span><strong>REM</strong> {formatMins(post.remMinutes)}</span>}
          </div>
        </div>
      )}

      <PostTagList tags={post.tags} />

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

      <div className="post-card-interactive">
        <PostSocial
          postId={post.id}
          kudosCount={post.kudosCount}
          hasKudoed={post.hasKudoed}
          commentCount={post.commentCount}
          sourceDevice={isManual ? 'Manual log' : post.sourceDevice}
          defaultCommentsOpen={defaultCommentsOpen}
          onPatch={(patch) => onSocialPatch?.(post.id, patch)}
        />
      </div>
    </article>
  );
}
