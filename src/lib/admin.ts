import type { PostgrestError } from '@supabase/supabase-js';
import { supabase } from './supabase';

export function formatAdminRpcError(label: string, err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err) {
    const pg = err as PostgrestError;
    const parts = [`${label}: ${pg.message}`];
    if (pg.code) parts.push(`(${pg.code})`);
    if (pg.details) parts.push(pg.details);
    if (pg.hint) parts.push(pg.hint);
    return parts.join(' ');
  }
  if (err instanceof Error) return `${label}: ${err.message}`;
  return `${label}: Could not load data.`;
}

function isMissingTagsRpc(err: PostgrestError): boolean {
  const msg = err.message ?? '';
  return err.code === 'PGRST202'
    || err.code === '42883'
    || /admin_list_tags/i.test(msg);
}

export type PostReportRow = {
  id: string;
  created_at: string;
  reason: string;
  reporter: string;
  reporter_id: string;
  reporter_email?: string | null;
  author: string;
  author_id: string;
  author_joined: string;
  author_posts_count: number;
  author_roles: string[] | null;
  author_is_premium: boolean;
  author_report_count: number;
  title: string;
  post_id: string;
  post_sleep_date: string;
  post_created_at: string;
  post_deleted: boolean;
  post_report_count: number;
};

export type CommentReportRow = {
  id: string;
  created_at: string;
  reason: string;
  reporter: string;
  reporter_id: string;
  reporter_email?: string | null;
  author: string;
  author_id: string;
  author_joined: string;
  author_posts_count: number;
  author_roles: string[] | null;
  author_is_premium: boolean;
  author_report_count: number;
  comment_text: string;
  comment_id: string;
  comment_created_at: string;
  post_id: string;
  post_title: string;
  comment_report_count: number;
};

export type DashboardMetrics = {
  total_users: number;
  new_users_7d: number;
  new_users_30d: number;
  total_posts: number;
  posts_7d: number;
  posts_30d: number;
  wearable_posts: number;
  manual_posts: number;
  posts_with_dreams: number;
  active_users_7d: number;
  active_users_30d: number;
  total_comments: number;
  comments_7d: number;
  comments_30d: number;
  total_kudos: number;
  kudos_7d: number;
  friendships: number;
  pending_friend_requests: number;
  active_challenges: number;
  pending_challenges: number;
  pending_post_reports: number;
  pending_comment_reports: number;
  premium_users: number;
};

export type DailyActivityRow = {
  day: string;
  signups: number;
  posts: number;
  comments: number;
  active_users: number;
};

export type UserSearchFilters = {
  query?: string;
  limit?: number;
  role?: string | null;
  premiumOnly?: boolean;
  minPosts?: number | null;
  joinedWithinDays?: number | null;
};

export type RecentUserRow = {
  id: string;
  username: string;
  email?: string | null;
  created_at: string;
  user_roles: string[] | null;
  is_premium: boolean;
  premium_until?: string | null;
  posts_count: number;
  last_app_version?: string | null;
};

export type AppVersionRow = {
  version: string;
  user_count: number;
  last_seen: string | null;
};

export type AnalyticsMetrics = {
  start_date: string;
  end_date: string;
  app_version: string | null;
  signups: number;
  active_users: number;
  posts: number;
  wearable_posts: number;
  manual_posts: number;
  posts_with_dreams: number;
  comments: number;
  kudos: number;
  friendships_accepted: number;
  version_user_count: number | null;
  users_with_version_reported: number;
};

export type RecentPostRow = {
  id: string;
  user_id: string;
  username: string;
  sleep_date: string;
  title: string;
  asleep_minutes: number;
  in_bed_minutes: number;
  core_minutes: number | null;
  deep_minutes: number | null;
  rem_minutes: number | null;
  awake_minutes: number | null;
  efficiency: number | null;
  is_custom: boolean;
  source_device: string | null;
  has_dream: boolean;
  created_at: string;
  kudos_count: number;
  comments_count: number;
};

export type AnalyticsFilters = {
  start?: string;
  end?: string;
  appVersion?: string | null;
  listLimit?: number;
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

export async function fetchRecentUsers(filters: AnalyticsFilters = {}): Promise<RecentUserRow[]> {
  const { data, error } = await supabase.rpc('admin_get_recent_users', {
    p_limit: filters.listLimit ?? 50,
    p_start: filters.start || null,
    p_end: filters.end || null,
    p_app_version: filters.appVersion || null,
  });
  if (error) throw error;
  return (data as RecentUserRow[] | null) ?? [];
}

export async function fetchRecentPosts(filters: AnalyticsFilters = {}): Promise<RecentPostRow[]> {
  const { data, error } = await supabase.rpc('admin_get_recent_posts', {
    p_limit: filters.listLimit ?? 50,
    p_start: filters.start || null,
    p_end: filters.end || null,
    p_app_version: filters.appVersion || null,
  });
  if (error) throw error;
  return (data as RecentPostRow[] | null) ?? [];
}

export async function fetchDailyActivity(filters: AnalyticsFilters): Promise<DailyActivityRow[]> {
  const { data, error } = await supabase.rpc('admin_get_daily_activity', {
    p_start: filters.start,
    p_end: filters.end,
    p_app_version: filters.appVersion || null,
  });
  if (error) throw error;
  return (data as DailyActivityRow[] | null) ?? [];
}

export async function fetchAnalyticsMetrics(filters: AnalyticsFilters): Promise<AnalyticsMetrics> {
  const { data, error } = await supabase.rpc('admin_get_analytics_metrics', {
    p_start: filters.start,
    p_end: filters.end,
    p_app_version: filters.appVersion || null,
  });
  if (error) throw error;
  return data as AnalyticsMetrics;
}

export async function fetchAppVersions(): Promise<AppVersionRow[]> {
  const { data, error } = await supabase.rpc('admin_list_app_versions');
  if (error) throw error;
  return (data as AppVersionRow[] | null) ?? [];
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

export async function dismissPostReports(postId: string): Promise<number> {
  const { data, error } = await supabase.rpc('admin_dismiss_post_reports', {
    p_post_id: postId,
  });
  if (error) throw error;
  return typeof data === 'number' ? data : 0;
}

export async function dismissCommentReports(commentId: string): Promise<number> {
  const { data, error } = await supabase.rpc('admin_dismiss_comment_reports', {
    p_comment_id: commentId,
  });
  if (error) throw error;
  return typeof data === 'number' ? data : 0;
}

export async function adminSoftDeletePost(postId: string): Promise<void> {
  const { error } = await supabase.rpc('admin_soft_delete_post', {
    p_post_id: postId,
  });
  if (error) throw error;
}

export async function adminDeleteComment(commentId: string): Promise<void> {
  const { error } = await supabase.rpc('admin_delete_comment', {
    p_comment_id: commentId,
  });
  if (error) throw error;
}

export async function fetchAdminTags(filters?: AnalyticsFilters): Promise<AdminTagRow[]> {
  const rangedArgs = {
    p_start: filters?.start || null,
    p_end: filters?.end || null,
    p_app_version: filters?.appVersion || null,
  };
  let result = await supabase.rpc('admin_list_tags', rangedArgs);
  if (result.error && isMissingTagsRpc(result.error)) {
    result = await supabase.rpc('admin_list_tags');
  }
  if (result.error) throw result.error;
  return (result.data as AdminTagRow[] | null) ?? [];
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

export async function searchAdminUsers(filters: UserSearchFilters = {}): Promise<RecentUserRow[]> {
  const { data, error } = await supabase.rpc('admin_search_users', {
    p_query: filters.query?.trim() || null,
    p_limit: filters.limit ?? 50,
    p_role: filters.role || null,
    p_premium_only: filters.premiumOnly ?? false,
    p_min_posts: filters.minPosts ?? null,
    p_joined_within_days: filters.joinedWithinDays ?? null,
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

export async function updateUserPremium(
  userId: string,
  isPremium: boolean,
  premiumUntil: string | null,
): Promise<void> {
  const { error } = await supabase.rpc('admin_update_user_premium', {
    p_user_id: userId,
    p_is_premium: isPremium,
    p_premium_until: isPremium ? premiumUntil : null,
  });
  if (error) throw error;
}

export async function fetchPremiumMetrics(): Promise<PremiumMetrics> {
  const { data, error } = await supabase.rpc('admin_get_premium_metrics');
  if (error) throw error;
  return data as PremiumMetrics;
}

export async function fetchPremiumUsers(filters: PremiumUserFilters = {}): Promise<PremiumUserRow[]> {
  const { data, error } = await supabase.rpc('admin_list_premium_users', {
    p_query: filters.query?.trim() || null,
    p_limit: filters.limit ?? 100,
  });
  if (error) throw error;
  return (data as PremiumUserRow[] | null) ?? [];
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

export type SendNotificationResult = {
  notification_id: string;
  device_tokens: number;
};

export type PremiumMetrics = {
  total_users: number;
  premium_active: number;
  premium_pct: number;
  expiring_7d: number;
  expiring_30d: number;
  lifetime_grants: number;
  past_due: number;
};

export type PremiumUserRow = {
  id: string;
  username: string;
  email?: string | null;
  premium_until: string | null;
  days_remaining: number | null;
  grant_type: 'lifetime' | 'timed' | 'past_due' | string;
};

export type PremiumUserFilters = {
  query?: string;
  limit?: number;
};

export async function sendAdminNotification(
  userId: string,
  message: string,
): Promise<SendNotificationResult> {
  const { data, error } = await supabase.rpc('admin_send_notification', {
    p_user_id: userId,
    p_message: message,
  });
  if (error) throw error;
  const row = data as SendNotificationResult | null;
  if (!row?.notification_id) {
    throw new Error('Unexpected response from server.');
  }
  return {
    notification_id: row.notification_id,
    device_tokens: row.device_tokens ?? 0,
  };
}
