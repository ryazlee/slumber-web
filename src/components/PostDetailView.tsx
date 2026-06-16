import { useCallback } from 'react';
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
import PostDetailSectionHeader from './PostDetailSectionHeader';
import PostPhotoGallery from './PostPhotoGallery';
import PostSocial, { type PostSocialPatch } from './PostSocial';
import PostTagList from './PostTagList';
import SleepTimelineBar from './SleepTimelineBar';
import StageBreakdown from './StageBreakdown';
import UserLink from './UserLink';

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
  const isManual = isManualSleepPost(post);
  const isOwnPost = user?.id === post.userId;
  const canReadDream = Boolean(post.dreamLog) && (!post.blurDream || isOwnPost);
  const isLatest = isLatestSleepPost(post.sleepDate);
  const vibe = post.vibe ? VIBE_CONFIG[post.vibe] : undefined;
  const isNapDay = !isManual && hasNapDay(post);
  const napCount = countNaps(post.sessionBreakdown) || (isNapDay ? 1 : 0);
  const sessions = post.sessionBreakdown ?? [];
  const showWearableSleep = !isManual && post.asleepMinutes > 0;
  const timelineSegments = segmentsForPost(post);
  const displayTitle = customSleepPostTitle(post.title, post.sleepDate);

  const handleSocialPatch = useCallback(
    (patch: PostSocialPatch) => { onSocialPatch?.(post.id, patch); },
    [onSocialPatch, post.id],
  );

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
          {isLatest ? <span className="post-badge post-badge-latest">🕒 Latest</span> : null}
          {post.isPrivate ? <span className="post-badge">Private</span> : null}
          {isManual ? <span className="post-badge post-badge-manual">Manual</span> : null}
        </div>
        <p className="post-detail-author-sub">
          {formatSleepDate(post.sleepDate)} · {timeAgo(post.createdAt)}
          {post.locationLabel ? ` · 📍 ${post.locationLabel}` : ''}
        </p>
      </header>

      {displayTitle ? <h1 className="post-detail-title">{displayTitle}</h1> : null}

      {post.isPR && !isManual ? (
        <div className="post-detail-pr">
          <PersonalRecordBadges post={post} />
        </div>
      ) : null}

      {isManual ? (
        <>
          <PostDetailSectionHeader title="Sleep" />
          <div className="post-detail-panel">
            <ManualLogSleepBlock post={post} />
          </div>
        </>
      ) : showWearableSleep ? (
        <>
          <PostDetailSectionHeader title="Sleep" />
          <div className="post-detail-panel post-detail-sleep">
            <div className="post-sleep-hero">
              <div className="post-sleep-hero-main">
                <span className="post-sleep-duration">{formatMins(post.asleepMinutes)}</span>
                <span className="post-detail-asleep-label">
                  asleep{isNapDay ? ' · nap day' : ''}
                </span>
                {isNapDay ? (
                  <span className="post-nap-chip">
                    ☀️ {napCount === 1 ? 'nap day' : `${napCount} naps`}
                  </span>
                ) : null}
              </div>
              {vibe && post.vibe ? (
                <div className="post-vibe" style={{ color: vibeColor(post.vibe) }}>
                  <span className="post-vibe-emoji" aria-hidden>{vibe.emoji}</span>
                  <span className="post-vibe-label">{vibe.label}</span>
                </div>
              ) : null}
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

            <SleepTimelineBar
              segments={timelineSegments}
              bedtime={post.bedtime}
              wakeTime={post.wakeTime}
              sessionBreakdown={post.sessionBreakdown}
              variant="detail"
            />

            {isNapDay && sessions.length > 0 ? (
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
                          Core {formatMins(session.coreMinutes)}
                        </span>
                      )}
                      {session.deepMinutes > 0 && (
                        <span className="post-stage-metric post-stage-metric--deep">
                          Deep {formatMins(session.deepMinutes)}
                        </span>
                      )}
                      {session.remMinutes > 0 && (
                        <span className="post-stage-metric post-stage-metric--rem">
                          REM {formatMins(session.remMinutes)}
                        </span>
                      )}
                      {session.awakeMinutes > 0 && (
                        <span className="post-stage-metric post-stage-metric--awake">
                          Awake {formatMins(session.awakeMinutes)}
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
              <div className="post-stage-metrics post-detail-stage-chips">
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
          </div>

          <PostDetailSectionHeader title="Stages" />
          <StageBreakdown post={post} />

          <PostDetailSectionHeader title="Details" />
          <dl className="post-detail-metrics">
            <div className="post-detail-metric">
              <dt>In bed</dt>
              <dd>{formatMins(post.inBedMinutes)}</dd>
            </div>
            <div className="post-detail-metric">
              <dt>Asleep</dt>
              <dd>{formatMins(post.asleepMinutes)}</dd>
            </div>
            {post.awakeEvents > 0 ? (
              <div className="post-detail-metric post-detail-metric--awake">
                <dt>Wakes</dt>
                <dd>{post.awakeEvents}</dd>
              </div>
            ) : null}
            <div className="post-detail-metric">
              <dt>Device</dt>
              <dd className="post-detail-metric-device">{post.sourceDevice || '—'}</dd>
            </div>
          </dl>
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
            <p className="post-notes">{post.notes}</p>
          </div>
        </>
      ) : null}

      {post.dreamLog ? (
        <>
          <PostDetailSectionHeader title="Dream" />
          <div className="post-detail-panel post-detail-dream">
            {canReadDream ? (
              <>
                {post.blurDream && isOwnPost ? (
                  <span className="post-dream-badge">Private dream</span>
                ) : null}
                <p className="post-dream-text">
                  <span className="post-dream-icon" aria-hidden>💭</span>
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
