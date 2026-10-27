import { Link } from 'react-router-dom';
import Avatar from './Avatar';
import ChallengeGraceCountdown from './ChallengeGraceCountdown';
import {
  challengeHasOfficiallyStarted,
  challengeEndsLabel,
} from '../lib/challengeSections';
import {
  challengeStartLabel,
  formatChallengeRaceType,
  formatChallengeStartDate,
  formatMins,
  goalHours,
  PENDING_COMPLETION_BANNER_PREFIX,
  PENDING_COMPLETION_BANNER_SUFFIX,
  pluralCount,
} from '../lib/format';
import type { Challenge, ChallengeProgress } from '../lib/types';

type Props = {
  challenge: Challenge;
  currentUserId: string;
  variant: 'race' | 'invite' | 'compact';
  progress?: ChallengeProgress[];
};

function pct(minutes: number, goal: number): number {
  if (goal <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((minutes / goal) * 100)));
}

export default function ChallengeCard({ challenge, currentUserId, variant, progress }: Props) {
  if (variant === 'invite') {
    return <InviteCard challenge={challenge} />;
  }
  if (variant === 'compact') {
    return <CompactCard challenge={challenge} currentUserId={currentUserId} />;
  }
  return (
    <RaceCard
      challenge={challenge}
      currentUserId={currentUserId}
      progress={progress}
    />
  );
}

function InviteCard({ challenge }: { challenge: Challenge }) {
  const inviter = challenge.participants.find((p) => p.role === 'creator')
    ?? challenge.participants[0];
  const title = challenge.isGroup
    ? `invited you to ${challenge.title?.trim() || 'a group challenge'}`
    : `challenged you to a ${goalHours(challenge.goalMinutes)} sleep challenge`;

  return (
    <Link to={`/challenges/${challenge.id}`} className="challenge-card challenge-card-link challenge-card--accent">
      <div className="challenge-invite">
        {inviter ? (
          <Avatar
            userId={inviter.userId}
            username={inviter.username}
            avatarUrl={inviter.avatarUrl}
            userRoles={inviter.userRoles}
            size="sm"
          />
        ) : null}
        <div className="challenge-invite-copy">
          <p className="challenge-invite-title">
            {inviter ? <span className="challenge-invite-name">@{inviter.username}</span> : 'Someone'}
            {` ${title}`}
          </p>
          <p className="challenge-meta">
            {challenge.isGroup
              ? 'Accept in the app to join. Sleep from the start counts.'
              : 'Most sleep by the deadline wins. Accept in the app.'}
          </p>
        </div>
      </div>
    </Link>
  );
}

function CompactCard({
  challenge,
  currentUserId,
}: {
  challenge: Challenge;
  currentUserId: string;
}) {
  const opponent = challenge.participants.find((p) => p.userId !== currentUserId);
  const waiting = challenge.status === 'pending';
  const tied = challenge.status === 'completed' && challenge.winnerId == null;
  const won = challenge.status === 'completed' && challenge.winnerId === currentUserId;
  const lost = challenge.status === 'completed' && challenge.winnerId != null && !won;
  const result = tied ? 'Tie' : won ? 'Win' : lost ? 'Loss' : null;
  const resultClass = tied ? 'tie' : won ? 'win' : 'loss';
  const subtitle = waiting
    ? `Waiting on a reply · ${goalHours(challenge.goalMinutes)} goal`
    : `${formatChallengeStartDate(challenge.startedAt, challenge.createdAt)} · ${formatChallengeRaceType(challenge)}`;
  const heading = challenge.isGroup
    ? (challenge.hostedBy === 'slumber'
      ? (challenge.title?.trim() || 'Slumber challenge')
      : (challenge.title?.trim() || 'Group challenge'))
    : (opponent ? `@${opponent.username}` : 'Challenge');

  return (
    <Link to={`/challenges/${challenge.id}`} className="challenge-card challenge-card-link challenge-card--compact">
      <div className="challenge-compact">
        {challenge.isGroup ? (
          <span className="challenge-group-mark" aria-hidden="true">👥</span>
        ) : opponent ? (
          <Avatar
            userId={opponent.userId}
            username={opponent.username}
            avatarUrl={opponent.avatarUrl}
            userRoles={opponent.userRoles}
            size="sm"
          />
        ) : null}
        <div className="challenge-compact-copy">
          <p className="challenge-title">{heading}</p>
          <p className="challenge-meta">{subtitle}</p>
        </div>
        {result ? (
          <span className={`challenge-result challenge-result--${resultClass}`}>{result}</span>
        ) : null}
      </div>
    </Link>
  );
}

function RaceCard({
  challenge,
  currentUserId,
  progress,
}: {
  challenge: Challenge;
  currentUserId: string;
  progress?: ChallengeProgress[];
}) {
  const accepted = challenge.participants.filter((p) => p.inviteStatus === 'accepted');
  const opponent = accepted.find((p) => p.userId !== currentUserId) ?? null;
  const started = challengeHasOfficiallyStarted(challenge);
  const ends = challengeEndsLabel(challenge);
  const finalizing = challenge.status === 'pending_completion';
  const title = challenge.isGroup
    ? (challenge.hostedBy === 'slumber'
      ? (challenge.title?.trim() || 'Slumber challenge')
      : `👥 ${challenge.title?.trim() || 'Group challenge'}`)
    : null;

  const scored = started ? (progress ?? []) : [];
  const me = scored.find((p) => p.userId === currentUserId) ?? null;
  const ranked = [...scored].sort((a, b) => b.accruedMinutes - a.accruedMinutes);
  const leader = ranked[0] ?? null;
  const rival = challenge.isGroup
    ? (leader && leader.userId !== currentUserId
      ? leader
      : ranked.find((p) => p.userId !== currentUserId) ?? null)
    : (scored.find((p) => p.userId !== currentUserId) ?? null);

  const myPlace = me
    ? ranked.findIndex((p) => p.userId === me.userId) + 1
    : null;
  const gap = me && rival ? me.accruedMinutes - rival.accruedMinutes : null;
  const gapLabel = gap == null
    ? null
    : gap === 0
      ? 'Tied'
      : gap > 0
        ? `+${formatMins(gap)}`
        : `-${formatMins(Math.abs(gap))}`;

  const meta = [
    challenge.hostedBy === 'slumber' ? 'Hosted by Slumber' : null,
    challenge.isGroup ? pluralCount(accepted.length, 'racer') : null,
    challengeStartLabel(challenge.startedAt, started),
    `${goalHours(challenge.goalMinutes)} goal`,
  ].filter(Boolean).join(' · ');

  return (
    <Link to={`/challenges/${challenge.id}`} className="challenge-card challenge-card-link">
      <div className="challenge-card-top">
        <div className="challenge-card-heading">
          {title ? (
            <h3 className="challenge-title">{title}</h3>
          ) : (
            <h3 className="challenge-title">
              vs {opponent ? `@${opponent.username}` : 'opponent'}
            </h3>
          )}
          <p className="challenge-meta">{meta}</p>
        </div>
        {ends ? <span className="challenge-ends">{ends}</span> : null}
      </div>

      {finalizing ? (
        <p className="challenge-grace-banner">
          <ChallengeGraceCountdown
            challenge={challenge}
            prefix={PENDING_COMPLETION_BANNER_PREFIX}
            suffix={PENDING_COMPLETION_BANNER_SUFFIX}
          />
        </p>
      ) : null}

      {started && progress === undefined ? (
        <p className="challenge-meta challenge-card-wait">Loading standings…</p>
      ) : null}
      {started && (me || rival) ? (
        <div className="challenge-mini-list">
          {me ? <MiniBar row={me} mine /> : null}
          {rival && rival.userId !== currentUserId ? <MiniBar row={rival} mine={false} /> : null}
        </div>
      ) : null}

      {(gapLabel || (challenge.isGroup && myPlace)) ? (
        <div className="challenge-card-foot">
          {gapLabel ? (
            <span className={gap != null && gap > 0 ? 'challenge-gap challenge-gap--ahead' : 'challenge-gap'}>
              {gapLabel}
            </span>
          ) : <span />}
          {challenge.isGroup && myPlace ? (
            <span className="challenge-place-note">
              {myPlace} of {ranked.length || accepted.length}
            </span>
          ) : null}
        </div>
      ) : null}
    </Link>
  );
}

function MiniBar({ row, mine }: { row: ChallengeProgress; mine: boolean }) {
  const width = pct(row.accruedMinutes, row.goalMinutes);
  return (
    <div className="challenge-mini">
      <div className="challenge-mini-top">
        <Avatar
          userId={row.userId}
          username={row.username}
          avatarUrl={row.avatarUrl}
          size="compact"
        />
        <span className="challenge-mini-name">@{row.username}</span>
        <span className={mine ? 'challenge-mini-mins challenge-mini-mins--me' : 'challenge-mini-mins'}>
          {formatMins(row.accruedMinutes)}
        </span>
      </div>
      <div className="challenge-progress-bar">
        <div
          className={`challenge-progress-fill${mine ? ' challenge-progress-fill--me' : ' challenge-progress-fill--other'}`}
          style={{ width: `${width}%` }}
        />
      </div>
      <span className="challenge-progress-pct">{width}%</span>
    </div>
  );
}
