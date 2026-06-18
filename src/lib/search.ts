import { enrichSleepPostRows, type PostRow } from './feed';
import { supabase } from './supabase';
import type { SleepPost, WebSearchUser } from './types';

const PROFILE_EMBED = 'profiles(username, avatar_url, user_roles)';

function isAcceptedFriendStatus(status: string | null | undefined): boolean {
  return status === 'accepted' || status === 'friends';
}

async function getBlockedUserIds(): Promise<Set<string>> {
  const { data, error } = await supabase.rpc('get_blocked_user_ids');
  if (error) return new Set();
  return new Set((data as string[] | null) ?? []);
}

export function searchFriendshipLabel(
  status: WebSearchUser['friendStatus'],
  isOwn: boolean,
): string {
  if (isOwn) return 'You';
  if (status === 'friends') return 'Friends';
  if (status === 'request_sent') return 'Request sent';
  if (status === 'request_received') return 'Request waiting';
  return 'Not friends';
}

export async function searchUsers(
  query: string,
  currentUserId: string | null,
): Promise<WebSearchUser[]> {
  const q = query.trim();
  if (!q) return [];

  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, user_roles')
    .ilike('username', `%${q}%`)
    .limit(20);

  if (error) throw error;
  if (!data?.length) return [];

  const blocked = currentUserId ? await getBlockedUserIds() : new Set<string>();
  const visibleRows = data.filter((row) => !blocked.has(row.id));
  if (!visibleRows.length) return [];

  const friendshipMap = new Map<string, string>();
  if (currentUserId) {
    const targetIds = visibleRows.map((profile) => profile.id);
    const { data: friends } = await supabase
      .from('friends')
      .select('user_a, user_b, status')
      .or(`user_a.eq.${currentUserId},user_b.eq.${currentUserId}`);

    for (const row of friends ?? []) {
      const otherId = row.user_a === currentUserId ? row.user_b : row.user_a;
      if (!targetIds.includes(otherId)) continue;
      if (row.status === 'pending' && row.user_a !== currentUserId) {
        friendshipMap.set(otherId, 'request_received_pending');
      } else {
        friendshipMap.set(otherId, row.status);
      }
    }
  }

  return visibleRows.map((row) => {
    const status = friendshipMap.get(row.id);
    let friendStatus: WebSearchUser['friendStatus'] = 'none';
    if (!status) friendStatus = 'none';
    else if (isAcceptedFriendStatus(status)) friendStatus = 'friends';
    else if (status === 'request_received_pending') friendStatus = 'request_received';
    else if (status === 'pending') friendStatus = 'request_sent';

    return {
      id: row.id,
      username: row.username,
      avatarUrl: row.avatar_url ?? undefined,
      userRoles: row.user_roles ?? undefined,
      friendStatus,
      isOwnProfile: currentUserId === row.id,
    };
  });
}

export async function searchPostsByUserOrTitle(
  query: string,
  currentUserId: string | null,
): Promise<SleepPost[]> {
  const q = query.trim();
  if (!q) return [];

  const [titleRes, usersRes] = await Promise.all([
    supabase
      .from('sleep_posts')
      .select(`*, ${PROFILE_EMBED}`)
      .is('deleted_at', null)
      .ilike('title', `%${q}%`)
      .order('sleep_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(30),
    supabase
      .from('profiles')
      .select('id')
      .ilike('username', `%${q}%`)
      .limit(30),
  ]);

  if (titleRes.error) throw titleRes.error;
  if (usersRes.error) throw usersRes.error;

  const userIds = Array.from(new Set((usersRes.data ?? []).map((user) => user.id)));

  let byUserRows: PostRow[] = [];
  if (userIds.length > 0) {
    const byUserRes = await supabase
      .from('sleep_posts')
      .select(`*, ${PROFILE_EMBED}`)
      .is('deleted_at', null)
      .in('user_id', userIds)
      .order('sleep_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(30);
    if (byUserRes.error) throw byUserRes.error;
    byUserRows = (byUserRes.data ?? []) as PostRow[];
  }

  const deduped = new Map<string, PostRow>();
  for (const row of [...((titleRes.data ?? []) as PostRow[]), ...byUserRows]) {
    deduped.set(row.id, row);
  }

  let rows = Array.from(deduped.values())
    .sort((a, b) => {
      const bySleepDate = b.sleep_date.localeCompare(a.sleep_date);
      if (bySleepDate !== 0) return bySleepDate;
      return b.created_at.localeCompare(a.created_at);
    })
    .slice(0, 40);

  if (currentUserId) {
    const blocked = await getBlockedUserIds();
    if (blocked.size > 0) {
      rows = rows.filter((row) => !blocked.has(row.user_id));
    }
  }

  return enrichSleepPostRows(rows);
}

export async function searchAll(query: string): Promise<{ users: WebSearchUser[]; posts: SleepPost[] }> {
  const { data: { user } } = await supabase.auth.getUser();
  const currentUserId = user?.id ?? null;
  const [users, posts] = await Promise.all([
    searchUsers(query, currentUserId),
    searchPostsByUserOrTitle(query, currentUserId),
  ]);
  return { users, posts };
}
