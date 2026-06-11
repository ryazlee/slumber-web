import { supabase } from './supabase';
import { filterWearableSleepRows } from './sleepPostCustom';
import type { WebProfile } from './types';

export async function fetchProfileSummary(userId: string): Promise<WebProfile | null> {
  const { data: row, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !row) return null;

  const [asleepRes, streakRes, prRes, friendsCountRes, postsCountRes, recordRes] = await Promise.all([
    supabase
      .from('sleep_posts')
      .select('asleep_minutes, source_device, is_custom')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(100),
    supabase.from('streaks').select('*').eq('user_id', userId).maybeSingle(),
    supabase
      .from('personal_records')
      .select('value')
      .eq('user_id', userId)
      .eq('record_type', 'longest_sleep')
      .maybeSingle(),
    supabase.rpc('get_user_friends_count', { target_user: userId }),
    supabase
      .from('sleep_posts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .is('deleted_at', null),
    supabase.rpc('get_challenge_record', { p_user_id: userId }),
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
    bestNightMinutes: prRes.data?.value ?? 0,
    sleepGoalMinutes: row.sleep_goal_minutes ?? 480,
    challengeRecord: {
      wins: Number(recordRow?.wins ?? 0),
      losses: Number(recordRow?.losses ?? 0),
      ties: Number(recordRow?.ties ?? 0),
    },
  };
}

export async function fetchMyProfile(): Promise<WebProfile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  return fetchProfileSummary(user.id);
}
