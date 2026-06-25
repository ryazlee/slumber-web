import { extractMentionUsernames } from './mentions';
import { supabase } from './supabase';
import type { Comment, KudosUser } from './types';

const COMMENT_PROFILE_EMBED_VARIANTS = [
  'profiles!comments_user_id_fkey(username, avatar_url, user_roles)',
  'profiles(username, avatar_url, user_roles)',
  'profiles!user_id(username, avatar_url, user_roles)',
] as const;

function isProfileEmbedAmbiguityError(message: string): boolean {
  return /PGRST201|more than one relationship|Could not embed.*profiles/i.test(message);
}

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

type CommentDbRow = {
  id: string;
  post_id: string;
  user_id: string;
  text: string;
  created_at: string;
  updated_at?: string | null;
  profiles?: { username: string; avatar_url: string | null; user_roles?: string[] | null } | null;
};

function isCommentEdited(row: Pick<CommentDbRow, 'created_at' | 'updated_at'>): boolean {
  if (!row.updated_at) return false;
  return new Date(row.updated_at).getTime() > new Date(row.created_at).getTime() + 1000;
}

function mapCommentRow(row: CommentDbRow, likeCount = 0, hasLiked = false): Comment {
  const username = row.profiles?.username ?? 'unknown';
  return {
    id: row.id,
    postId: row.post_id,
    userId: row.user_id,
    username,
    avatarUrl: row.profiles?.avatar_url ?? undefined,
    userRoles: row.profiles?.user_roles ?? undefined,
    text: row.text,
    createdAt: row.created_at,
    likeCount,
    hasLiked,
    isEdited: isCommentEdited(row),
  };
}

async function fetchCommentLikeMeta(
  commentIds: string[],
  currentUserId: string | null,
): Promise<{ likeCountMap: Record<string, number>; myLikedIds: Set<string> }> {
  const likeCountMap: Record<string, number> = {};
  const myLikedIds = new Set<string>();
  if (commentIds.length === 0) {
    return { likeCountMap, myLikedIds };
  }

  const { data: likes, error } = await supabase
    .from('comment_likes')
    .select('comment_id, user_id')
    .in('comment_id', commentIds);
  if (error) throw error;

  for (const like of likes ?? []) {
    likeCountMap[like.comment_id] = (likeCountMap[like.comment_id] ?? 0) + 1;
    if (currentUserId && like.user_id === currentUserId) {
      myLikedIds.add(like.comment_id);
    }
  }

  return { likeCountMap, myLikedIds };
}

async function fetchCommentRows(postId: string): Promise<CommentDbRow[]> {
  for (let i = 0; i < COMMENT_PROFILE_EMBED_VARIANTS.length; i++) {
    const embed = COMMENT_PROFILE_EMBED_VARIANTS[i];
    const { data, error } = await supabase
      .from('comments')
      .select(`*, ${embed}`)
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (!error) return data ?? [];

    const msg = error.message ?? '';
    if (i === 0 && isProfileEmbedAmbiguityError(msg)) continue;
    if (i < COMMENT_PROFILE_EMBED_VARIANTS.length - 1) continue;
  }

  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });
  if (error) throw error;

  const rows = (data ?? []) as CommentDbRow[];
  const userIds = [...new Set(rows.map((row) => row.user_id))];
  if (userIds.length === 0) return rows;

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, user_roles')
    .in('id', userIds);
  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));
  return rows.map((row) => ({
    ...row,
    profiles: profileMap.get(row.user_id) ?? null,
  }));
}

async function insertCommentWithProfile(postId: string, userId: string, text: string) {
  for (let i = 0; i < COMMENT_PROFILE_EMBED_VARIANTS.length; i++) {
    const embed = COMMENT_PROFILE_EMBED_VARIANTS[i];
    const result = await supabase
      .from('comments')
      .insert({ post_id: postId, user_id: userId, text })
      .select(`*, ${embed}`)
      .single();
    if (!result.error) return result;
    const msg = result.error.message ?? '';
    if (i === 0 && isProfileEmbedAmbiguityError(msg)) continue;
  }
  const inserted = await supabase
    .from('comments')
    .insert({ post_id: postId, user_id: userId, text })
    .select('*')
    .single();
  if (inserted.error || !inserted.data) return inserted;
  const { data: profile } = await supabase
    .from('profiles')
    .select('username, avatar_url, user_roles')
    .eq('id', userId)
    .maybeSingle();
  return {
    data: { ...inserted.data, profiles: profile ?? null },
    error: null,
  };
}

async function updateCommentWithProfile(commentId: string, userId: string, trimmed: string) {
  for (let i = 0; i < COMMENT_PROFILE_EMBED_VARIANTS.length; i++) {
    const embed = COMMENT_PROFILE_EMBED_VARIANTS[i];
    const result = await supabase
      .from('comments')
      .update({ text: trimmed, updated_at: new Date().toISOString() })
      .eq('id', commentId)
      .eq('user_id', userId)
      .select(`*, ${embed}`)
      .single();
    if (!result.error) return result;
    const msg = result.error.message ?? '';
    if (i === 0 && isProfileEmbedAmbiguityError(msg)) continue;
  }
  const updated = await supabase
    .from('comments')
    .update({ text: trimmed, updated_at: new Date().toISOString() })
    .eq('id', commentId)
    .eq('user_id', userId)
    .select('*')
    .single();
  if (updated.error || !updated.data) return updated;
  const { data: profile } = await supabase
    .from('profiles')
    .select('username, avatar_url, user_roles')
    .eq('id', userId)
    .maybeSingle();
  return {
    data: { ...updated.data, profiles: profile ?? null },
    error: null,
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
    .select('id, username, avatar_url, user_roles')
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
        userRoles: p.user_roles ?? undefined,
        createdAt: k.createdAt,
      };
    })
    .filter(Boolean) as KudosUser[];
}

export async function fetchComments(postId: string): Promise<Comment[]> {
  const { data: { user } } = await supabase.auth.getUser();
  const currentUserId = user?.id ?? null;

  const rows = await fetchCommentRows(postId);
  const commentIds = rows.map((r) => r.id);

  let likeCountMap: Record<string, number> = {};
  let myLikedIds = new Set<string>();
  try {
    const meta = await fetchCommentLikeMeta(commentIds, currentUserId);
    likeCountMap = meta.likeCountMap;
    myLikedIds = meta.myLikedIds;
  } catch {
    // comment_likes may be unavailable — still return comments without like state
  }

  return rows.map((row) =>
    mapCommentRow(row, likeCountMap[row.id] ?? 0, myLikedIds.has(row.id)),
  );
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
  const { data, error } = await insertCommentWithProfile(postId, userId, trimmed);
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

  return mapCommentRow(data, 0, false);
}

export async function updateComment(
  commentId: string,
  userId: string,
  text: string,
): Promise<Comment> {
  const trimmed = text.trim();
  if (!trimmed) throw new Error('Comment cannot be empty');

  const { data: existing, error: existingError } = await supabase
    .from('comments')
    .select('post_id')
    .eq('id', commentId)
    .eq('user_id', userId)
    .maybeSingle();
  if (existingError) throw existingError;
  if (!existing) throw new Error('Comment not found');

  const postId = existing.post_id as string;

  const { data, error } = await updateCommentWithProfile(commentId, userId, trimmed);
  if (error) throw error;

  const friendMap = await fetchFriendsForMentions(userId);
  await syncMentions({
    postId,
    mentionerId: userId,
    field: 'comment',
    text: trimmed,
    commentId,
    friendUsernameToId: friendMap,
  });

  let likeCount = 0;
  let hasLiked = false;
  try {
    const meta = await fetchCommentLikeMeta([commentId], userId);
    likeCount = meta.likeCountMap[commentId] ?? 0;
    hasLiked = meta.myLikedIds.has(commentId);
  } catch {
    // comment_likes may be unavailable
  }
  return mapCommentRow(data, likeCount, hasLiked);
}

export async function deleteComment(commentId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function toggleCommentLike(
  commentId: string,
  userId: string,
  currentCount: number,
  currentlyLiked: boolean,
): Promise<{ likeCount: number; hasLiked: boolean }> {
  if (currentlyLiked) {
    const { error } = await supabase
      .from('comment_likes')
      .delete()
      .eq('comment_id', commentId)
      .eq('user_id', userId);
    if (error) throw error;
    return { likeCount: Math.max(0, currentCount - 1), hasLiked: false };
  }

  const { error } = await supabase
    .from('comment_likes')
    .insert({ comment_id: commentId, user_id: userId });
  if (error) throw error;
  return { likeCount: currentCount + 1, hasLiked: true };
}

export async function fetchCommentLikeUsers(commentId: string): Promise<KudosUser[]> {
  const { data: likeRows, error: likesError } = await supabase
    .from('comment_likes')
    .select('user_id, created_at')
    .eq('comment_id', commentId)
    .order('created_at', { ascending: false });

  if (likesError) throw likesError;
  if (!likeRows?.length) return [];

  const ordered = likeRows
    .map((r) => ({ userId: r.user_id as string, createdAt: r.created_at as string }))
    .filter((r) => Boolean(r.userId));

  const uniqueIds = Array.from(new Set(ordered.map((r) => r.userId)));
  if (!uniqueIds.length) return [];

  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, user_roles')
    .in('id', uniqueIds);

  if (profilesError) throw profilesError;

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));
  return ordered
    .map((like) => {
      const p = profileMap.get(like.userId);
      if (!p) return null;
      return {
        id: p.id,
        username: p.username,
        avatarUrl: p.avatar_url ?? undefined,
        userRoles: p.user_roles ?? undefined,
        createdAt: like.createdAt,
      };
    })
    .filter(Boolean) as KudosUser[];
}
