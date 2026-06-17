import { supabase } from './supabase';
import { filterWearableSleepRows } from './sleepPostCustom';
import { sortPastChallenges } from './challengeGrace';
import type {
  Challenge,
  ChallengeContributionPost,
  ChallengeParticipant,
  ChallengeProgress,
  ChallengeStatus,
} from './types';

const BASE_CHALLENGE_SELECT = `
  id, creator_id, title, is_group, goal_minutes, no_expiration, scoring_mode, status,
  created_at, started_at, expires_at, winner_id, goal_reached_at, goal_reached_by, grace_ends_at
`;

function withOneDayStartGrace(isoTimestamp: string): string {
  const d = new Date(isoTimestamp);
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

function challengeContributionEndDate(challenge: Challenge): string {
  const terminal = challenge.status === 'pending_completion' || challenge.status === 'completed';
  if (terminal) {
    if (challenge.goalReachedAt) return challenge.goalReachedAt.slice(0, 10);
    if (challenge.expiresAt) return challenge.expiresAt.slice(0, 10);
    return (challenge.startedAt ?? challenge.createdAt).slice(0, 10);
  }
  if (challenge.expiresAt) return challenge.expiresAt.slice(0, 10);
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-');
}

const PARTICIPANT_SELECT = `
  challenge_id, user_id, role, invite_status, joined_at,
  profiles ( username, avatar_url, user_roles )
`;

function mapParticipantRow(row: {
  challenge_id: string;
  user_id: string;
  role: 'creator' | 'participant';
  invite_status: ChallengeParticipant['inviteStatus'];
  profiles?: { username: string; avatar_url: string | null; user_roles?: string[] | null } | null;
}): ChallengeParticipant {
  return {
    userId: row.user_id,
    username: row.profiles?.username ?? 'unknown',
    avatarUrl: row.profiles?.avatar_url ?? undefined,
    userRoles: row.profiles?.user_roles ?? undefined,
    inviteStatus: row.invite_status,
    role: row.role,
  };
}

function attachParticipants(challenges: Record<string, unknown>[], participantRows: Record<string, unknown>[]): Challenge[] {
  const map = new Map<string, Record<string, unknown>[]>();
  for (const row of participantRows) {
    const challengeId = row.challenge_id as string;
    const existing = map.get(challengeId) ?? [];
    existing.push(row);
    map.set(challengeId, existing);
  }

  return challenges.map((c) => {
    const participants = (map.get(c.id as string) ?? []).map((row) =>
      mapParticipantRow(row as Parameters<typeof mapParticipantRow>[0]),
    );
    return {
      id: c.id as string,
      title: (c.title as string | null) ?? null,
      isGroup: (c.is_group as boolean) ?? false,
      goalMinutes: c.goal_minutes as number,
      noExpiration: (c.no_expiration as boolean) ?? false,
      status: c.status as ChallengeStatus,
      createdAt: c.created_at as string,
      startedAt: (c.started_at as string | null) ?? null,
      expiresAt: (c.expires_at as string | null) ?? null,
      goalReachedAt: (c.goal_reached_at as string | null) ?? null,
      graceEndsAt: (c.grace_ends_at as string | null) ?? null,
      winnerId: (c.winner_id as string | null) ?? null,
      participants,
    };
  });
}

export async function fetchChallenge(challengeId: string): Promise<Challenge> {
  const { data, error } = await supabase
    .from('sleep_challenges')
    .select(BASE_CHALLENGE_SELECT)
    .eq('id', challengeId)
    .single();

  if (error) throw error;

  const { data: participants, error: participantsError } = await supabase
    .from('challenge_participants')
    .select(PARTICIPANT_SELECT)
    .eq('challenge_id', challengeId);

  if (participantsError) throw participantsError;

  return attachParticipants([data], participants ?? [])[0];
}

export async function fetchChallengeProgress(challengeId: string): Promise<ChallengeProgress[]> {
  const { data, error } = await supabase.rpc('get_challenge_progress', {
    p_challenge_id: challengeId,
  });
  if (error) throw error;

  return (data ?? []).map((row: Record<string, unknown>): ChallengeProgress => ({
    userId: row.user_id as string,
    username: row.username as string,
    avatarUrl: (row.avatar_url as string | null) ?? undefined,
    accruedMinutes: Number(row.accrued_minutes),
    goalMinutes: row.goal_minutes as number,
    nightsLogged: Number(row.nights_logged),
    expiresAt: (row.expires_at as string | null) ?? null,
  }));
}

export async function fetchChallengeContributions(challengeId: string): Promise<ChallengeContributionPost[]> {
  const challenge = await fetchChallenge(challengeId);
  if (challenge.status === 'cancelled') return [];

  const participantIds = challenge.participants.map((p) => p.userId);
  if (!participantIds.length) return [];

  const participantMap = new Map(challenge.participants.map((p) => [p.userId, p]));
  const startDate = withOneDayStartGrace(challenge.startedAt ?? challenge.createdAt);
  const endDate = challengeContributionEndDate(challenge);

  const { data, error } = await supabase
    .from('sleep_posts')
    .select('id, user_id, sleep_date, asleep_minutes, title, bedtime, wake_time, created_at, is_private, source_device, is_custom')
    .in('user_id', participantIds)
    .is('deleted_at', null)
    .gte('sleep_date', startDate)
    .lte('sleep_date', endDate)
    .order('sleep_date', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw error;

  return filterWearableSleepRows(data ?? []).map((row): ChallengeContributionPost => {
    const participant = participantMap.get(row.user_id);
    return {
      postId: row.id,
      userId: row.user_id,
      username: participant?.username ?? 'unknown',
      avatarUrl: participant?.avatarUrl,
      sleepDate: row.sleep_date,
      asleepMinutes: Number(row.asleep_minutes ?? 0),
      title: row.title ?? 'Sleep log',
      bedtime: row.bedtime ?? null,
      wakeTime: row.wake_time ?? null,
      createdAt: row.created_at,
      isPrivate: row.is_private === true,
    };
  });
}

export async function fetchChallenges(statuses?: ChallengeStatus[]): Promise<Challenge[]> {
  let query = supabase
    .from('sleep_challenges')
    .select(BASE_CHALLENGE_SELECT)
    .order('created_at', { ascending: false });

  if (statuses?.length) {
    query = query.in('status', statuses);
  }

  const { data, error } = await query;
  if (error) throw error;

  const challengeRows = data ?? [];
  if (!challengeRows.length) return [];

  const challengeIds = challengeRows.map((c) => c.id);
  const { data: participants, error: participantsError } = await supabase
    .from('challenge_participants')
    .select(PARTICIPANT_SELECT)
    .in('challenge_id', challengeIds);

  if (participantsError) throw participantsError;

  const challenges = attachParticipants(challengeRows, participants ?? []);

  if (statuses?.length === 1 && statuses[0] === 'completed') {
    return sortPastChallenges(challenges);
  }

  return challenges;
}
