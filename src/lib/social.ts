import { supabase } from './supabase';
import type {
  ClubInviteStatus,
  ClubRole,
  WebClub,
  WebClubMember,
  WebFriend,
  WebFriendRequest,
} from './types';

function mapClubRow(row: {
  id: string;
  name: string;
  emoji: string | null;
  description: string | null;
  member_count: number | string;
  my_role: string;
  my_invite_status: string;
}): WebClub {
  return {
    id: row.id,
    name: row.name,
    emoji: row.emoji ?? null,
    description: row.description ?? null,
    memberCount: Number(row.member_count),
    myRole: row.my_role as ClubRole,
    myInviteStatus: row.my_invite_status as ClubInviteStatus,
  };
}

function mapMemberRow(row: {
  user_id: string;
  role: string;
  invite_status: string;
  username: string;
  avatar_url: string | null;
}): WebClubMember {
  return {
    userId: row.user_id,
    username: row.username,
    avatarUrl: row.avatar_url ?? undefined,
    role: row.role as ClubRole,
    inviteStatus: row.invite_status as ClubInviteStatus,
  };
}

export async function fetchFriends(): Promise<WebFriend[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('friends')
    .select('user_a, user_b, created_at')
    .in('status', ['accepted', 'friends'])
    .or(`user_a.eq.${user.id},user_b.eq.${user.id}`);

  if (error || !data?.length) return [];

  const friendIds = data.map((row) => (row.user_a === user.id ? row.user_b : row.user_a));
  const sinceById = new Map(
    data.map((row) => {
      const friendId = row.user_a === user.id ? row.user_b : row.user_a;
      return [friendId, row.created_at] as const;
    }),
  );

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, user_roles')
    .in('id', friendIds);

  return (profiles ?? [])
    .map((profile) => ({
      id: profile.id,
      username: profile.username,
      avatarUrl: profile.avatar_url ?? undefined,
      userRoles: profile.user_roles ?? undefined,
      friendsSince: sinceById.get(profile.id) ?? '',
    }))
    .sort((a, b) => a.username.localeCompare(b.username));
}

export async function fetchInboundFriendRequests(): Promise<WebFriendRequest[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('friends')
    .select('user_a, user_b, created_at')
    .eq('status', 'pending')
    .or(`user_a.eq.${user.id},user_b.eq.${user.id}`);

  if (error || !data?.length) return [];

  const latestByPair = new Map<string, { user_a: string; user_b: string; created_at: string }>();
  for (const row of data) {
    const a = row.user_a < row.user_b ? row.user_a : row.user_b;
    const b = row.user_a < row.user_b ? row.user_b : row.user_a;
    const key = `${a}:${b}`;
    const prev = latestByPair.get(key);
    if (!prev || new Date(row.created_at).getTime() >= new Date(prev.created_at).getTime()) {
      latestByPair.set(key, row);
    }
  }

  const inboundRows = Array.from(latestByPair.values()).filter((row) => row.user_b === user.id);
  if (!inboundRows.length) return [];

  const requesterIds = inboundRows.map((row) => row.user_a);
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, user_roles')
    .in('id', requesterIds);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  return inboundRows.map((row) => {
    const profile = profileMap.get(row.user_a);
    return {
      requesterId: row.user_a,
      username: profile?.username ?? 'unknown',
      avatarUrl: profile?.avatar_url ?? undefined,
      userRoles: profile?.user_roles ?? undefined,
      requestedAt: row.created_at,
    };
  });
}

export async function acceptFriendRequest(requesterId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in');

  const { error } = await supabase
    .from('friends')
    .update({ status: 'accepted' })
    .eq('user_a', requesterId)
    .eq('user_b', user.id);

  if (error) throw error;
}

export async function declineFriendRequest(requesterId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in');

  const { error } = await supabase
    .from('friends')
    .delete()
    .eq('user_a', requesterId)
    .eq('user_b', user.id);

  if (error) throw error;
}

export async function fetchClubs(): Promise<WebClub[]> {
  const { data, error } = await supabase.rpc('get_user_clubs');
  if (error) throw error;
  return (data ?? []).map(mapClubRow);
}

export async function fetchClubMembers(clubId: string): Promise<WebClubMember[]> {
  const { data, error } = await supabase.rpc('get_club_members', { p_club_id: clubId });
  if (error) throw error;
  return (data ?? [])
    .map(mapMemberRow)
    .filter((member: WebClubMember) => member.inviteStatus === 'accepted');
}

export async function respondToClubInvite(clubId: string, accept: boolean): Promise<void> {
  const { error } = await supabase.rpc('respond_to_club_invite', {
    p_club_id: clubId,
    p_accept: accept,
  });
  if (error) throw error;
}
