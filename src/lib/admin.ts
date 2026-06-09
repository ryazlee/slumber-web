import { supabase } from './supabase';

export type PostReportRow = {
  id: string;
  created_at: string;
  reason: string;
  reporter: string;
  author: string;
  title: string;
  post_id: string;
};

export type CommentReportRow = {
  id: string;
  created_at: string;
  reason: string;
  reporter: string;
  author: string;
  comment_text: string;
  comment_id: string;
  post_id: string;
};

export type DashboardMetrics = {
  total_users: number;
  new_users_7d: number;
  new_users_30d: number;
  total_posts: number;
  posts_7d: number;
  posts_30d: number;
  active_users_7d: number;
  active_users_30d: number;
  total_comments: number;
  comments_7d: number;
  total_kudos: number;
  kudos_7d: number;
  friendships: number;
  active_challenges: number;
  pending_post_reports: number;
  pending_comment_reports: number;
  premium_users: number;
};

export type RecentUserRow = {
  id: string;
  username: string;
  created_at: string;
  user_roles: string[] | null;
  is_premium: boolean;
  posts_count: number;
};

export type AdminTagRow = {
  value: string;
  emoji: string;
  label: string;
  sort_order: number;
  usage_count: number;
};

export type TagDraft = {
  value: string;
  emoji: string;
  label: string;
  sort_order: number;
};

export type AdminRoleDefinitionRow = {
  key: string;
  label: string;
  badge: string;
  ring_color: string;
  badge_color: string | null;
  is_admin: boolean;
  assignable: boolean;
  sort_order: number;
  usage_count: number;
};

export type RoleDefinitionDraft = {
  key: string;
  label: string;
  badge: string;
  ring_color: string;
  badge_color: string;
  is_admin: boolean;
  assignable: boolean;
  sort_order: number;
};

export async function checkIsModerator(): Promise<boolean> {
  const { data, error } = await supabase.rpc('is_moderator');
  if (error) return false;
  return data === true;
}

export async function fetchDashboardMetrics(): Promise<DashboardMetrics> {
  const { data, error } = await supabase.rpc('admin_get_dashboard_metrics');
  if (error) throw error;
  return data as DashboardMetrics;
}

export async function fetchRecentUsers(limit = 25): Promise<RecentUserRow[]> {
  const { data, error } = await supabase.rpc('admin_get_recent_users', { p_limit: limit });
  if (error) throw error;
  return (data as RecentUserRow[] | null) ?? [];
}

export async function fetchPostReports(): Promise<PostReportRow[]> {
  const { data, error } = await supabase.rpc('admin_get_post_reports');
  if (error) throw error;
  return (data as PostReportRow[] | null) ?? [];
}

export async function fetchCommentReports(): Promise<CommentReportRow[]> {
  const { data, error } = await supabase.rpc('admin_get_comment_reports');
  if (error) throw error;
  return (data as CommentReportRow[] | null) ?? [];
}

export async function fetchAdminTags(): Promise<AdminTagRow[]> {
  const { data, error } = await supabase.rpc('admin_list_tags');
  if (error) throw error;
  return (data as AdminTagRow[] | null) ?? [];
}

export async function upsertAdminTag(tag: TagDraft): Promise<void> {
  const { error } = await supabase.rpc('admin_upsert_tag', {
    p_value: tag.value,
    p_emoji: tag.emoji,
    p_label: tag.label,
    p_sort_order: tag.sort_order,
  });
  if (error) throw error;
}

export async function deleteAdminTag(value: string): Promise<void> {
  const { error } = await supabase.rpc('admin_delete_tag', { p_value: value });
  if (error) throw error;
}

export async function searchAdminUsers(query = '', limit = 50): Promise<RecentUserRow[]> {
  const { data, error } = await supabase.rpc('admin_search_users', {
    p_query: query || null,
    p_limit: limit,
  });
  if (error) throw error;
  return (data as RecentUserRow[] | null) ?? [];
}

export async function updateUserRoles(userId: string, roles: string[]): Promise<void> {
  const { error } = await supabase.rpc('admin_update_user_roles', {
    p_user_id: userId,
    p_roles: roles,
  });
  if (error) throw error;
}

export async function fetchAdminRoleDefinitions(): Promise<AdminRoleDefinitionRow[]> {
  const { data, error } = await supabase.rpc('admin_list_role_definitions');
  if (error) throw error;
  return (data as AdminRoleDefinitionRow[] | null) ?? [];
}

export async function upsertAdminRoleDefinition(role: RoleDefinitionDraft): Promise<void> {
  const { error } = await supabase.rpc('admin_upsert_role_definition', {
    p_key: role.key,
    p_label: role.label,
    p_badge: role.badge,
    p_ring_color: role.ring_color,
    p_badge_color: role.badge_color || null,
    p_is_admin: role.is_admin,
    p_assignable: role.assignable,
    p_sort_order: role.sort_order,
  });
  if (error) throw error;
}

export async function deleteAdminRoleDefinition(key: string): Promise<void> {
  const { error } = await supabase.rpc('admin_delete_role_definition', { p_key: key });
  if (error) throw error;
}
