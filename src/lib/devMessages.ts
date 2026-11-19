import { supabase } from './supabase';

export const DEV_MESSAGE_MAX_LENGTH = 2000;

export type DevMessageSender = 'user' | 'dev';

export type DevThread = {
  user_id: string;
  username: string;
  avatar_url: string | null;
  last_body: string;
  last_sender: DevMessageSender;
  last_at: string;
  message_count: number;
};

export type DevThreadMessage = {
  id: string;
  user_id: string;
  sender: DevMessageSender;
  body: string;
  created_at: string;
};

function asSender(value: unknown): DevMessageSender {
  return value === 'dev' ? 'dev' : 'user';
}

function rowsFrom<T>(data: unknown, map: (row: Record<string, unknown>) => T): T[] {
  const raw = data && typeof data === 'object' && 'rows' in data
    ? (data as { rows?: unknown }).rows
    : null;
  if (!Array.isArray(raw)) return [];
  return raw.map((row) => map(row as Record<string, unknown>));
}

/** Literal substring for Postgres ILIKE. `%` and `_` stay characters, not wildcards. */
function ilikeContains(query: string): string {
  const literal = query.replace(/[\\%_]/g, (char) => `\\${char}`);
  return `%${literal}%`;
}

/**
 * User ids whose message history contains `query` (any row, not only the latest).
 * Moderators can SELECT every dev_messages row; this does not need a new RPC.
 */
export async function searchAdminDevMessageUserIds(query: string): Promise<string[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const pageSize = 1000;
  const maxRows = 5000;
  const ids = new Set<string>();

  for (let from = 0; from < maxRows; from += pageSize) {
    const { data, error } = await supabase
      .from('dev_messages')
      .select('user_id')
      .ilike('body', ilikeContains(q))
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .range(from, from + pageSize - 1);
    if (error) throw error;
    const rows = (data ?? []) as { user_id?: unknown }[];
    for (const row of rows) {
      if (typeof row.user_id === 'string' && row.user_id) ids.add(row.user_id);
    }
    if (rows.length < pageSize) break;
  }

  return [...ids];
}

export async function fetchAdminDevThreads(): Promise<DevThread[]> {
  const { data, error } = await supabase.rpc('admin_list_dev_threads');
  if (error) throw error;
  return rowsFrom(data, (row) => ({
    user_id: String(row.user_id ?? ''),
    username: String(row.username ?? 'unknown'),
    avatar_url: typeof row.avatar_url === 'string' ? row.avatar_url : null,
    last_body: String(row.last_body ?? ''),
    last_sender: asSender(row.last_sender),
    last_at: String(row.last_at ?? ''),
    message_count: Number(row.message_count ?? 0),
  }));
}

export async function fetchAdminDevMessages(userId: string): Promise<DevThreadMessage[]> {
  const { data, error } = await supabase.rpc('admin_list_dev_messages', { p_user_id: userId });
  if (error) throw error;
  return rowsFrom(data, (row) => ({
    id: String(row.id ?? ''),
    user_id: String(row.user_id ?? ''),
    sender: asSender(row.sender),
    body: String(row.body ?? ''),
    created_at: String(row.created_at ?? ''),
  }));
}

export async function replyAdminDevMessage(userId: string, body: string): Promise<void> {
  const trimmed = body.trim();
  if (!trimmed) throw new Error('Write a reply first.');
  if (trimmed.length > DEV_MESSAGE_MAX_LENGTH) throw new Error('That message is too long.');
  const { error } = await supabase.rpc('admin_reply_dev_message', {
    p_user_id: userId,
    p_body: trimmed,
  });
  if (error) throw error;
}
