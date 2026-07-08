import { supabase } from './supabase';
import type { SleepBuddyProfile, SleepBuddyStatus, SleepPost, SleepSessionData, StageSegment, Vibe, DreamMood } from './types';
import { avatarColorFromName } from './format';
import { countWakes } from './wakes';
import { SLEEP_POST_FEED_SELECT } from './sleepPostSelect';

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
  dream_mood: DreamMood | null;
  blur_dream: boolean | null;
  morning_notes: string | null;
  is_private: boolean | null;
  created_at: string;
  source_device: string | null;
  is_custom?: boolean | null;
};

/** Supabase infers `GenericStringError[]` for dynamic `.select()` strings — narrow at the boundary. */
function toPostRows(data: unknown): PostRow[] {
  if (!Array.isArray(data)) return [];
  return data as PostRow[];
}

async function getBlockedUserIds(): Promise<Set<string>> {
  const { data, error } = await supabase.rpc('get_blocked_user_ids');
  if (error) return new Set();
  return new Set((data as string[] | null) ?? []);
}

function monthPostCountKey(userId: string, sleepDate: string): string {
  return `${userId}:${sleepDate.slice(0, 7)}`;
}

function monthRangeBounds(sleepDates: string[]): { start: string; end: string } | null {
  if (sleepDates.length === 0) return null;
  const months = [...new Set(sleepDates.map((d) => d.slice(0, 7)))].sort();
  const minMonth = months[0];
  const maxMonth = months[months.length - 1];
  const [y, m] = maxMonth.split('-').map(Number);
  const lastDay = new Date(y, m, 0).getDate();
  return {
    start: `${minMonth}-01`,
    end: `${maxMonth}-${String(lastDay).padStart(2, '0')}`,
  };
}

async function fetchMonthPostCounts(rows: PostRow[]): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  const authorUserIds = [...new Set(rows.map((r) => r.user_id))];
  const bounds = monthRangeBounds(rows.map((r) => r.sleep_date));
  if (authorUserIds.length === 0 || !bounds) return counts;

  const { data, error } = await supabase
    .from('sleep_posts')
    .select('user_id, sleep_date')
    .in('user_id', authorUserIds)
    .gte('sleep_date', bounds.start)
    .lte('sleep_date', bounds.end)
    .is('deleted_at', null)
    .eq('is_custom', false);
  if (error) return counts;

  for (const row of data ?? []) {
    const key = monthPostCountKey(row.user_id, row.sleep_date);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

function mapPostRow(
  row: PostRow,
  authorProfile: AuthorProfile | undefined,
  kudosCountMap: Record<string, number>,
  myKudoPostIds: Set<string>,
  commentCountMap: Record<string, number>,
  prAllTimeMap: Map<string, string[]>,
  prMonthlyMap: Map<string, string[]>,
  monthPostCountMap: Map<string, number>,
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
    dreamMood: row.dream_mood ?? undefined,
    blurDream: row.blur_dream ?? true,
    notes: row.morning_notes ?? undefined,
    isPrivate: row.is_private ?? false,
    kudosCount: kudosCountMap[row.id] ?? 0,
    hasKudoed: myKudoPostIds.has(row.id),
    commentCount: commentCountMap[row.id] ?? 0,
    isPR: prAllTimeMap.has(row.id) || prMonthlyMap.has(row.id),
    prTypes,
    monthlyPrTypes,
    monthPostCount: monthPostCountMap.get(monthPostCountKey(row.user_id, row.sleep_date)),
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

  const [kudosRes, commentsRes, prRes, authorProfilesRes, monthPostCountMap] = await Promise.all([
    supabase.from('kudos').select('post_id, user_id').in('post_id', postIds),
    supabase.from('comments').select('post_id').in('post_id', postIds),
    supabase
      .from('personal_records')
      .select('post_id, record_type, scope')
      .in('post_id', postIds)
      .not('post_id', 'is', null),
    supabase.from('profiles').select('id, username, avatar_url, user_roles').in('id', authorUserIds),
    fetchMonthPostCounts(rows),
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

  type BuddyRow = { post_id: string; user_id: string; status: string };
  let buddyRows: BuddyRow[] = [];
  if (postIds.length > 0) {
    const rpcRes = await supabase.rpc('get_post_sleep_buddies_batch', { p_post_ids: postIds });
    if (!rpcRes.error && rpcRes.data) {
      buddyRows = rpcRes.data as BuddyRow[];
    } else {
      const tableRes = await supabase
        .from('post_sleep_buddies')
        .select('post_id, user_id, status')
        .in('post_id', postIds);
      if (!tableRes.error && tableRes.data) {
        buddyRows = tableRes.data as BuddyRow[];
      }
    }
  }

  const profileMap = new Map<string, AuthorProfile>(authorProfileMap);
  const buddyUserIds = [...new Set(buddyRows.map((r) => r.user_id))].filter((id) => !profileMap.has(id));
  if (buddyUserIds.length > 0) {
    const { data: buddyProfiles } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, user_roles')
      .in('id', buddyUserIds);
    for (const p of buddyProfiles ?? []) {
      profileMap.set(p.id, p);
    }
  }

  const buddiesByPost = new Map<string, BuddyRow[]>();
  for (const buddyRow of buddyRows) {
    const arr = buddiesByPost.get(buddyRow.post_id) ?? [];
    arr.push(buddyRow);
    buddiesByPost.set(buddyRow.post_id, arr);
  }

  function buddyProfile(userId: string): SleepBuddyProfile {
    const profile = profileMap.get(userId);
    return {
      userId,
      username: profile?.username ?? 'unknown',
      avatarUrl: profile?.avatar_url ?? undefined,
      userRoles: profile?.user_roles ?? undefined,
    };
  }

  return rows.map((row) => {
    const post = mapPostRow(
      row,
      authorProfileMap.get(row.user_id),
      kudosCountMap,
      myKudoPostIds,
      commentCountMap,
      prAllTimeMap,
      prMonthlyMap,
      monthPostCountMap,
    );
    const postBuddyRows = buddiesByPost.get(row.id) ?? [];
    const isAuthor = currentUserId === row.user_id;

    const accepted = postBuddyRows
      .filter((r) => r.status === 'accepted')
      .map((r) => buddyProfile(r.user_id));
    if (accepted.length > 0) post.sleepBuddies = accepted;

    if (isAuthor && postBuddyRows.length > 0) {
      post.sleepBuddyTags = postBuddyRows.map((r) => ({
        ...buddyProfile(r.user_id),
        status: r.status as SleepBuddyStatus,
      }));
    }

    return post;
  });
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
    .select(SLEEP_POST_FEED_SELECT)
    .is('deleted_at', null)
    .in('user_id', feedIds)
    .order('sleep_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(PAGE_SIZE);

  if (cursor) query = query.lt('created_at', cursor);

  const { data, error } = await query;
  if (error) throw error;
  return enrichSleepPostRows(toPostRows(data));
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

  const [post] = await enrichSleepPostRows(toPostRows([data]));
  return post ?? null;
}

export async function fetchUserPosts(userId: string, cursor?: string): Promise<SleepPost[]> {
  let query = supabase
    .from('sleep_posts')
    .select(SLEEP_POST_FEED_SELECT)
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('sleep_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(PAGE_SIZE);

  if (cursor) query = query.lt('created_at', cursor);

  const { data, error } = await query;
  if (error) throw error;
  return enrichSleepPostRows(toPostRows(data));
}

export { avatarColorFromName };
