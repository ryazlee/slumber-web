import { supabase } from './supabase';
import { filterWearableSleepRows } from './sleepPostCustom';
import { normalizeUsername } from './username';
import type { WebProfile } from './types';

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

  const [asleepRes, streakRes, friendsCountRes, postsCountRes, recordRes, friendStatus] = await Promise.all([
    supabase
      .from('sleep_posts')
      .select('asleep_minutes, source_device, is_custom')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(100),
    supabase.from('streaks').select('*').eq('user_id', userId).maybeSingle(),
    supabase.rpc('get_user_friends_count', { target_user: userId }),
    supabase
      .from('sleep_posts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .is('deleted_at', null),
    supabase.rpc('get_challenge_record', { p_user_id: userId }),
    resolveFriendStatus(viewerId, userId),
  ]);

  const asleepSamples = filterWearableSleepRows(asleepRes.data ?? [])
    .map((p) => p.asleep_minutes as number);
  const avgAsleepMinutes = asleepSamples.length > 0
    ? Math.round(asleepSamples.reduce((s, m) => s + m, 0) / asleepSamples.length)
    : 0;

  const recordRow = Array.isArray(recordRes.data) ? recordRes.data[0] : recordRes.data;

  return {
    id: row.id,
    username: row.username,
    avatarUrl: row.avatar_url ?? undefined,
    userRoles: row.user_roles ?? undefined,
    friendsCount: typeof friendsCountRes.data === 'number' ? friendsCountRes.data : 0,
    postsCount: postsCountRes.count ?? 0,
    streak: streakRes.data?.current_streak ?? 0,
    longestStreak: streakRes.data?.longest_streak ?? 0,
    avgAsleepMinutes,
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
