import { supabase } from './supabase';
import type { SleepPost, SleepSessionData, StageSegment, Vibe } from './types';
import { avatarColorFromName } from './format';
import { countWakes } from './wakes';

export const PAGE_SIZE = 20;

type AuthorProfile = { username: string; avatar_url: string | null; user_roles?: string[] | null };

export type PostRow = {
  id: string;
  user_id: string;
  title: string;
  sleep_date: string;
  bedtime: string | null;
  wake_time: string | null;
  asleep_minutes: number;
  in_bed_minutes: number;
  core_minutes: number | null;
  deep_minutes: number | null;
  rem_minutes: number | null;
  awake_minutes: number | null;
  awake_events: number | null;
  raw_samples: StageSegment[] | null;
  session_breakdown: SleepSessionData[] | null;
  vibe: Vibe | null;
  photo_urls: string[] | null;
  photo_thumb_urls: string[] | null;
  location_label: string | null;
  tags: string[] | null;
  dream_log: string | null;
  blur_dream: boolean | null;
  morning_notes: string | null;
  is_private: boolean | null;
  created_at: string;
  source_device: string | null;
  is_custom?: boolean | null;
};

async function getBlockedUserIds(): Promise<Set<string>> {
  const { data, error } = await supabase.rpc('get_blocked_user_ids');
  if (error) return new Set();
  return new Set((data as string[] | null) ?? []);
}

function mapPostRow(
  row: PostRow,
  authorProfile: AuthorProfile | undefined,
  kudosCountMap: Record<string, number>,
  myKudoPostIds: Set<string>,
  commentCountMap: Record<string, number>,
  prAllTimeMap: Map<string, string[]>,
  prMonthlyMap: Map<string, string[]>,
): SleepPost {
  const username = authorProfile?.username ?? 'unknown';
  const prTypes = prAllTimeMap.get(row.id);
  const monthlyPrTypes = prMonthlyMap.get(row.id);
  return {
    id: row.id,
    userId: row.user_id,
    username,
    avatarUrl: authorProfile?.avatar_url ?? undefined,
    userRoles: authorProfile?.user_roles ?? undefined,
    title: row.title,
    sleepDate: row.sleep_date,
    bedtime: row.bedtime ?? '—',
    wakeTime: row.wake_time ?? '—',
    asleepMinutes: row.asleep_minutes,
    inBedMinutes: row.in_bed_minutes,
    coreMinutes: row.core_minutes ?? 0,
    deepMinutes: row.deep_minutes ?? 0,
    remMinutes: row.rem_minutes ?? 0,
    awakeMinutes: row.awake_minutes ?? 0,
    awakeEvents: row.awake_events ?? countWakes(row.raw_samples),
    stageSegments: Array.isArray(row.raw_samples) ? row.raw_samples : [],
    sessionBreakdown: Array.isArray(row.session_breakdown) ? row.session_breakdown : undefined,
    vibe: row.vibe ?? undefined,
    photoUrls: row.photo_urls ?? [],
    photoThumbUrls: row.photo_thumb_urls ?? [],
    locationLabel: row.location_label ?? undefined,
    tags: row.tags ?? [],
    dreamLog: row.dream_log ?? undefined,
    blurDream: row.blur_dream ?? true,
    notes: row.morning_notes ?? undefined,
    isPrivate: row.is_private ?? false,
    kudosCount: kudosCountMap[row.id] ?? 0,
    hasKudoed: myKudoPostIds.has(row.id),
    commentCount: commentCountMap[row.id] ?? 0,
    isPR: prAllTimeMap.has(row.id) || prMonthlyMap.has(row.id),
    prTypes,
    monthlyPrTypes,
    createdAt: row.created_at,
    sourceDevice: row.source_device ?? 'Unknown',
    isCustom: row.is_custom === true,
  };
}

export async function enrichSleepPostRows(rows: PostRow[]): Promise<SleepPost[]> {
  if (rows.length === 0) return [];
  const postIds = rows.map((r) => r.id);
  const authorUserIds = [...new Set(rows.map((r) => r.user_id))];
  const { data: { user } } = await supabase.auth.getUser();
  const currentUserId = user?.id ?? null;

  const [kudosRes, commentsRes, prRes, authorProfilesRes] = await Promise.all([
    supabase.from('kudos').select('post_id, user_id').in('post_id', postIds),
    supabase.from('comments').select('post_id').in('post_id', postIds),
    supabase
      .from('personal_records')
      .select('post_id, record_type, scope')
      .in('post_id', postIds)
      .not('post_id', 'is', null),
    supabase.from('profiles').select('id, username, avatar_url, user_roles').in('id', authorUserIds),
  ]);

  const authorProfileMap = new Map<string, AuthorProfile>();
  for (const p of authorProfilesRes.data ?? []) {
    authorProfileMap.set(p.id, p);
  }

  const kudosCountMap: Record<string, number> = {};
  const myKudoPostIds = new Set<string>();
  for (const k of kudosRes.data ?? []) {
    kudosCountMap[k.post_id] = (kudosCountMap[k.post_id] ?? 0) + 1;
    if (k.user_id === currentUserId) myKudoPostIds.add(k.post_id);
  }
  const commentCountMap: Record<string, number> = {};
  for (const c of commentsRes.data ?? []) {
    commentCountMap[c.post_id] = (commentCountMap[c.post_id] ?? 0) + 1;
  }

  const prAllTimeMap = new Map<string, string[]>();
  const prMonthlyMap = new Map<string, string[]>();
  for (const r of prRes.data ?? []) {
    const map = r.scope === 'monthly' ? prMonthlyMap : prAllTimeMap;
    const arr = map.get(r.post_id) ?? [];
    arr.push(r.record_type as string);
    map.set(r.post_id, arr);
  }

  return rows.map((row) => mapPostRow(
    row,
    authorProfileMap.get(row.user_id),
    kudosCountMap,
    myKudoPostIds,
    commentCountMap,
    prAllTimeMap,
    prMonthlyMap,
  ));
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
    .select('*')
    .is('deleted_at', null)
    .in('user_id', feedIds)
    .order('sleep_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(PAGE_SIZE);

  if (cursor) query = query.lt('created_at', cursor);

  const { data, error } = await query;
  if (error) throw error;
  return enrichSleepPostRows((data ?? []) as PostRow[]);
}

export async function fetchPost(postId: string): Promise<SleepPost | null> {
  const { data, error } = await supabase
    .from('sleep_posts')
    .select('*')
    .eq('id', postId)
    .is('deleted_at', null)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const [post] = await enrichSleepPostRows([data as PostRow]);
  return post ?? null;
}

export async function fetchUserPosts(userId: string, cursor?: string): Promise<SleepPost[]> {
  let query = supabase
    .from('sleep_posts')
    .select('*')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('sleep_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(PAGE_SIZE);

  if (cursor) query = query.lt('created_at', cursor);

  const { data, error } = await query;
  if (error) throw error;
  return enrichSleepPostRows((data ?? []) as PostRow[]);
}

export { avatarColorFromName };
