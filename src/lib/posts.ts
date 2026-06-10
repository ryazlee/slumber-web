import { extractMentionUsernames } from './mentions';
import { supabase } from './supabase';
import type { Comment, KudosUser } from './types';

const PROFILE_EMBED = 'profiles(username, avatar_url)';

type MentionField = 'comment';

async function fetchFriendsForMentions(userId: string): Promise<Map<string, string>> {
  const { data: friends } = await supabase
    .from('friends')
    .select('user_a, user_b')
    .in('status', ['accepted', 'friends'])
    .or(`user_a.eq.${userId},user_b.eq.${userId}`);

  const friendIds = (friends ?? []).map((f) => (f.user_a === userId ? f.user_b : f.user_a));
  if (!friendIds.length) return new Map();

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username')
    .in('id', friendIds);

  return new Map((profiles ?? []).map((p) => [p.username.toLowerCase(), p.id]));
}

async function syncMentions(params: {
  postId: string;
  mentionerId: string;
  field: MentionField;
  text: string;
  commentId?: string;
  friendUsernameToId: Map<string, string>;
}): Promise<void> {
  const usernames = extractMentionUsernames(params.text);
  const mentionedIds = usernames
    .map((u) => params.friendUsernameToId.get(u))
    .filter((id): id is string => !!id && id !== params.mentionerId);

  let existingQuery = supabase
    .from('mentions')
    .select('mentioned_user_id')
    .eq('post_id', params.postId)
    .eq('field', params.field);

  existingQuery = params.commentId
    ? existingQuery.eq('comment_id', params.commentId)
    : existingQuery.is('comment_id', null);

  const { data: existingRows } = await existingQuery;
  const existingIds = new Set((existingRows ?? []).map((r) => r.mentioned_user_id));
  const nextIds = new Set(mentionedIds);

  const toRemove = [...existingIds].filter((id) => !nextIds.has(id));
  const toAdd = mentionedIds.filter((id) => !existingIds.has(id));

  if (toRemove.length > 0) {
    let deleteQuery = supabase
      .from('mentions')
      .delete()
      .eq('post_id', params.postId)
      .eq('field', params.field)
      .in('mentioned_user_id', toRemove);

    deleteQuery = params.commentId
      ? deleteQuery.eq('comment_id', params.commentId)
      : deleteQuery.is('comment_id', null);

    await deleteQuery;
  }

  if (toAdd.length === 0) return;

  const rows = toAdd.map((mentionedUserId) => ({
    post_id: params.postId,
    comment_id: params.commentId ?? null,
    mentioned_user_id: mentionedUserId,
    mentioner_user_id: params.mentionerId,
    field: params.field,
  }));

  const { error } = await supabase.from('mentions').insert(rows);
  if (error) console.warn('[syncMentions]', error.message);
}

function mapCommentRow(row: {
  id: string;
  post_id: string;
  user_id: string;
  text: string;
  created_at: string;
  profiles?: { username: string; avatar_url: string | null } | null;
}): Comment {
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
}

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

  return (data ?? []).map(mapCommentRow);
}

export async function toggleKudos(
  postId: string,
  userId: string,
  currentCount: number,
  currentlyKudoed: boolean,
): Promise<{ kudosCount: number; hasKudoed: boolean }> {
  if (currentlyKudoed) {
    const { error } = await supabase
      .from('kudos')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userId);
    if (error) throw error;
    return { kudosCount: Math.max(0, currentCount - 1), hasKudoed: false };
  }

  const { error } = await supabase
    .from('kudos')
    .insert({ post_id: postId, user_id: userId });
  if (error) throw error;
  return { kudosCount: currentCount + 1, hasKudoed: true };
}

export async function addComment(postId: string, userId: string, text: string): Promise<Comment> {
  const trimmed = text.trim();
  const { data, error } = await supabase
    .from('comments')
    .insert({ post_id: postId, user_id: userId, text: trimmed })
    .select(`*, ${PROFILE_EMBED}`)
    .single();
  if (error) throw error;

  const friendMap = await fetchFriendsForMentions(userId);
  await syncMentions({
    postId,
    mentionerId: userId,
    field: 'comment',
    text: trimmed,
    commentId: data.id,
    friendUsernameToId: friendMap,
  });

  return mapCommentRow(data);
}
