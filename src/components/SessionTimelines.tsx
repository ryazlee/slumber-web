import { formatMins } from '../lib/format';
import { getSessionLabel, hasNapDay, isNapSession } from '../lib/napDay';
import { segmentsForPost } from '../lib/timeline';
import type { SleepPost, SleepSessionData } from '../lib/types';
import PostStageMetrics from './post/PostStageMetrics';
import SleepTimelineBar from './SleepTimelineBar';

type PostTimelineInput = Pick<
  SleepPost,
  | 'stageSegments'
  | 'sessionBreakdown'
  | 'bedtime'
  | 'wakeTime'
  | 'inBedMinutes'
  | 'coreMinutes'
  | 'deepMinutes'
  | 'remMinutes'
  | 'awakeMinutes'
  | 'awakeEvents'
>;

type Props = {
  post: PostTimelineInput;
  variant?: 'card' | 'detail';
};

function SessionBlock({
  session,
  idx,
  sessions,
  variant,
  isLast,
}: {
  session: SleepSessionData;
  idx: number;
  sessions: SleepSessionData[];
  variant: 'card' | 'detail';
  isLast: boolean;
}) {
  const sessionIsNap = isNapSession(session);
  const sessionLabel = getSessionLabel(session, idx, sessions);

  if (variant === 'detail') {
    return (
      <div className={`session-timeline-detail${!isLast ? ' session-timeline-detail--divided' : ''}`}>
        <p className="session-timeline-detail-header">
          <span className="session-timeline-detail-label">
            {sessionIsNap ? '☀️' : '🌙'} {sessionLabel}
          </span>
          <span className="session-timeline-detail-meta">
            {' · '}{session.bedtime} – {session.wakeTime} · {formatMins(session.asleepMinutes)}
          </span>
        </p>
        <SleepTimelineBar
          segments={session.segments}
          bedtime={session.bedtime}
          wakeTime={session.wakeTime}
          variant="detail"
        />
        <PostStageMetrics data={session} labelStyle="title" className="post-stage-metrics--session" />
      </div>
    );
  }

  return (
    <div className={`session-timeline-card${sessionIsNap ? ' session-timeline-card--nap' : ' session-timeline-card--overnight'}`}>
      <div className="session-timeline-card-header">
        <span className={`session-timeline-badge${sessionIsNap ? ' session-timeline-badge--nap' : ' session-timeline-badge--overnight'}`}>
          {sessionIsNap ? '☀️ NAP' : '🌙 OVERNIGHT'}
        </span>
        <span className="session-timeline-card-times">{session.bedtime} → {session.wakeTime}</span>
        <span className="session-timeline-card-label">{sessionLabel}</span>
      </div>
      <SleepTimelineBar
        segments={session.segments}
        bedtime={session.bedtime}
        wakeTime={session.wakeTime}
        variant="card"
      />
    </div>
  );
}

export default function SessionTimelines({ post, variant = 'card' }: Props) {
  const sessions = post.sessionBreakdown ?? [];
  const isNapDay = hasNapDay(post);
  const segments = segmentsForPost(post);

  if (isNapDay && sessions.length > 0) {
    return (
      <div className="session-timelines">
        {sessions.map((session, idx) => (
          <SessionBlock
            key={`session-${idx}`}
            session={session}
            idx={idx}
            sessions={sessions}
            variant={variant}
            isLast={idx === sessions.length - 1}
          />
        ))}
      </div>
    );
  }

  return (
    <SleepTimelineBar
      segments={segments}
      bedtime={post.bedtime}
      wakeTime={post.wakeTime}
      sessionBreakdown={post.sessionBreakdown}
      variant={variant}
    />
  );
}
