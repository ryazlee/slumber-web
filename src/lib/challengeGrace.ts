import type { Challenge } from './types';

export const CHALLENGE_GRACE_MS = 24 * 60 * 60 * 1000;

type GraceChallenge = Pick<Challenge, 'graceEndsAt' | 'goalReachedAt' | 'expiresAt'>;

export function challengeGraceEndsAtMs(challenge: GraceChallenge): number | null {
  if (challenge.graceEndsAt) {
    return new Date(challenge.graceEndsAt).getTime();
  }
  if (challenge.goalReachedAt) {
    return new Date(challenge.goalReachedAt).getTime() + CHALLENGE_GRACE_MS;
  }
  if (challenge.expiresAt) {
    return new Date(challenge.expiresAt).getTime() + CHALLENGE_GRACE_MS;
  }
  return null;
}

export function challengeEndedAtMs(
  challenge: Pick<Challenge, 'graceEndsAt' | 'goalReachedAt' | 'expiresAt' | 'createdAt'>,
): number {
  return challengeGraceEndsAtMs(challenge)
    ?? new Date(challenge.createdAt).getTime();
}

export function sortPastChallenges<T extends Pick<Challenge, 'graceEndsAt' | 'goalReachedAt' | 'expiresAt' | 'createdAt'>>(
  challenges: T[],
): T[] {
  return [...challenges].sort(
    (a, b) => challengeEndedAtMs(b) - challengeEndedAtMs(a),
  );
}

export function formatGraceRemaining(remainingMs: number): string {
  if (remainingMs <= 0) return 'Closing…';

  const totalSec = Math.ceil(remainingMs / 1000);
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;

  if (hours >= 1) return `${hours}h ${minutes}m`;
  if (minutes >= 1) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

/** Short lock time for overview chips (e.g. "Mar 5, 3:45 PM"). */
export function formatChallengeLockAt(graceEndsAtMs: number): string {
  return new Date(graceEndsAtMs).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
