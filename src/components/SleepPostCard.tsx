import { Link } from 'react-router-dom';
import { formatMins, formatSleepDate, timeAgo } from '../lib/format';
import { vibeColor } from '../lib/sleepPostMeta';
import { usePostSocialPatch, useSleepPostDisplay } from '../hooks/useSleepPostDisplay';
import type { SleepPost } from '../lib/types';
import ManualLogSleepBlock from './ManualLogSleepBlock';
import PersonalRecordBadges from './PersonalRecordBadges';
import PostPhotoGallery from './PostPhotoGallery';
import PostDreamBlock from './post/PostDreamBlock';
import PostStageMetrics from './post/PostStageMetrics';
import PostSocial, { type PostSocialPatch } from './PostSocial';
import SleepTimelineBar from './SleepTimelineBar';
import PostTagList from './PostTagList';
import SleepBuddiesRow from './SleepBuddiesRow';
import UserLink from './UserLink';

type SleepPostCardProps = {
  post: SleepPost;
  showAuthor?: boolean;
  clickable?: boolean;
  isLatestPost?: boolean;
  defaultCommentsOpen?: boolean;
  onSocialPatch?: (postId: string, patch: PostSocialPatch) => void;
};

export default function SleepPostCard({
  post,
  showAuthor = true,
  clickable = true,
  isLatestPost = false,
  defaultCommentsOpen = false,
  onSocialPatch,
}: SleepPostCardProps) {
  const {
    isManual,
    isOwnPost,
    canReadDream,
    vibe,
    isNapDay,
    napCount,
    showWearableSleep,
    timelineSegments,
    displayTitle,
  } = useSleepPostDisplay(post);

  const handleSocialPatch = usePostSocialPatch(post.id, onSocialPatch);

  const metaParts = [
    formatSleepDate(post.sleepDate),
    timeAgo(post.createdAt),
    post.locationLabel ? `📍 ${post.locationLabel}` : null,
  ].filter(Boolean);

  const scheduleParts = [
    !isNapDay && post.bedtime !== '—' ? `${post.bedtime} → ${post.wakeTime}` : null,
    post.inBedMinutes > 0 ? `${formatMins(post.inBedMinutes)} in bed` : null,
  ].filter(Boolean);

  const postDetailLabel = `View post: ${displayTitle}`;

  return (
    <article className={`post-card${clickable ? ' post-card--clickable' : ''}${isLatestPost ? ' post-card--latest' : ''}`}>
      <header className="post-card-header">
        {showAuthor && (
          <div className="post-card-author" data-post-interactive>
            <UserLink
              userId={post.userId}
              username={post.username}
              avatarUrl={post.avatarUrl}
              userRoles={post.userRoles}
              showAvatar
              avatarSize="md"
              className="post-author-link"
            />
            {isLatestPost && <span className="post-badge post-badge-latest">🕒 Latest</span>}
          </div>
        )}
        <div className="post-card-meta">
          {!showAuthor && isLatestPost && <span className="post-badge post-badge-latest">🕒 Latest</span>}
          {post.isPrivate && <span className="post-badge">Private</span>}
          {isManual && <span className="post-badge post-badge-manual">Manual</span>}
        </div>
      </header>

      <p className="post-meta-strip">{metaParts.join(' · ')}</p>

      <h2 className="post-title">{displayTitle}</h2>

      {post.isPR && !isManual ? (
        <PersonalRecordBadges post={post} />
      ) : null}

      {isManual ? (
        <ManualLogSleepBlock post={post} />
      ) : showWearableSleep ? (
        <div className="post-hypno-wrap">
          <div className="post-sleep-hero">
            <div className="post-sleep-hero-main">
              <span className="post-sleep-duration">{formatMins(post.asleepMinutes)}</span>
              {isNapDay ? (
                <span className="post-nap-chip">
                  ☀️ {napCount === 1 ? 'nap day' : `${napCount} naps`}
                </span>
              ) : null}
            </div>
            {vibe && post.vibe ? (
              <div className="post-vibe" style={{ color: vibeColor(post.vibe) }}>
                <span className="post-vibe-emoji" aria-hidden>{vibe.emoji}</span>
              </div>
            ) : null}
          </div>

          {scheduleParts.length > 0 ? (
            <p className="post-schedule-meta">{scheduleParts.join(' · ')}</p>
          ) : null}

          <SleepTimelineBar
            segments={timelineSegments}
            bedtime={post.bedtime}
            wakeTime={post.wakeTime}
            sessionBreakdown={post.sessionBreakdown}
            variant={clickable ? 'card' : 'detail'}
          />

          <PostStageMetrics data={post} />
        </div>
      ) : null}

      <PostTagList tags={post.tags} />

      {post.notes && <p className="post-notes">{post.notes}</p>}

      <PostDreamBlock
        dreamLog={post.dreamLog ?? ''}
        canReadDream={canReadDream}
        blurDream={post.blurDream}
        isOwnPost={isOwnPost}
      />

      {(post.photoUrls?.length ?? 0) > 0 ? (
        <div data-post-interactive>
          <PostPhotoGallery post={post} variant="feed" />
        </div>
      ) : null}

      {(post.sleepBuddies?.length ?? 0) > 0 ? (
        <SleepBuddiesRow buddies={post.sleepBuddies!} variant="card" />
      ) : null}

      <div data-post-interactive>
        <PostSocial
          postId={post.id}
          kudosCount={post.kudosCount}
          hasKudoed={post.hasKudoed}
          commentCount={post.commentCount}
          sourceDevice={isManual ? 'Manual log' : post.sourceDevice}
          defaultCommentsOpen={defaultCommentsOpen}
          onPatch={handleSocialPatch}
        />
      </div>

      {clickable ? (
        <Link
          to={`/post/${post.id}`}
          className="post-card-stretch-link"
          aria-label={postDetailLabel}
          tabIndex={-1}
        />
      ) : null}
    </article>
  );
}
