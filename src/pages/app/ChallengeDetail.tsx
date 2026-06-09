import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import UserLink from '../../components/UserLink';
import {
  fetchChallenge,
  fetchChallengeContributions,
  fetchChallengeProgress,
} from '../../lib/challenges';
import {
  formatChallengeRaceType,
  formatChallengeStartDate,
  formatChallengeStatus,
  formatMins,
  formatSleepDate,
  goalHours,
} from '../../lib/format';
import type { Challenge, ChallengeContributionPost, ChallengeProgress } from '../../lib/types';

export default function ChallengeDetail() {
  const { id } = useParams<{ id: string }>();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [progress, setProgress] = useState<ChallengeProgress[]>([]);
  const [contributions, setContributions] = useState<ChallengeContributionPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const c = await fetchChallenge(id);
      setChallenge(c);
      const [progressRows, contributionRows] = await Promise.all([
        ['active', 'pending_completion', 'completed'].includes(c.status)
          ? fetchChallengeProgress(id)
          : Promise.resolve([]),
        ['active', 'pending_completion', 'completed'].includes(c.status)
          ? fetchChallengeContributions(id)
          : Promise.resolve([]),
      ]);
      setProgress(progressRows);
      setContributions(contributionRows);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not load challenge.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="app-page">
        <p className="app-muted">Loading challenge…</p>
      </div>
    );
  }

  if (error || !challenge) {
    return (
      <div className="app-page">
        <p className="admin-error">{error ?? 'Challenge not found.'}</p>
        <Link to="/challenges" className="app-back-link">← Back to challenges</Link>
      </div>
    );
  }

  const title = challenge.title?.trim() || formatChallengeRaceType(challenge);
  const accepted = challenge.participants.filter((p) => p.inviteStatus === 'accepted');
  const pending = challenge.participants.filter((p) => p.inviteStatus === 'pending');
  const winner = challenge.winnerId
    ? accepted.find((p) => p.userId === challenge.winnerId)
    : null;

  const sortedProgress = [...progress].sort((a, b) => b.accruedMinutes - a.accruedMinutes);

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
            <UserLink userId={winner.userId} username={winner.username} avatarUrl={winner.avatarUrl} />
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
              className={`challenge-participant${p.role === 'creator' ? ' challenge-participant--creator' : ''}`}
            />
          ))}
          {pending.map((p) => (
            <UserLink
              key={p.userId}
              userId={p.userId}
              username={p.username}
              avatarUrl={p.avatarUrl}
              className="challenge-participant challenge-participant--pending"
            />
          ))}
        </div>
      </section>

      {sortedProgress.length > 0 && (
        <section className="app-section">
          <h2>Progress</h2>
          <div className="challenge-progress-list">
            {sortedProgress.map((row, index) => {
              const pct = row.goalMinutes > 0
                ? Math.min(100, Math.round((row.accruedMinutes / row.goalMinutes) * 100))
                : 0;
              return (
                <div key={row.userId} className="challenge-progress-row">
                  <div className="challenge-progress-top">
                    <span className="challenge-progress-rank">#{index + 1}</span>
                    <UserLink
                      userId={row.userId}
                      username={row.username}
                      avatarUrl={row.avatarUrl}
                      className="challenge-progress-name"
                    />
                    <span className="challenge-progress-stats">
                      {formatMins(row.accruedMinutes)} · {row.nightsLogged} night{row.nightsLogged === 1 ? '' : 's'}
                    </span>
                  </div>
                  <div className="challenge-progress-bar">
                    <div className="challenge-progress-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="challenge-progress-pct">{pct}% of {goalHours(row.goalMinutes)}</span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {contributions.length > 0 && (
        <section className="app-section">
          <h2>Logged nights</h2>
          <ul className="challenge-contributions">
            {contributions.map((row) => (
              <li key={row.postId} className="challenge-contribution">
                <div className="challenge-contribution-main">
                  <UserLink
                    userId={row.userId}
                    username={row.username}
                    avatarUrl={row.avatarUrl}
                    className="challenge-contribution-user"
                  />
                  <span className="challenge-contribution-date">{formatSleepDate(row.sleepDate)}</span>
                </div>
                <div className="challenge-contribution-sub">
                  <span>{row.title}</span>
                  <span>{formatMins(row.asleepMinutes)}</span>
                  {row.isPrivate && <span className="post-badge">Private</span>}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {sortedProgress.length === 0 && contributions.length === 0 && challenge.status === 'pending' && (
        <p className="app-muted">Waiting for participants to accept.</p>
      )}
    </div>
  );
}
