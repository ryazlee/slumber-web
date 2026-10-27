import type { Challenge } from './types';

const EXPIRING_SOON_MS = 48 * 60 * 60 * 1000;

export function challengeHasOfficiallyStarted(challenge: Challenge, nowMs = Date.now()): boolean {
  if (challenge.status === 'pending') return false;
  if (!challenge.startedAt) {
    return challenge.status === 'active'
      || challenge.status === 'pending_completion'
      || challenge.status === 'completed';
  }
  const startMs = new Date(challenge.startedAt).getTime();
  if (Number.isNaN(startMs)) return false;
  return startMs <= nowMs;
}

export function isChallengeExpiringSoon(challenge: Challenge, nowMs = Date.now()): boolean {
  if (!challenge.expiresAt || challenge.noExpiration || challenge.status !== 'active') return false;
  const ms = new Date(challenge.expiresAt).getTime() - nowMs;
  return ms > 0 && ms <= EXPIRING_SOON_MS;
}

export function challengeEndsLabel(challenge: Challenge, nowMs = Date.now()): string | null {
  if (!isChallengeExpiringSoon(challenge, nowMs) || !challenge.expiresAt) return null;
  const ms = new Date(challenge.expiresAt).getTime() - nowMs;
  if (ms <= 0) return 'Expired';
  const days = Math.ceil(ms / (1000 * 60 * 60 * 24));
  return days <= 1 ? 'Ends today' : `${days}d left`;
}

export type ChallengeLists = {
  invites: Challenge[];
  urgent: Challenge[];
  finalizing: Challenge[];
  waiting: Challenge[];
  active: Challenge[];
};

/** Same buckets as the app Challenge tab, without favorites or club-only join cards. */
export function splitChallengeLists(challenges: Challenge[], userId: string): ChallengeLists {
  const invites: Challenge[] = [];
  const urgent: Challenge[] = [];
  const finalizing: Challenge[] = [];
  const waiting: Challenge[] = [];
  const active: Challenge[] = [];

  for (const challenge of challenges) {
    const me = challenge.participants.find((p) => p.userId === userId);
    const minePending = me?.inviteStatus === 'pending'
      && (challenge.status === 'pending' || challenge.status === 'active');
    if (minePending) {
      invites.push(challenge);
      continue;
    }
    if (me?.inviteStatus !== 'accepted') continue;

    if (challenge.status === 'pending_completion') {
      finalizing.push(challenge);
      continue;
    }
    if (challenge.status === 'pending') {
      waiting.push(challenge);
      continue;
    }
    if (challenge.status === 'active') {
      if (isChallengeExpiringSoon(challenge)) urgent.push(challenge);
      else active.push(challenge);
    }
  }

  finalizing.sort((a, b) => {
    const aMs = a.graceEndsAt ? new Date(a.graceEndsAt).getTime() : 0;
    const bMs = b.graceEndsAt ? new Date(b.graceEndsAt).getTime() : 0;
    return aMs - bMs;
  });

  const byExpiry = (a: Challenge, b: Challenge) => {
    if (a.expiresAt && b.expiresAt) return new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime();
    if (a.expiresAt) return -1;
    if (b.expiresAt) return 1;
    return 0;
  };
  urgent.sort(byExpiry);
  active.sort(byExpiry);

  return { invites, urgent, finalizing, waiting, active };
}
