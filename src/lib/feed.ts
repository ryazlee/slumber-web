import { supabase } from './supabase';
import type { SleepPost, StageSegment } from './types';
import { avatarColorFromName } from './format';

const PROFILE_EMBED = 'profiles(username, avatar_url)';
export const PAGE_SIZE = 20;

type PostRow = {
  id: string;
  user_id: string;
  title: string;
  sleep_date: string;
  bedtime: string | null;
  wake_time: string | null;
  asleep_minutes: number;
  in_bed_minutes: number;
  efficiency: number | null;
  core_minutes: number | null;
  deep_minutes: number | null;
  rem_minutes: number | null;
  awake_minutes: number | null;
  raw_samples: StageSegment[] | null;
  tags: string[] | null;
  dream_log: string | null;
  blur_dream: boolean | null;
  morning_notes: string | null;
  is_private: boolean | null;
  created_at: string;
  source_device: string | null;
  is_custom?: boolean | null;
  profiles?: { username: string; avatar_url: string | null } | null;
};

async function getBlockedUserIds(): Promise<Set<string>> {
  const { data, error } = await supabase.rpc('get_blocked_user_ids');
  if (error) return new Set();
  return new Set((data as string[] | null) ?? []);
}

function mapPostRow(
  row: PostRow,
  kudosCountMap: Record<string, number>,
  commentCountMap: Record<string, number>,
  prPostIds: Set<string>,
): SleepPost {
  const username = row.profiles?.username ?? 'unknown';
  return {
    id: row.id,
    userId: row.user_id,
    username,
    avatarUrl: row.profiles?.avatar_url ?? undefined,
    title: row.title,
    sleepDate: row.sleep_date,
    bedtime: row.bedtime ?? '—',
    wakeTime: row.wake_time ?? '—',
    asleepMinutes: row.asleep_minutes,
    inBedMinutes: row.in_bed_minutes,
    efficiency: row.efficiency ?? 0,
    coreMinutes: row.core_minutes ?? 0,
    deepMinutes: row.deep_minutes ?? 0,
    remMinutes: row.rem_minutes ?? 0,
    awakeMinutes: row.awake_minutes ?? 0,
    stageSegments: Array.isArray(row.raw_samples) ? row.raw_samples : [],
    tags: row.tags ?? [],
    dreamLog: row.dream_log ?? undefined,
    blurDream: row.blur_dream ?? true,
    notes: row.morning_notes ?? undefined,
    isPrivate: row.is_private ?? false,
    kudosCount: kudosCountMap[row.id] ?? 0,
    commentCount: commentCountMap[row.id] ?? 0,
    isPR: prPostIds.has(row.id),
    createdAt: row.created_at,
    sourceDevice: row.source_device ?? 'Unknown',
    isCustom: row.is_custom === true,
  };
}

async function enrichRows(rows: PostRow[]): Promise<SleepPost[]> {
  if (rows.length === 0) return [];
  const postIds = rows.map((r) => r.id);
  const [kudosRes, commentsRes, prRes] = await Promise.all([
    supabase.from('kudos').select('post_id').in('post_id', postIds),
    supabase.from('comments').select('post_id').in('post_id', postIds),
    supabase.from('personal_records').select('post_id').in('post_id', postIds).not('post_id', 'is', null),
  ]);

  const kudosCountMap: Record<string, number> = {};
  for (const k of kudosRes.data ?? []) {
    kudosCountMap[k.post_id] = (kudosCountMap[k.post_id] ?? 0) + 1;
  }
  const commentCountMap: Record<string, number> = {};
  for (const c of commentsRes.data ?? []) {
    commentCountMap[c.post_id] = (commentCountMap[c.post_id] ?? 0) + 1;
  }
  const prPostIds = new Set((prRes.data ?? []).map((r) => r.post_id as string));

  return rows.map((row) => mapPostRow(row, kudosCountMap, commentCountMap, prPostIds));
}

export async function fetchFeed(cursor?: string): Promise<SleepPost[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const blocked = await getBlockedUserIds();
  const { data: friends } = await supabase
    .from('friends')
    .select('user_a, user_b')
    .in('status', ['accepted', 'friends'])
    .or(`user_a.eq.${user.id},user_b.eq.${user.id}`);

  const friendIds = (friends ?? []).map((f) => (f.user_a === user.id ? f.user_b : f.user_a));
  const feedIds = [user.id, ...friendIds].filter((id) => !blocked.has(id));

  let query = supabase
    .from('sleep_posts')
    .select(`*, ${PROFILE_EMBED}`)
    .is('deleted_at', null)
    .in('user_id', feedIds)
    .order('sleep_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(PAGE_SIZE);

  if (cursor) query = query.lt('created_at', cursor);

  const { data, error } = await query;
  if (error) throw error;
  return enrichRows((data ?? []) as PostRow[]);
}

export async function fetchPost(postId: string): Promise<SleepPost | null> {
  const { data, error } = await supabase
    .from('sleep_posts')
    .select(`*, ${PROFILE_EMBED}`)
    .eq('id', postId)
    .is('deleted_at', null)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const [post] = await enrichRows([data as PostRow]);
  return post ?? null;
}

export async function fetchUserPosts(userId: string, cursor?: string): Promise<SleepPost[]> {
  let query = supabase
    .from('sleep_posts')
    .select(`*, ${PROFILE_EMBED}`)
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('sleep_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(PAGE_SIZE);

  if (cursor) query = query.lt('created_at', cursor);

  const { data, error } = await query;
  if (error) throw error;
  return enrichRows((data ?? []) as PostRow[]);
}

export { avatarColorFromName };
