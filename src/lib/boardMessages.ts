import { supabase } from './supabase';
import type { BoardEntityType, BoardMessage } from './types';

type BoardMessageRow = {
  id: string;
  entity_type: BoardEntityType;
  entity_id: string;
  user_id: string;
  text: string;
  created_at: string;
  updated_at?: string | null;
  profiles: { username: string; avatar_url?: string | null; user_roles?: string[] | null } | null;
};

/** Keyset cursor for older pages (created_at, id) — both halves required. */
export type BoardMessageCursor = {
  createdAt: string;
  id: string;
};

export type BoardUnreadBadgeCounts = {
  challengeCount: number;
  clubCount: number;
};

function isEdited(row: Pick<BoardMessageRow, 'created_at' | 'updated_at'>): boolean {
  if (!row.updated_at) return false;
  return new Date(row.updated_at).getTime() > new Date(row.created_at).getTime() + 1000;
}

function mapRow(row: BoardMessageRow): BoardMessage {
  const username = row.profiles?.username ?? 'unknown';
  return {
    id: row.id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    userId: row.user_id,
    username,
    avatarUrl: row.profiles?.avatar_url ?? undefined,
    userRoles: row.profiles?.user_roles ?? undefined,
    text: row.text,
    createdAt: row.created_at,
    isEdited: isEdited(row),
  };
}

async function requireUserId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return user.id;
}

async function attachProfiles(rows: BoardMessageRow[]): Promise<BoardMessageRow[]> {
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

/**
 * Newest-first keyset page (RPC), returned ascending for comment UX.
 * Pass `before` = oldest loaded message to fetch the next older page.
 */
export async function fetchBoardMessagesPage(
  entityType: BoardEntityType,
  entityId: string,
  before?: BoardMessageCursor | null,
  limit = 20,
): Promise<BoardMessage[]> {
  const { data, error } = await supabase.rpc('get_board_messages_page', {
    p_entity_type: entityType,
    p_entity_id: entityId,
    p_before_created_at: before?.createdAt ?? null,
    p_before_id: before?.id ?? null,
    p_limit: limit,
  });
  if (error) throw error;

  let rows = (data ?? []) as BoardMessageRow[];
  rows = rows.slice().reverse();
  rows = await attachProfiles(rows);
  return rows.map(mapRow);
}

export async function fetchBoardMessageCount(
  entityType: BoardEntityType,
  entityId: string,
): Promise<number> {
  const { count, error } = await supabase
    .from('board_messages')
    .select('id', { count: 'exact', head: true })
    .eq('entity_type', entityType)
    .eq('entity_id', entityId);
  if (error) throw error;
  return count ?? 0;
}

export async function fetchBoardUnreadBadgeCounts(): Promise<BoardUnreadBadgeCounts> {
  const { data, error } = await supabase.rpc('get_board_unread_badge_counts');
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return {
    challengeCount: Number(row?.challenge_count ?? 0),
    clubCount: Number(row?.club_count ?? 0),
  };
}

export async function markBoardMessagesRead(
  entityType: BoardEntityType,
  entityId: string,
): Promise<void> {
  const { error } = await supabase.rpc('mark_board_messages_read', {
    p_entity_type: entityType,
    p_entity_id: entityId,
  });
  if (error) throw error;
}

export async function addBoardMessage(
  entityType: BoardEntityType,
  entityId: string,
  text: string,
): Promise<BoardMessage> {
  const userId = await requireUserId();
  const trimmed = text.trim();
  if (!trimmed) throw new Error('Message cannot be empty');

  const { data, error } = await supabase
    .from('board_messages')
    .insert({
      entity_type: entityType,
      entity_id: entityId,
      user_id: userId,
      text: trimmed,
    })
    .select('id, entity_type, entity_id, user_id, text, created_at, updated_at')
    .single();
  if (error) throw error;

  const [withProfile] = await attachProfiles([{
    ...(data as BoardMessageRow),
    profiles: null,
  }]);
  return mapRow(withProfile);
}

export async function updateBoardMessage(
  messageId: string,
  text: string,
): Promise<BoardMessage> {
  const userId = await requireUserId();
  const trimmed = text.trim();
  if (!trimmed) throw new Error('Message cannot be empty');

  const updatedAt = new Date().toISOString();
  const { data, error } = await supabase
    .from('board_messages')
    .update({ text: trimmed, updated_at: updatedAt })
    .eq('id', messageId)
    .eq('user_id', userId)
    .select('id, entity_type, entity_id, user_id, text, created_at, updated_at')
    .single();
  if (error) throw error;

  const [withProfile] = await attachProfiles([{
    ...(data as BoardMessageRow),
    profiles: null,
  }]);
  return mapRow(withProfile);
}

export async function deleteBoardMessage(messageId: string): Promise<void> {
  const userId = await requireUserId();
  const { error } = await supabase
    .from('board_messages')
    .delete()
    .eq('id', messageId)
    .eq('user_id', userId);
  if (error) throw error;
}
