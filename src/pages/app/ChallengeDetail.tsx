import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import ChallengeContributionsByDay from '../../components/ChallengeContributionsByDay';
import ChallengeGraceCountdown from '../../components/ChallengeGraceCountdown';
import ChallengeProgressRow from '../../components/ChallengeProgressRow';
import UserLink from '../../components/UserLink';
import { useAuth } from '../../context/AuthContext';
import {
  useChallenge,
  useChallengeContributions,
  useChallengeProgress,
} from '../../hooks/useChallenges';
import { useGraceCountdown } from '../../hooks/useGraceCountdown';
import { buildSplitBarsByUser } from '../../lib/challengeProgressBar';
import { challengeGraceEndsAtMs } from '../../lib/challengeGrace';
import { rankBySleepProgress } from '../../lib/challengeRank';
import {
  formatChallengeRaceType,
  formatChallengeStartDate,
  formatChallengeStatus,
} from '../../lib/format';

const PROGRESS_STATUSES = new Set(['active', 'pending_completion', 'completed']);

export default function ChallengeDetail() {
  const { user } = useAuth();
  const currentUserId = user?.id ?? null;
  const { id } = useParams<{ id: string }>();

  const challengeQuery = useChallenge(id);
  const challenge = challengeQuery.data;
  const showProgress = challenge ? PROGRESS_STATUSES.has(challenge.status) : false;

  const progressQuery = useChallengeProgress(id, showProgress);
  const contributionsQuery = useChallengeContributions(id, showProgress);

  const progress = progressQuery.data ?? [];
  const contributions = contributionsQuery.data ?? [];

  const loading = challengeQuery.isLoading
    || (showProgress && (progressQuery.isLoading || contributionsQuery.isLoading));

  const error = challengeQuery.error
    ?? progressQuery.error
    ?? contributionsQuery.error;

  const errorMessage = error instanceof Error
    ? error.message
    : error
      ? 'Could not load challenge.'
      : null;

  const splitBarByUser = useMemo(
    () => buildSplitBarsByUser(contributions, progress),
    [contributions, progress],
  );

  const userRolesById = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const p of challenge?.participants ?? []) {
      if (p.userRoles?.length) map.set(p.userId, p.userRoles);
    }
    return map;
  }, [challenge?.participants]);

  const rankedProgress = useMemo(() => {
    const rows = rankBySleepProgress(
      progress.map((p) => {
        const split = splitBarByUser.find((s) => s.userId === p.userId);
        return {
          ...p,
          accruedMinutes: split?.accruedMinutes ?? p.accruedMinutes,
          nightsLogged: split?.nightsLogged ?? p.nightsLogged,
        };
      }),
    );

    if (!challenge?.isGroup && currentUserId) {
      return rows.sort((a, b) => {
        if (a.userId === currentUserId) return -1;
        if (b.userId === currentUserId) return 1;
        return b.accruedMinutes - a.accruedMinutes;
      });
    }

    return rows;
  }, [progress, splitBarByUser, challenge?.isGroup, currentUserId]);

  const graceEndsAtMs = useMemo(
    () => (challenge?.status === 'pending_completion' && challenge
      ? challengeGraceEndsAtMs(challenge)
      : null),
    [challenge],
  );
  const graceCountdown = useGraceCountdown(graceEndsAtMs);

  if (loading) {
    return (
      <div className="app-page">
        <p className="app-muted">Loading challenge…</p>
      </div>
    );
  }

  if (errorMessage || !challenge) {
    return (
      <div className="app-page">
        <p className="admin-error">{errorMessage ?? 'Challenge not found.'}</p>
        <Link to="/challenges" className="app-back-link">← Back to challenges</Link>
      </div>
    );
  }

  const title = challenge.title?.trim() || formatChallengeRaceType(challenge);
  const accepted = challenge.participants.filter((p) => p.inviteStatus === 'accepted');
  const pending = challenge.participants.filter((p) => p.inviteStatus === 'pending');
  const isFinalizing = challenge.status === 'pending_completion';
  const winner = challenge.winnerId
    ? accepted.find((p) => p.userId === challenge.winnerId)
    : null;

  return (
    <div className="app-page">
      <Link to="/challenges" className="app-back-link">← Challenges</Link>

      <header className="challenge-detail-header">
        <div className="challenge-card-top">
          <h1>{title}</h1>
          <span className={`challenge-status challenge-status--${challenge.status}`}>
            {formatChallengeStatus(challenge.status)}
          </span>
        </div>
        <p className="challenge-meta">
          {formatChallengeRaceType(challenge)}
          {challenge.startedAt && (
            <> · started {formatChallengeStartDate(challenge.startedAt)}</>
          )}
          {challenge.expiresAt && !challenge.noExpiration && (
            <> · ends {new Date(challenge.expiresAt).toLocaleDateString()}</>
          )}
        </p>
        {winner && (
          <p className="challenge-winner">
            Winner:{' '}
            <UserLink
              userId={winner.userId}
              username={winner.username}
              avatarUrl={winner.avatarUrl}
              userRoles={winner.userRoles}
            />
          </p>
        )}
        {isFinalizing && (
          <p className="challenge-grace-banner">
            <ChallengeGraceCountdown
              challenge={challenge}
              prefix="Finalizing — "
              suffix=" to sync"
            />
          </p>
        )}
      </header>

      <section className="app-section">
        <h2>Participants</h2>
        <div className="challenge-participants">
          {accepted.map((p) => (
            <UserLink
              key={p.userId}
              userId={p.userId}
              username={p.username}
              avatarUrl={p.avatarUrl}
              userRoles={p.userRoles}
              showAvatar
              avatarSize="sm"
              className={`challenge-participant${p.role === 'creator' ? ' challenge-participant--creator' : ''}`}
            />
          ))}
          {pending.map((p) => (
            <UserLink
              key={p.userId}
              userId={p.userId}
              username={p.username}
              avatarUrl={p.avatarUrl}
              userRoles={p.userRoles}
              showAvatar
              avatarSize="sm"
              className="challenge-participant challenge-participant--pending"
            />
          ))}
        </div>
      </section>

      {rankedProgress.length > 0 && (
        <section className="app-section">
          <h2>Progress</h2>
          <div className="challenge-progress-list">
            {rankedProgress.map((row) => {
              const split = splitBarByUser.find((s) => s.userId === row.userId);
              const isMe = row.userId === currentUserId;
              return (
                <ChallengeProgressRow
                  key={row.userId}
                  userId={row.userId}
                  username={row.username}
                  avatarUrl={row.avatarUrl}
                  userRoles={userRolesById.get(row.userId)}
                  displayMinutes={split?.accruedMinutes ?? row.accruedMinutes}
                  displayNights={split?.nightsLogged ?? row.nightsLogged}
                  goalMinutes={row.goalMinutes}
                  totalPct={split?.totalPct ?? (
                    row.goalMinutes > 0
                      ? Math.round((Math.min(row.accruedMinutes, row.goalMinutes) / row.goalMinutes) * 100)
                      : 0
                  )}
                  segments={split?.segments ?? []}
                  isMe={isMe}
                  place={challenge.isGroup ? row.place : null}
                  placeTied={challenge.isGroup ? row.tied : false}
                  showPlace={challenge.isGroup}
                  syncCountdownLabel={isFinalizing ? graceCountdown.syncLabel : null}
                />
              );
            })}
          </div>
        </section>
      )}

      {contributions.length > 0 && (
        <section className="app-section">
          <ChallengeContributionsByDay
            contributions={contributions}
            currentUserId={currentUserId}
            userRolesById={userRolesById}
          />
        </section>
      )}

      {rankedProgress.length === 0 && contributions.length === 0 && challenge.status === 'pending' && (
        <p className="app-muted">Waiting for participants to accept.</p>
      )}
    </div>
  );
}
