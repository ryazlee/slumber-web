import { useMemo } from 'react';
import ChallengeDetailSkeleton from '../../components/ChallengeDetailSkeleton';
import { Link, useParams } from 'react-router-dom';
import ChallengeContributionsByDay from '../../components/ChallengeContributionsByDay';
import ChallengeGraceCountdown from '../../components/ChallengeGraceCountdown';
import ChallengeProgressRow from '../../components/ChallengeProgressRow';
import EntityMessageBoard from '../../components/EntityMessageBoard';
import UserLink from '../../components/UserLink';
import { useAuth } from '../../context/AuthContext';
import {
  useChallenge,
  useChallengeContributions,
  useChallengeProgress,
} from '../../hooks/useChallenges';
import { useFriends } from '../../hooks/useSocial';
import { buildSplitBarsByUser } from '../../lib/challengeProgressBar';
import { challengeGraceEndsAtMs, formatChallengeLockAt } from '../../lib/challengeGrace';
import { rankBySleepProgress } from '../../lib/challengeRank';
import {
  formatChallengeRaceType,
  formatChallengeStartDate,
  formatChallengeStatus,
  pluralCount,
  PENDING_COMPLETION_BANNER_PREFIX,
  PENDING_COMPLETION_BANNER_PREFIX_GOAL_HIT,
  PENDING_COMPLETION_BANNER_SUFFIX,
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
  const friendsQuery = useFriends();
  const friendIdSet = useMemo(
    () => new Set((friendsQuery.data ?? []).map((friend) => friend.id)),
    [friendsQuery.data],
  );

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

  const standings = useMemo(() => {
    if (progress.length > 0 || !showProgress || !challenge) return progress;
    return challenge.participants
      .filter((p) => p.inviteStatus === 'accepted')
      .map((p) => ({
        userId: p.userId,
        username: p.username,
        avatarUrl: p.avatarUrl,
        accruedMinutes: 0,
        goalMinutes: challenge.goalMinutes,
        nightsLogged: 0,
        expiresAt: challenge.expiresAt,
      }));
  }, [progress, showProgress, challenge]);

  const splitBarByUser = useMemo(
    () => buildSplitBarsByUser(contributions, standings),
    [contributions, standings],
  );

  const userRolesById = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const p of challenge?.participants ?? []) {
      if (p.userRoles?.length) map.set(p.userId, p.userRoles);
    }
    return map;
  }, [challenge?.participants]);

  const rankedProgress = useMemo(() => {
    const rows = rankBySleepProgress(standings);

    if (!challenge?.isGroup && currentUserId) {
      return rows.sort((a, b) => {
        if (a.userId === currentUserId) return -1;
        if (b.userId === currentUserId) return 1;
        return b.accruedMinutes - a.accruedMinutes;
      });
    }

    return rows;
  }, [standings, challenge?.isGroup, currentUserId]);

  const boardMentionUsers = useMemo(
    () => (challenge?.participants ?? [])
      .filter((p) => p.inviteStatus === 'accepted')
      .map((p) => ({ id: p.userId, username: p.username })),
    [challenge?.participants],
  );

  if (loading) {
    return (
      <div className="app-page">
        <ChallengeDetailSkeleton />
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
  const friendsReady = friendsQuery.isSuccess;
  const visibleContributions = friendsReady
    ? contributions.filter((post) => post.userId === currentUserId || friendIdSet.has(post.userId))
    : contributions;
  const hiddenContributorCount = friendsReady
    ? accepted.filter((p) => p.userId !== currentUserId && !friendIdSet.has(p.userId)).length
    : 0;
  const hiddenContributorsNote = hiddenContributorCount === 1
    ? "1 racer isn't a friend — posts hidden, totals still count."
    : `${pluralCount(hiddenContributorCount, 'racer')} aren't friends — posts hidden, totals still count.`;
  const isFinalizing = challenge.status === 'pending_completion';
  const lockAtMs = isFinalizing ? challengeGraceEndsAtMs(challenge) : null;
  const winner = challenge.winnerId
    ? accepted.find((p) => p.userId === challenge.winnerId)
    : null;
  const canUseChallengeBoard = !!currentUserId
    && accepted.some((p) => p.userId === currentUserId);

  const showBoard = canUseChallengeBoard && !!currentUserId;

  return (
    <div className="app-page app-page--challenge-detail">
      <Link to="/challenges" className="app-back-link">← Challenges</Link>

      <header className="challenge-detail-header">
        <div className="challenge-detail-title-row">
          <h1>{title}</h1>
          <span className={`challenge-status challenge-status--${challenge.status}`}>
            {formatChallengeStatus(challenge.status)}
          </span>
        </div>
        {challenge.description?.trim() ? (
          <p className="challenge-detail-description">{challenge.description.trim()}</p>
        ) : null}
        {challenge.isDrawing && (challenge.prizeSponsorName || challenge.prizeName) ? (
          <p className="challenge-detail-description">
            {challenge.prizeSponsorName ? `Prize by ${challenge.prizeSponsorName}` : 'Prize'}
            {challenge.prizeName ? ` · ${challenge.prizeName}` : ''}
            {challenge.prizeUrl ? (
              <>
                {' · '}
                <a href={challenge.prizeUrl} target="_blank" rel="noreferrer">View prize</a>
              </>
            ) : null}
          </p>
        ) : null}
        <p className="challenge-meta">
          {challenge.hostedBy === 'slumber' ? 'Hosted by Slumber · ' : ''}
          {challenge.isDrawing ? `${challenge.goalMinutes / 60}h to enter` : formatChallengeRaceType(challenge)}
          {challenge.startedAt && (
            <> · {formatChallengeStartDate(challenge.startedAt)}</>
          )}
          {lockAtMs != null ? (
            <> · locks {formatChallengeLockAt(lockAtMs)}</>
          ) : challenge.expiresAt && !challenge.noExpiration ? (
            <> · ends {new Date(challenge.expiresAt).toLocaleDateString()}</>
          ) : null}
        </p>
        {winner && !challenge.isDrawing && (
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
              prefix={
                challenge.goalReachedBy && challenge.goalReachedBy !== currentUserId
                  ? PENDING_COMPLETION_BANNER_PREFIX_GOAL_HIT
                  : PENDING_COMPLETION_BANNER_PREFIX
              }
              suffix={PENDING_COMPLETION_BANNER_SUFFIX}
            />
          </p>
        )}
      </header>

      <div className={showBoard ? 'challenge-detail-grid' : 'challenge-detail-main'}>
        <div className="challenge-detail-main">
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
                    />
                  );
                })}
              </div>
            </section>
          )}

          {pending.length > 0 && (
            <section className="app-section">
              <h2>Waiting to join</h2>
              <div className="challenge-participants">
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
          )}

          {rankedProgress.length === 0 && pending.length === 0 && challenge.status === 'pending' && (
            <p className="app-muted">Waiting for people to accept.</p>
          )}

          {accepted.length > 0 && rankedProgress.length === 0 && (
            <section className="app-section">
              <h2>In the race</h2>
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
                    className="challenge-participant"
                  />
                ))}
              </div>
            </section>
          )}

          {(visibleContributions.length > 0 || hiddenContributorCount > 0) && (
            <section className="app-section">
              {hiddenContributorCount > 0 ? (
                <p className="app-muted challenge-hidden-racers">{hiddenContributorsNote}</p>
              ) : null}
              {visibleContributions.length > 0 ? (
                <ChallengeContributionsByDay
                  contributions={visibleContributions}
                  currentUserId={currentUserId}
                  userRolesById={userRolesById}
                />
              ) : null}
            </section>
          )}
        </div>

        {showBoard && currentUserId ? (
          <aside className="challenge-detail-side">
            <EntityMessageBoard
              entityType="challenge"
              entityId={challenge.id}
              currentUserId={currentUserId}
              mentionUsers={boardMentionUsers}
              canCompose={canUseChallengeBoard}
            />
          </aside>
        ) : null}
      </div>
    </div>
  );
}
