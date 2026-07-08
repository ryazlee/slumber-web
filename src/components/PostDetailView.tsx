import { useMemo } from 'react';
import { formatMins, formatSleepDate, timeAgo } from '../lib/format';
import { buildLatestPostIdsByUser, isLatestSleepPost } from '../lib/latestSleepPost';
import { hasVisiblePrBadges } from '../lib/pr';
import { hasVisibleSleepBuddies, sleepBuddiesForViewer } from '../lib/sleepBuddiesDisplay';
import { useAuth } from '../context/AuthContext';
import { useMentionProfilePress } from '../hooks/useMentionProfilePress';
import { usePostSocialPatch, useSleepPostDisplay } from '../hooks/useSleepPostDisplay';
import { useLocalMidnightInvalidation } from '../hooks/useLocalMidnightInvalidation';
import { useUserPosts } from '../hooks/useUserPosts';
import type { SleepPost } from '../lib/types';
import ManualLogSleepBlock from './ManualLogSleepBlock';
import PersonalRecordBadges from './PersonalRecordBadges';
import PostDetailSectionHeader from './PostDetailSectionHeader';
import PostPhotoGallery from './PostPhotoGallery';
import PostDetailMetrics from './post/PostDetailMetrics';
import PostDreamBlock from './post/PostDreamBlock';
import PostVibe from './post/PostVibe';
import PostStageMetrics from './post/PostStageMetrics';
import PostSocial, { type PostSocialPatch } from './PostSocial';
import PostTagList from './PostTagList';
import SessionTimelines from './SessionTimelines';
import SleepBuddiesRow from './SleepBuddiesRow';
import StageBreakdown from './StageBreakdown';
import UserLink from './UserLink';
import MentionText from './MentionText';

type Props = {
  post: SleepPost;
  defaultCommentsOpen?: boolean;
  onSocialPatch?: (postId: string, patch: PostSocialPatch) => void;
};

export default function PostDetailView({
  post,
  defaultCommentsOpen = true,
  onSocialPatch,
}: Props) {
  const { user } = useAuth();
  const handleMentionPress = useMentionProfilePress();
  const {
    isManual,
    isOwnPost,
    canReadDream,
    isNapDay,
    napCount,
    sessions,
    showWearableSleep,
    displayTitle,
  } = useSleepPostDisplay(post);

  const todayISO = useLocalMidnightInvalidation();
  const { posts: authorPosts } = useUserPosts(post.userId);
  const isLatestPost = useMemo(() => {
    if (authorPosts.length === 0) return false;
    return isLatestSleepPost(post, buildLatestPostIdsByUser(authorPosts), todayISO);
  }, [post, authorPosts, todayISO]);

  const handleSocialPatch = usePostSocialPatch(post.id, onSocialPatch);
  const visibleBuddies = sleepBuddiesForViewer(post, user?.id);

  return (
    <article className="post-detail-view">
      <header className="post-detail-author">
        <div className="post-detail-author-line">
          <UserLink
            userId={post.userId}
            username={post.username}
            avatarUrl={post.avatarUrl}
            userRoles={post.userRoles}
            showAvatar
            avatarSize="md"
            className="post-author-link"
          />
          {isLatestPost ? <span className="post-badge post-badge-latest">🕒 Latest</span> : null}
          {post.isPrivate ? <span className="post-badge">Private</span> : null}
          {isManual ? <span className="post-badge post-badge-manual">Manual</span> : null}
        </div>
        <p className="post-detail-author-sub">
          {formatSleepDate(post.sleepDate)} · {timeAgo(post.createdAt)}
          {post.locationLabel ? ` · 📍 ${post.locationLabel}` : ''}
        </p>
      </header>

      <h1 className="post-detail-title">{displayTitle}</h1>

      {hasVisiblePrBadges(post) && !isManual ? (
        <div className="post-detail-pr">
          <PersonalRecordBadges post={post} />
        </div>
      ) : null}

      {isManual ? (
        <>
          <PostDetailSectionHeader title="Sleep" />
          <div className="post-detail-panel">
            <ManualLogSleepBlock post={post} variant="detail" />
          </div>
        </>
      ) : showWearableSleep ? (
        <>
          <PostDetailSectionHeader title="Sleep" />
          <div className="post-detail-panel post-detail-sleep">
            <div className="post-sleep-hero">
              <div className="post-sleep-hero-main">
                <span className="post-sleep-duration">{formatMins(post.asleepMinutes)}</span>
                <span className="post-detail-asleep-label">asleep</span>
                {isNapDay ? (
                  <span className="post-nap-chip">
                    ☀️ {napCount === 1 ? 'nap' : `${napCount} naps`}
                  </span>
                ) : null}
              </div>
              {post.vibe ? <PostVibe vibe={post.vibe} showLabel /> : null}
            </div>

            {isNapDay ? (
              <p className="post-nap-callout">
                Split sleep · {post.bedtime !== '—' ? `${post.bedtime} → ${post.wakeTime}` : '—'}
                {post.inBedMinutes > 0 ? ` · ${formatMins(post.inBedMinutes)} in bed` : ''}
              </p>
            ) : post.bedtime !== '—' ? (
              <div className="post-times-row">
                <div className="post-time-block">
                  <span className="post-time-label">Bedtime</span>
                  <span className="post-time-value">{post.bedtime}</span>
                </div>
                <span className="post-time-arrow" aria-hidden>→</span>
                <div className="post-time-block post-time-block--end">
                  <span className="post-time-label">Wake up</span>
                  <span className="post-time-value">{post.wakeTime}</span>
                </div>
              </div>
            ) : null}

            <div className="post-detail-timeline-header">
              <h3 className="post-detail-timeline-title">
                {isNapDay && sessions.length > 0 ? 'Sleep by session' : 'Sleep stages over time'}
              </h3>
              {!isNapDay && post.stageSegments.length > 1 ? (
                <span className="post-detail-timeline-meta">
                  {Math.max(post.stageSegments.length - 1, 0)} transitions
                </span>
              ) : null}
            </div>

            <SessionTimelines post={post} variant="detail" />

            {!isNapDay || sessions.length === 0 ? (
              <PostStageMetrics data={post} className="post-detail-stage-chips" />
            ) : null}
          </div>

          <PostDetailSectionHeader title="Stages" />
          <StageBreakdown post={post} />

          <PostDetailSectionHeader title="Details" />
          <PostDetailMetrics post={post} />
        </>
      ) : null}

      {post.tags.length > 0 ? (
        <>
          <PostDetailSectionHeader title="Factors" />
          <div className="post-detail-panel post-detail-tags">
            <PostTagList tags={post.tags} />
          </div>
        </>
      ) : null}

      {post.notes ? (
        <>
          <PostDetailSectionHeader title="Notes" />
          <div className="post-detail-panel post-detail-text">
            <p className="post-notes">
              <MentionText onMentionPress={handleMentionPress}>{post.notes}</MentionText>
            </p>
          </div>
        </>
      ) : null}

      {post.dreamLog ? (
        <>
          <PostDetailSectionHeader title="Dream" />
          <div className="post-detail-panel post-detail-dream">
            <PostDreamBlock
              dreamLog={post.dreamLog}
              dreamMood={post.dreamMood}
              canReadDream={canReadDream}
              blurDream={post.blurDream}
              isOwnPost={isOwnPost}
              variant="detail"
              onMentionPress={handleMentionPress}
            />
          </div>
        </>
      ) : null}

      {(post.photoUrls?.length ?? 0) > 0 ? (
        <>
          <PostDetailSectionHeader title="Photos" />
          <div className="post-detail-panel post-detail-photos">
            <PostPhotoGallery post={post} variant="detail" />
          </div>
        </>
      ) : null}

      {hasVisibleSleepBuddies(post, user?.id) ? (
        <>
          <PostDetailSectionHeader title="Sleep buddies" />
          <SleepBuddiesRow buddies={visibleBuddies} variant="detail" />
        </>
      ) : null}

      <PostDetailSectionHeader title="Social" />
      <div className="post-detail-panel post-detail-social">
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
    </article>
  );
}
