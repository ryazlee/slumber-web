import { supabase } from './supabase';
import type { Comment, KudosUser } from './types';

const PROFILE_EMBED = 'profiles(username, avatar_url)';

export async function fetchKudosUsers(postId: string): Promise<KudosUser[]> {
  const { data: kudosRows, error: kudosError } = await supabase
    .from('kudos')
    .select('user_id, created_at')
    .eq('post_id', postId)
    .order('created_at', { ascending: false });

  if (kudosError) throw kudosError;
  if (!kudosRows?.length) return [];

  const ordered = kudosRows
    .map((r) => ({ userId: r.user_id as string, createdAt: r.created_at as string }))
    .filter((r) => Boolean(r.userId));

  const uniqueIds = Array.from(new Set(ordered.map((r) => r.userId)));
  if (!uniqueIds.length) return [];

  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, username, avatar_url')
    .in('id', uniqueIds);

  if (profilesError) throw profilesError;

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));
  return ordered
    .map((k) => {
      const p = profileMap.get(k.userId);
      if (!p) return null;
      return {
        id: p.id,
        username: p.username,
        avatarUrl: p.avatar_url ?? undefined,
        createdAt: k.createdAt,
      };
    })
    .filter(Boolean) as KudosUser[];
}

export async function fetchComments(postId: string): Promise<Comment[]> {
  const { data, error } = await supabase
    .from('comments')
    .select(`*, ${PROFILE_EMBED}`)
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row) => {
    const username = row.profiles?.username ?? 'unknown';
    return {
      id: row.id,
      postId: row.post_id,
      userId: row.user_id,
      username,
      avatarUrl: row.profiles?.avatar_url ?? undefined,
      text: row.text,
      createdAt: row.created_at,
    };
  });
}
