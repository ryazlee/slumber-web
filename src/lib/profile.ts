import { queryKeys } from '../hooks/queryKeys';
import { supabase } from './supabase';
import { avatarRoleKeysFromProfile } from './avatarRoles';
import { fetchCurrentStreakMap } from './currentStreaks';
import { isRecentlyCreatedAccount } from './freshAccount';
import { prefetchCachedImageUrls } from './imageCache';
import { queryClient } from './queryClient';
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

  const isOwn = viewerId === userId;
  const [lifetimeSleep, currentStreakMap, ownStreakRes, friendsCountRes, recordRes, friendStatus] = await Promise.all([
    fetchProfileLifetimeSleep(userId),
    fetchCurrentStreakMap([userId]),
    isOwn
      ? supabase.from('streaks').select('longest_streak').eq('user_id', userId).maybeSingle()
      : Promise.resolve({ data: null as { longest_streak: number } | null }),
    supabase.rpc('get_user_friends_count', { target_user: userId }),
    supabase.rpc('get_challenge_record', { p_user_id: userId }),
    resolveFriendStatus(viewerId, userId),
  ]);

  const recordRow = Array.isArray(recordRes.data) ? recordRes.data[0] : recordRes.data;

  return {
    id: row.id,
    username: row.username,
    avatarUrl: row.avatar_url ?? undefined,
    joinedAt: typeof row.created_at === 'string' ? row.created_at : undefined,
    userRoles: avatarRoleKeysFromProfile(row.user_roles, row.is_premium),
    isPremium: row.is_premium ?? false,
    friendsCount: typeof friendsCountRes.data === 'number' ? friendsCountRes.data : 0,
    postsCount: lifetimeSleep.postsCount,
    streak: currentStreakMap.get(userId) ?? 0,
    longestStreak: ownStreakRes.data?.longest_streak ?? 0,
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

type FreshProfileSeed = {
  userId: string;
  username: string;
  avatarUrl?: string | null;
  createdAt?: string | null;
  hasProfile?: boolean;
};

function emptySeedProfile(person: FreshProfileSeed, joinedAt: string | undefined): WebProfile {
  return {
    id: person.userId,
    username: person.username.trim(),
    avatarUrl: person.avatarUrl?.trim() || undefined,
    joinedAt,
    friendsCount: 0,
    postsCount: 0,
    streak: 0,
    longestStreak: 0,
    avgAsleepMinutes: 0,
    sleepGoalMinutes: 480,
    challengeRecord: { wins: 0, losses: 0, ties: 0 },
    isOwnProfile: false,
    friendStatus: 'none',
  };
}

/**
 * Paint a referral row immediately. A just-created account still refetches
 * (`useProfile` staleTime 0). Older profiles are not written into the query cache.
 */
export function seedFreshReferralProfile(person: FreshProfileSeed): void {
  if (!person.userId || person.hasProfile === false) return;
  const joinedAt = person.createdAt?.trim() || undefined;
  const avatarUrl = person.avatarUrl?.trim() || undefined;
  if (avatarUrl) prefetchCachedImageUrls([avatarUrl]);
  if (!isRecentlyCreatedAccount(joinedAt)) return;

  queryClient.setQueryData<WebProfile>(queryKeys.profile(person.userId), (current) => {
    if (!current || current.id !== person.userId) return emptySeedProfile(person, joinedAt);
    const nextAvatar = current.avatarUrl?.trim() ? current.avatarUrl : avatarUrl;
    const username = current.username.trim() ? current.username : person.username.trim();
    const nextJoinedAt = current.joinedAt ?? joinedAt;
    if (
      nextAvatar === current.avatarUrl
      && username === current.username
      && nextJoinedAt === current.joinedAt
    ) {
      return current;
    }
    return {
      ...current,
      username,
      avatarUrl: nextAvatar,
      joinedAt: nextJoinedAt,
    };
  });
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
