import { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { SleepPost } from '../lib/types';
import { formatMins, formatSleepDate, isLatestSleepPost, timeAgo } from '../lib/format';
import { isManualSleepPost } from '../lib/sleepPostCustom';
import { customSleepPostTitle } from '../lib/sleepPostTitle';
import { countNaps, getSessionLabel, hasNapDay, isNapSession } from '../lib/napDay';
import { VIBE_CONFIG, vibeColor } from '../lib/sleepPostMeta';
import { segmentsForPost } from '../lib/timeline';
import ManualLogSleepBlock from './ManualLogSleepBlock';
import PersonalRecordBadges from './PersonalRecordBadges';
import PostPhotoGallery from './PostPhotoGallery';
import PostSocial, { type PostSocialPatch } from './PostSocial';
import SleepTimelineBar from './SleepTimelineBar';
import PostTagList from './PostTagList';
import UserLink from './UserLink';

type SleepPostCardProps = {
  post: SleepPost;
  showAuthor?: boolean;
  clickable?: boolean;
  variant?: 'card' | 'detail';
  defaultCommentsOpen?: boolean;
  onSocialPatch?: (postId: string, patch: PostSocialPatch) => void;
};

export default function SleepPostCard({
  post,
  showAuthor = true,
  clickable = true,
  variant = 'card',
  defaultCommentsOpen = false,
  onSocialPatch,
}: SleepPostCardProps) {
  const { user } = useAuth();
  const isManual = isManualSleepPost(post);
  const isDetail = variant === 'detail';
  const timelineSegments = segmentsForPost(post);
  const timelineVariant = isDetail ? 'detail' : clickable ? 'card' : 'detail';
  const isOwnPost = user?.id === post.userId;
  const canReadDream = Boolean(post.dreamLog) && (!post.blurDream || isOwnPost);
  const isLatest = isLatestSleepPost(post.sleepDate);
  const vibe = post.vibe ? VIBE_CONFIG[post.vibe] : undefined;
  const isNapDay = !isManual && hasNapDay(post);
  const napCount = countNaps(post.sessionBreakdown) || (isNapDay ? 1 : 0);
  const sessions = post.sessionBreakdown ?? [];
  const showWearableSleep = !isManual && post.asleepMinutes > 0;
  const displayTitle = customSleepPostTitle(post.title, post.sleepDate);

  const handleSocialPatch = useCallback(
    (patch: PostSocialPatch) => { onSocialPatch?.(post.id, patch); },
    [onSocialPatch, post.id],
  );

  const metaParts = [
    formatSleepDate(post.sleepDate),
    timeAgo(post.createdAt),
    post.locationLabel ? `📍 ${post.locationLabel}` : null,
  ].filter(Boolean);

  const scheduleParts = [
    !isNapDay && post.bedtime !== '—' ? `${post.bedtime} → ${post.wakeTime}` : null,
    post.inBedMinutes > 0 ? `${formatMins(post.inBedMinutes)} in bed` : null,
  ].filter(Boolean);

  return (
    <article className={`post-card${clickable ? ' post-card--clickable' : ''}${isLatest ? ' post-card--latest' : ''}${isDetail ? ' post-card--detail' : ''}`}>
      {clickable && (
        <Link
          to={`/post/${post.id}`}
          className="post-card-stretch-link"
          aria-label={displayTitle
            ? `View post: ${displayTitle}`
            : `View sleep from ${formatSleepDate(post.sleepDate)}`}
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
          {!showAuthor && isLatest && <span className="post-badge post-badge-latest">🕒 Latest</span>}
          {post.isPrivate && <span className="post-badge">Private</span>}
          {isManual && <span className="post-badge post-badge-manual">Manual</span>}
        </div>
      </header>

      <p className="post-meta-strip post-card-interactive">{metaParts.join(' · ')}</p>

      {displayTitle ? <h2 className="post-title">{displayTitle}</h2> : null}

      {post.isPR && !isManual ? (
        <div className="post-card-interactive">
          <PersonalRecordBadges post={post} />
        </div>
      ) : null}

      {isManual ? (
        <ManualLogSleepBlock post={post} />
      ) : showWearableSleep ? (
        <div className="post-card-interactive post-hypno-wrap">
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
                {isDetail ? <span className="post-vibe-label">{vibe.label}</span> : null}
              </div>
            ) : null}
          </div>

          {isDetail && isNapDay ? (
            <p className="post-nap-callout app-muted">
              Split sleep day · {formatMins(post.inBedMinutes)} total in bed
            </p>
          ) : null}

          {scheduleParts.length > 0 ? (
            <p className="post-schedule-meta">{scheduleParts.join(' · ')}</p>
          ) : null}

          {isDetail && !isNapDay && post.bedtime !== '—' ? (
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

          <SleepTimelineBar
            segments={timelineSegments}
            bedtime={post.bedtime}
            wakeTime={post.wakeTime}
            sessionBreakdown={post.sessionBreakdown}
            variant={timelineVariant}
          />

          {isDetail && isNapDay && sessions.length > 0 ? (
            <div className="post-session-stats">
              {sessions.map((session, idx) => (
                <div key={`session-${idx}`} className="post-session-block">
                  <p className="post-session-title">
                    {isNapSession(session) ? '☀️ Nap' : '🌙 Overnight'}
                    {' · '}
                    {getSessionLabel(session, idx, sessions)}
                  </p>
                  <div className="post-stage-metrics post-stage-metrics--session">
                    {session.coreMinutes > 0 && (
                      <span className="post-stage-metric post-stage-metric--core">
                        {formatMins(session.coreMinutes)} core
                      </span>
                    )}
                    {session.deepMinutes > 0 && (
                      <span className="post-stage-metric post-stage-metric--deep">
                        {formatMins(session.deepMinutes)} deep
                      </span>
                    )}
                    {session.remMinutes > 0 && (
                      <span className="post-stage-metric post-stage-metric--rem">
                        {formatMins(session.remMinutes)} rem
                      </span>
                    )}
                    {session.awakeMinutes > 0 && (
                      <span className="post-stage-metric post-stage-metric--awake">
                        {formatMins(session.awakeMinutes)} awake
                      </span>
                    )}
                    {session.awakeEvents > 0 && (
                      <span className="post-stage-metric post-stage-metric--muted">
                        {session.awakeEvents} {session.awakeEvents === 1 ? 'wake' : 'wakes'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="post-stage-metrics">
              {post.coreMinutes > 0 && (
                <span className="post-stage-metric post-stage-metric--core">
                  {formatMins(post.coreMinutes)} core
                </span>
              )}
              {post.deepMinutes > 0 && (
                <span className="post-stage-metric post-stage-metric--deep">
                  {formatMins(post.deepMinutes)} deep
                </span>
              )}
              {post.remMinutes > 0 && (
                <span className="post-stage-metric post-stage-metric--rem">
                  {formatMins(post.remMinutes)} rem
                </span>
              )}
              {post.awakeMinutes > 0 && (
                <span className="post-stage-metric post-stage-metric--awake">
                  {formatMins(post.awakeMinutes)} awake
                </span>
              )}
              {post.awakeEvents > 0 && (
                <span className="post-stage-metric post-stage-metric--muted">
                  {post.awakeEvents} {post.awakeEvents === 1 ? 'wake' : 'wakes'}
                </span>
              )}
            </div>
          )}

          {isDetail && post.stageSegments.length > 1 ? (
            <p className="post-timeline-meta app-muted">
              {Math.max(post.stageSegments.length - 1, 0)} stage transitions
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="post-card-interactive">
        <PostPhotoGallery post={post} variant={isDetail ? 'detail' : 'feed'} />
      </div>

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

      {isDetail && !isManual && (
        <dl className="post-detail-metrics post-detail-metrics--inline">
          <div className="post-detail-metric">
            <dt>In bed</dt>
            <dd>{formatMins(post.inBedMinutes)}</dd>
          </div>
          <div className="post-detail-metric">
            <dt>Asleep</dt>
            <dd>{formatMins(post.asleepMinutes)}</dd>
          </div>
          {post.awakeEvents > 0 ? (
            <div className="post-detail-metric">
              <dt>Wakes</dt>
              <dd>{post.awakeEvents}</dd>
            </div>
          ) : null}
          <div className="post-detail-metric">
            <dt>Device</dt>
            <dd>{post.sourceDevice || '—'}</dd>
          </div>
        </dl>
      )}

      <div className="post-card-interactive">
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
