import { supabase } from './supabase';
import { avatarRoleKeysFromProfile } from './avatarRoles';
import { normalizeUsername } from './username';
import type { WebProfile } from './types';

function readLifetimeSleep(data: unknown): { postsCount: number; avgAsleepMinutes: number } | null {
  if (data == null || typeof data !== 'object') return null;
  const row = data as Record<string, unknown>;
  const postsCount = Number(row.totalNights);
  const avgAsleepMinutes = Number(row.avgAsleepMinutes);
  if (!Number.isFinite(postsCount)) return null;
  return {
    postsCount,
    avgAsleepMinutes: Number.isFinite(avgAsleepMinutes) ? avgAsleepMinutes : 0,
  };
}

async function fetchProfileLifetimeSleep(userId: string): Promise<{ postsCount: number; avgAsleepMinutes: number }> {
  const headline = await supabase.rpc('get_profile_lifetime_sleep', { p_user_id: userId });
  const parsed = !headline.error ? readLifetimeSleep(headline.data) : null;
  if (parsed) return parsed;

  const [countRes, aggRes] = await Promise.all([
    supabase.rpc('count_profile_post_nights', { p_user_id: userId }),
    supabase.rpc('get_lifetime_sleep_aggregates', { p_user_id: userId }),
  ]);
  const aggregates = readLifetimeSleep(aggRes.data);
  return {
    postsCount: typeof countRes.data === 'number' ? countRes.data : (aggregates?.postsCount ?? 0),
    avgAsleepMinutes: aggregates?.avgAsleepMinutes ?? 0,
  };
}

function isAcceptedFriendStatus(status: string | null | undefined): boolean {
  return status === 'accepted' || status === 'friends';
}

async function resolveFriendStatus(
  viewerId: string | undefined,
  profileId: string,
): Promise<WebProfile['friendStatus']> {
  if (!viewerId || viewerId === profileId) return 'friends';
  const { data } = await supabase
    .from('friends')
    .select('user_a, user_b, status')
    .or(`and(user_a.eq.${viewerId},user_b.eq.${profileId}),and(user_a.eq.${profileId},user_b.eq.${viewerId})`)
    .maybeSingle();
  if (!data) return 'none';
  if (isAcceptedFriendStatus(data.status)) return 'friends';
  if (data.status === 'pending') {
    return data.user_a === profileId ? 'request_received' : 'request_sent';
  }
  return 'none';
}

export async function fetchProfileSummary(userId: string): Promise<WebProfile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  const viewerId = user?.id;

  const { data: row, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !row) return null;

  const [lifetimeSleep, streakRes, friendsCountRes, recordRes, friendStatus] = await Promise.all([
    fetchProfileLifetimeSleep(userId),
    supabase.from('streaks').select('*').eq('user_id', userId).maybeSingle(),
    supabase.rpc('get_user_friends_count', { target_user: userId }),
    supabase.rpc('get_challenge_record', { p_user_id: userId }),
    resolveFriendStatus(viewerId, userId),
  ]);

  const recordRow = Array.isArray(recordRes.data) ? recordRes.data[0] : recordRes.data;

  return {
    id: row.id,
    username: row.username,
    avatarUrl: row.avatar_url ?? undefined,
    userRoles: avatarRoleKeysFromProfile(row.user_roles, row.is_premium),
    isPremium: row.is_premium ?? false,
    friendsCount: typeof friendsCountRes.data === 'number' ? friendsCountRes.data : 0,
    postsCount: lifetimeSleep.postsCount,
    streak: streakRes.data?.current_streak ?? 0,
    longestStreak: streakRes.data?.longest_streak ?? 0,
    avgAsleepMinutes: lifetimeSleep.avgAsleepMinutes,
    sleepGoalMinutes: row.sleep_goal_minutes ?? 480,
    challengeRecord: {
      wins: Number(recordRow?.wins ?? 0),
      losses: Number(recordRow?.losses ?? 0),
      ties: Number(recordRow?.ties ?? 0),
    },
    isOwnProfile: viewerId === userId,
    friendStatus,
  };
}

export async function fetchMyProfile(): Promise<WebProfile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  return fetchProfileSummary(user.id);
}

export async function getUserIdByUsername(username: string): Promise<string | null> {
  const normalized = normalizeUsername(username);
  if (!normalized) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', normalized)
    .maybeSingle();
  if (error || !data) return null;
  return data.id;
}
