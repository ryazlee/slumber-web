import UserLink from './UserLink';
import ChallengePlaceBadge from './ChallengePlaceBadge';
import type { ProgressBarSegment } from '../lib/challengeProgressBar';
import { formatMins, goalHours } from '../lib/format';

const BAR_COLOR_ME = 'var(--accent)';
const BAR_COLOR_OTHER = 'var(--core)';

type Props = {
  userId: string;
  username: string;
  avatarUrl?: string;
  userRoles?: string[] | null;
  displayMinutes: number;
  displayNights: number;
  goalMinutes: number;
  totalPct: number;
  segments: ProgressBarSegment[];
  isMe: boolean;
  place?: number | null;
  placeTied?: boolean;
  showPlace?: boolean;
  syncCountdownLabel?: string | null;
};

export default function ChallengeProgressRow({
  userId,
  username,
  avatarUrl,
  userRoles,
  displayMinutes,
  displayNights,
  goalMinutes,
  totalPct,
  segments,
  isMe,
  place,
  placeTied,
  showPlace = false,
  syncCountdownLabel,
}: Props) {
  const barColor = isMe ? BAR_COLOR_ME : BAR_COLOR_OTHER;

  return (
    <div className={`challenge-progress-row${isMe ? ' challenge-progress-row--me' : ''}`}>
      <div className="challenge-progress-top">
        {showPlace && place != null ? (
          <ChallengePlaceBadge
            place={place}
            tied={placeTied}
            compact
            fallbackColor={isMe ? BAR_COLOR_ME : 'var(--text-dim)'}
          />
        ) : null}
        <UserLink
          userId={userId}
          username={username}
          avatarUrl={avatarUrl}
          userRoles={userRoles}
          showAvatar
          avatarSize="sm"
          className="challenge-progress-name"
        />
        <span className="challenge-progress-stats" style={{ color: barColor }}>
          {formatMins(displayMinutes)} · {displayNights} night{displayNights === 1 ? '' : 's'}
        </span>
      </div>
      <div className="challenge-progress-bar">
        <div
          className={`challenge-progress-fill${isMe ? ' challenge-progress-fill--me' : ' challenge-progress-fill--other'}`}
          style={{ width: `${Math.max(totalPct, 0)}%` }}
        >
          {segments.slice(0, -1).map((seg) => {
            const dividerPos = totalPct
              ? ((seg.startPct + seg.widthPct) / totalPct) * 100
              : 0;
            return (
              <span
                key={`${userId}-divider-${seg.date}`}
                className="challenge-progress-divider"
                style={{ left: `${dividerPos}%` }}
              />
            );
          })}
        </div>
      </div>
      <span className="challenge-progress-pct">
        {totalPct}% of {goalHours(goalMinutes)}
        {syncCountdownLabel ? (
          <> · <span className="challenge-sync-countdown">{syncCountdownLabel}</span></>
        ) : null}
      </span>
    </div>
  );
}
