import type { PostgrestError } from '@supabase/supabase-js';
import {
  ADMIN_QUEUE_FETCH_LIMIT,
  parsePaginatedResult,
  resolvePageOffset,
  resolvePageSize,
  type PaginatedResult,
  type PaginationFilters,
} from './adminPagination';
import { ADMIN_MIGRATION_HINT, isMissingAdminRpc } from './adminRpc';
import { supabase } from './supabase';

/** Pre-migration 100 cap on admin_get_recent_posts(p_limit, …). */
const LEGACY_RECENT_POSTS_CAP = 200;

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

export type UserSearchFilters = PaginationFilters & {
  query?: string;
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

export type AnalyticsFilters = PaginationFilters & {
  start?: string;
  end?: string;
  appVersion?: string | null;
};

export type PaginatedRecentPosts = PaginatedResult<RecentPostRow>;

export type ReportListFilters = PaginationFilters;

export type CatalogListFilters = PaginationFilters;

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

export async function fetchRecentUsers(filters: AnalyticsFilters = {}): Promise<PaginatedResult<RecentUserRow>> {
  const pageSize = resolvePageSize(filters.pageSize, filters.limit, 50);
  const page = filters.page ?? 0;
  const { data, error } = await supabase.rpc('admin_get_recent_users', {
    p_limit: pageSize,
    p_offset: resolvePageOffset(page, pageSize),
    p_start: filters.start || null,
    p_end: filters.end || null,
    p_app_version: filters.appVersion || null,
  });
  if (error) throw error;
  return parsePaginatedResult<RecentUserRow>(data);
}

export async function fetchRecentPosts(filters: AnalyticsFilters = {}): Promise<PaginatedRecentPosts> {
  const pageSize = resolvePageSize(filters.pageSize, filters.limit);
  const page = filters.page ?? 0;
  const offset = resolvePageOffset(page, pageSize);
  const rpcArgs = {
    p_limit: pageSize,
    p_offset: offset,
    p_start: filters.start || null,
    p_end: filters.end || null,
    p_app_version: filters.appVersion || null,
  };

  let result = await supabase.rpc('admin_get_recent_posts', rpcArgs);

  if (result.error && isMissingAdminRpc(result.error, 'admin_get_recent_posts')) {
    result = await fetchRecentPostsLegacy(filters, pageSize, offset);
  }

  if (result.error) throw result.error;
  return parseRecentPostsResult(result.data, pageSize, offset);
}

async function fetchRecentPostsLegacy(
  filters: AnalyticsFilters,
  pageSize: number,
  offset: number,
) {
  const fetchLimit = Math.min(LEGACY_RECENT_POSTS_CAP, offset + pageSize);
  if (offset + pageSize > LEGACY_RECENT_POSTS_CAP) {
    throw new Error(
      `Posts pagination is limited to ${LEGACY_RECENT_POSTS_CAP} rows until migration 100 is applied. ${ADMIN_MIGRATION_HINT}`,
    );
  }

  return supabase.rpc('admin_get_recent_posts', {
    p_limit: fetchLimit,
    p_start: filters.start || null,
    p_end: filters.end || null,
    p_app_version: filters.appVersion || null,
  });
}

function parseRecentPostsResult(
  data: unknown,
  pageSize: number,
  offset: number,
): PaginatedRecentPosts {
  if (data && typeof data === 'object' && 'rows' in data) {
    return parsePaginatedResult<RecentPostRow>(data);
  }

  const allRows = (data as RecentPostRow[] | null) ?? [];
  const rows = allRows.slice(offset, offset + pageSize);
  const fetchLimit = Math.min(LEGACY_RECENT_POSTS_CAP, offset + pageSize);
  const total = allRows.length < fetchLimit ? allRows.length : fetchLimit;

  return { total, rows };
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

export async function fetchPostReports(
  filters: ReportListFilters = {},
): Promise<PaginatedResult<PostReportRow>> {
  const pageSize = filters.pageSize === ADMIN_QUEUE_FETCH_LIMIT || filters.limit === ADMIN_QUEUE_FETCH_LIMIT
    ? ADMIN_QUEUE_FETCH_LIMIT
    : resolvePageSize(filters.pageSize, filters.limit);
  const page = filters.page ?? 0;
  const { data, error } = await supabase.rpc('admin_get_post_reports', {
    p_limit: pageSize,
    p_offset: resolvePageOffset(page, pageSize),
  });
  if (error) throw error;
  return parsePaginatedResult<PostReportRow>(data);
}

export async function fetchCommentReports(
  filters: ReportListFilters = {},
): Promise<PaginatedResult<CommentReportRow>> {
  const pageSize = filters.pageSize === ADMIN_QUEUE_FETCH_LIMIT || filters.limit === ADMIN_QUEUE_FETCH_LIMIT
    ? ADMIN_QUEUE_FETCH_LIMIT
    : resolvePageSize(filters.pageSize, filters.limit);
  const page = filters.page ?? 0;
  const { data, error } = await supabase.rpc('admin_get_comment_reports', {
    p_limit: pageSize,
    p_offset: resolvePageOffset(page, pageSize),
  });
  if (error) throw error;
  return parsePaginatedResult<CommentReportRow>(data);
}

export async function fetchPostReportsQueue(): Promise<PaginatedResult<PostReportRow>> {
  return fetchPostReports({ page: 0, pageSize: ADMIN_QUEUE_FETCH_LIMIT });
}

export async function fetchCommentReportsQueue(): Promise<PaginatedResult<CommentReportRow>> {
  return fetchCommentReports({ page: 0, pageSize: ADMIN_QUEUE_FETCH_LIMIT });
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

export type RecalculateSleepStagesResult = {
  ok: boolean;
  post_id: string;
  changed: boolean;
  before: {
    core_minutes: number | null;
    deep_minutes: number | null;
    rem_minutes: number | null;
    awake_minutes: number | null;
    asleep_minutes: number;
    awake_events: number | null;
  };
  after: {
    core_minutes: number;
    deep_minutes: number;
    rem_minutes: number;
    awake_minutes: number;
    asleep_minutes: number;
    awake_events: number;
  };
};

export type RecalculateSleepStagesBulkResult = {
  fixed: number;
  skipped: number;
  errors: { post_id: string; error: string }[];
};

export async function recalculateSleepPostStages(postId: string): Promise<RecalculateSleepStagesResult> {
  const { data, error } = await supabase.rpc('admin_recalculate_sleep_post_stages', {
    p_post_id: postId,
  });
  if (error) throw error;
  return data as RecalculateSleepStagesResult;
}

export async function recalculateSleepPostStagesBulk(
  postIds: string[],
): Promise<RecalculateSleepStagesBulkResult> {
  const { data, error } = await supabase.rpc('admin_recalculate_sleep_post_stages_bulk', {
    p_post_ids: postIds,
  });
  if (error) throw error;
  const row = data as RecalculateSleepStagesBulkResult | null;
  return row ?? { fixed: 0, skipped: 0, errors: [] };
}

export type RepairDoubledSleepStagesResult = RecalculateSleepStagesResult & {
  before: RecalculateSleepStagesResult['before'] & { segment_count?: number };
  after: RecalculateSleepStagesResult['after'] & { segment_count?: number };
};

export async function repairDoubledSleepPostStages(
  postId: string,
): Promise<RepairDoubledSleepStagesResult> {
  const { data, error } = await supabase.rpc('admin_repair_doubled_sleep_post_stages', {
    p_post_id: postId,
  });
  if (error) throw error;
  return data as RepairDoubledSleepStagesResult;
}

export async function repairDoubledSleepPostStagesBulk(
  postIds: string[],
): Promise<RecalculateSleepStagesBulkResult> {
  const { data, error } = await supabase.rpc('admin_repair_doubled_sleep_post_stages_bulk', {
    p_post_ids: postIds,
  });
  if (error) throw error;
  const row = data as RecalculateSleepStagesBulkResult | null;
  return row ?? { fixed: 0, skipped: 0, errors: [] };
}

export async function fetchAdminTags(
  filters: AnalyticsFilters & CatalogListFilters = {},
): Promise<PaginatedResult<AdminTagRow>> {
  const pageSize = resolvePageSize(filters.pageSize, filters.limit, 100);
  const page = filters.page ?? 0;
  const rangedArgs = {
    p_limit: pageSize,
    p_offset: resolvePageOffset(page, pageSize),
    p_start: filters.start || null,
    p_end: filters.end || null,
    p_app_version: filters.appVersion || null,
  };
  const result = await supabase.rpc('admin_list_tags', rangedArgs);
  if (result.error) throw result.error;
  return parsePaginatedResult<AdminTagRow>(result.data);
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

export async function searchAdminUsers(
  filters: UserSearchFilters = {},
): Promise<PaginatedResult<RecentUserRow>> {
  const pageSize = resolvePageSize(filters.pageSize, filters.limit, 50);
  const page = filters.page ?? 0;
  const { data, error } = await supabase.rpc('admin_search_users', {
    p_query: filters.query?.trim() || null,
    p_limit: pageSize,
    p_offset: resolvePageOffset(page, pageSize),
    p_role: filters.role || null,
    p_premium_only: filters.premiumOnly ?? false,
    p_min_posts: filters.minPosts ?? null,
    p_joined_within_days: filters.joinedWithinDays ?? null,
  });
  if (error) throw error;
  return parsePaginatedResult<RecentUserRow>(data);
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

export type PremiumUserFilters = PaginationFilters & {
  query?: string;
};

export async function fetchPremiumUsers(
  filters: PremiumUserFilters = {},
): Promise<PaginatedResult<PremiumUserRow>> {
  const pageSize = resolvePageSize(filters.pageSize, filters.limit, 25);
  const page = filters.page ?? 0;
  const { data, error } = await supabase.rpc('admin_list_premium_users', {
    p_query: filters.query?.trim() || null,
    p_limit: pageSize,
    p_offset: resolvePageOffset(page, pageSize),
  });
  if (error) throw error;
  return parsePaginatedResult<PremiumUserRow>(data);
}

export async function fetchAdminRoleDefinitions(
  filters: CatalogListFilters = {},
): Promise<PaginatedResult<AdminRoleDefinitionRow>> {
  const pageSize = resolvePageSize(filters.pageSize, filters.limit, 25);
  const page = filters.page ?? 0;
  const { data, error } = await supabase.rpc('admin_list_role_definitions', {
    p_limit: pageSize,
    p_offset: resolvePageOffset(page, pageSize),
  });
  if (error) throw error;
  return parsePaginatedResult<AdminRoleDefinitionRow>(data);
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
