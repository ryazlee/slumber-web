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

/** Supabase errors are often plain objects. Never stringify those to "[object Object]". */
export function adminErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'message' in err) {
    const message = (err as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim() && message !== '[object Object]') {
      return message;
    }
  }
  if (err instanceof Error && err.message && err.message !== '[object Object]') return err.message;
  if (typeof err === 'string' && err.trim() && err !== '[object Object]') return err;
  return fallback;
}

export function formatAdminRpcError(label: string, err: unknown): string {
  const message = adminErrorMessage(err, 'Could not load data.');
  if (err && typeof err === 'object') {
    const pg = err as Partial<PostgrestError>;
    const parts = [`${label}: ${message}`];
    if (typeof pg.code === 'string' && pg.code) parts.push(`(${pg.code})`);
    if (typeof pg.details === 'string' && pg.details) parts.push(pg.details);
    if (typeof pg.hint === 'string' && pg.hint) parts.push(pg.hint);
    return parts.join(' ');
  }
  return `${label}: ${message}`;
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
  dream_log?: string | null;
  morning_notes?: string | null;
  vibe?: string | null;
  tags?: string[] | null;
  dream_mood?: string | null;
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
  maxPosts?: number | null;
  joinedWithinDays?: number | null;
  inactiveDays?: number | null;
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
  friends_count?: number;
  last_app_version?: string | null;
  is_suspended?: boolean;
  last_post_at?: string | null;
  last_activity_at?: string | null;
};

export type HealthWindowActivation = {
  signups: number;
  first_time_posters: number;
  never_posted_in_window: number;
};

export type HealthWindowEngagement = {
  posts: number;
  wearable_posts: number;
  manual_posts: number;
  posts_with_dreams: number;
  active_posters: number;
  comments: number;
  kudos: number;
  /** Present after migration 166. */
  commenters?: number;
  posts_with_comments?: number;
  posts_with_kudos?: number;
  nap_posts?: number;
  overnight_posts?: number;
  private_posts?: number;
  friendships_accepted?: number;
  friend_requests?: number;
  clubs_created?: number;
  club_joins?: number;
  challenges_created?: number;
  buddy_tags?: number;
  /** New accounts from a drawing invite. Present after migration 224. */
  invite_signups?: number;
  invite_signups_posted?: number;
  inviters?: number;
};

export type AdminTopInviter = {
  user_id: string;
  username: string;
  signups: number;
  posted: number;
};

export type HealthMetricsRange = {
  start: string;
  end: string;
};

export type HealthMetrics = {
  days: number;
  /** Inclusive calendar bounds when returned by the range RPC. */
  start?: string;
  end?: string;
  activation: HealthWindowActivation & {
    never_posted_total: number;
    inactive_posters: number;
  };
  engagement: HealthWindowEngagement & {
    users_with_push: number;
  };
  retention: {
    wau: number;
    mau: number;
  };
  /** Same-length window immediately before the current one. Omitted on older RPCs. */
  previous?: {
    activation: HealthWindowActivation;
    engagement: HealthWindowEngagement;
    retention: {
      wau: number;
      mau: number;
    };
  };
};

export type CommunityMetrics = {
  active_challenges: number;
  pending_challenges: number;
  completed_challenges_30d: number;
  total_clubs: number;
  club_members_accepted: number;
  pending_club_invites: number;
};

export type AdminChallengeParticipant = {
  id: string;
  username: string;
};

export type AdminChallengeRow = {
  id: string;
  status: string;
  title?: string | null;
  is_group?: boolean;
  goal_minutes: number;
  creator_username: string;
  creator_id: string;
  club_id?: string | null;
  club_name?: string | null;
  club_emoji?: string | null;
  participant_count: number;
  participants?: AdminChallengeParticipant[];
  created_at: string;
  started_at: string | null;
  expires_at: string | null;
};

export type AdminClubRow = {
  id: string;
  name: string;
  emoji: string | null;
  description?: string | null;
  owner_username: string;
  owner_id: string;
  member_count: number;
  pending_invites: number;
  active_members_7d?: number;
  posts_7d?: number;
  created_at: string;
};

export type AdminClubRosterMember = {
  id: string;
  username: string;
  role: string;
  invite_status: string;
  joined_at: string | null;
  posts_7d: number;
};

export type AdminClubRoster = {
  id: string;
  name: string;
  emoji: string | null;
  description: string | null;
  owner_username: string;
  owner_id: string;
  created_at: string;
  member_count: number;
  pending_invites: number;
  active_members_7d: number;
  members: AdminClubRosterMember[];
};

export type DataIssueRow = {
  id: string;
  issue_type: string;
  user_id: string;
  username: string;
  sleep_date: string;
  title: string;
  asleep_minutes: number;
  in_bed_minutes: number;
  created_at: string;
};

export type AdminUserDetail = {
  id: string;
  username: string;
  email?: string | null;
  created_at: string;
  user_roles: string[] | null;
  is_premium: boolean;
  premium_until: string | null;
  last_app_version: string | null;
  is_suspended: boolean;
  posts_count: number;
  friends_count: number;
  current_streak: number;
  longest_streak: number;
  last_post_at: string | null;
  device_tokens: number;
};

export type AdminConnectionUser = {
  id: string;
  username: string;
};

export type AdminUserFriendRow = AdminConnectionUser & {
  since: string;
};

export type AdminPendingFriendRow = AdminConnectionUser & {
  direction: 'incoming' | 'outgoing' | string;
  created_at: string;
};

export type AdminUserClubRow = {
  id: string;
  name: string;
  emoji: string | null;
  role: string;
  invite_status: string;
  joined_at: string | null;
  created_at: string;
  member_count: number;
};

export type AdminUserChallengeRow = {
  id: string;
  status: string;
  title: string | null;
  is_group: boolean;
  goal_minutes: number;
  role: string;
  invite_status: string;
  club_id: string | null;
  club_name: string | null;
  club_emoji: string | null;
  participant_count: number;
  others: AdminConnectionUser[];
  created_at: string;
  started_at: string | null;
  expires_at: string | null;
};

export type AdminConnectionList<T> = {
  total: number;
  rows: T[];
};

export type AdminUserConnections = {
  friends: AdminConnectionList<AdminUserFriendRow>;
  pending_friends: AdminConnectionList<AdminPendingFriendRow>;
  clubs: AdminConnectionList<AdminUserClubRow>;
  challenges: AdminConnectionList<AdminUserChallengeRow>;
};

export type AdminUserOpResult = {
  ok: boolean;
  user_id: string;
  changed: boolean;
  before: Record<string, unknown>;
  after: Record<string, unknown>;
};

export type BroadcastNotificationResult = {
  sent: number;
  device_tokens: number;
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
  userId?: string | null;
};

export type DataIssueFilters = PaginationFilters & {
  days?: number | null;
};

export type ChallengeListFilters = PaginationFilters & {
  status?: string | null;
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

export type TagSuggestionRow = {
  id: string;
  value: string;
  label: string;
  emoji: string;
  created_at: string;
  submitter_count: number;
  submitters: string | null;
  post_count: number;
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
    p_user_id: filters.userId || null,
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

export type AdminPostRaw = Record<string, unknown>;

export async function fetchAdminPost(postId: string): Promise<AdminPostRaw | null> {
  const { data, error } = await supabase.rpc('admin_get_post', {
    p_post_id: postId,
  });
  if (error) throw error;
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
  return data as AdminPostRaw;
}

export type AdminRawRow = Record<string, unknown>;

export type AdminPostEngagement = {
  comments: AdminRawRow[];
  kudos: AdminRawRow[];
  commentLikes: AdminRawRow[];
  usernames: Record<string, string>;
};

export async function fetchAdminPostEngagement(postId: string): Promise<AdminPostEngagement> {
  const [commentsRes, kudosRes] = await Promise.all([
    supabase.from('comments').select('*').eq('post_id', postId).order('created_at', { ascending: true }),
    supabase.from('kudos').select('*').eq('post_id', postId).order('created_at', { ascending: true }),
  ]);
  if (commentsRes.error) throw commentsRes.error;
  if (kudosRes.error) throw kudosRes.error;
  const comments = (commentsRes.data ?? []) as AdminRawRow[];
  const kudos = (kudosRes.data ?? []) as AdminRawRow[];

  const commentIds = comments.map((c) => String(c.id));
  let commentLikes: AdminRawRow[] = [];
  if (commentIds.length > 0) {
    const { data, error } = await supabase.from('comment_likes').select('*').in('comment_id', commentIds);
    if (error) throw error;
    commentLikes = (data ?? []) as AdminRawRow[];
  }

  const userIds = [...new Set(
    [...comments, ...kudos, ...commentLikes]
      .map((r) => (typeof r.user_id === 'string' ? r.user_id : ''))
      .filter(Boolean),
  )];
  const usernames: Record<string, string> = {};
  if (userIds.length > 0) {
    const { data, error } = await supabase.from('profiles').select('id, username').in('id', userIds);
    if (error) throw error;
    for (const p of data ?? []) usernames[p.id] = p.username;
  }

  return { comments, kudos, commentLikes, usernames };
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

function adminTagError(error: { message?: string }): Error {
  const message = error.message ?? '';
  if (message.includes('emoji_taken')) {
    return new Error('That emoji is already used by another tag.');
  }
  return error instanceof Error ? error : new Error(message || 'Could not save tag.');
}

export async function upsertAdminTag(tag: TagDraft): Promise<void> {
  const { error } = await supabase.rpc('admin_upsert_tag', {
    p_value: tag.value,
    p_emoji: tag.emoji,
    p_label: tag.label,
    p_sort_order: tag.sort_order,
  });
  if (error) throw adminTagError(error);
}

export async function deleteAdminTag(value: string): Promise<void> {
  const { error } = await supabase.rpc('admin_delete_tag', { p_value: value });
  if (error) throw error;
}

export async function fetchAdminTagSuggestions(): Promise<TagSuggestionRow[]> {
  const { data, error } = await supabase.rpc('admin_list_tag_suggestions');
  if (error) throw error;
  return (data ?? []) as TagSuggestionRow[];
}

export async function approveAdminTagSuggestion(id: string, tag: TagDraft): Promise<void> {
  const { error } = await supabase.rpc('admin_approve_tag_suggestion', {
    p_id: id,
    p_value: tag.value,
    p_emoji: tag.emoji,
    p_label: tag.label,
    p_sort_order: tag.sort_order,
  });
  if (error) throw adminTagError(error);
}

export async function denyAdminTagSuggestion(id: string): Promise<void> {
  const { error } = await supabase.rpc('admin_deny_tag_suggestion', { p_id: id });
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
    p_max_posts: filters.maxPosts ?? null,
    p_inactive_days: filters.inactiveDays ?? null,
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

/** Matches admin_grant_role_to_users. Pasted lists above this are rejected. */
export const ROLE_GRANT_BATCH_LIMIT = 200;

export type RoleGrantUser = {
  id: string;
  username: string;
  email: string | null;
};

export type RoleGrantResult = {
  added: RoleGrantUser[];
  already: RoleGrantUser[];
  missing: string[];
};

/** Usernames and emails, split on commas or whitespace. Strips a leading @. */
export function parseRoleGrantIdentifiers(text: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of text.split(/[\s,]+/)) {
    let token = part.trim().toLowerCase();
    if (token.startsWith('@')) token = token.slice(1).trim();
    if (!token || seen.has(token)) continue;
    seen.add(token);
    out.push(token);
  }
  return out;
}

export function mergeRoleGrantIdentifiers(...groups: string[][]): string[] {
  return parseRoleGrantIdentifiers(groups.flat().join('\n'));
}

export type RoleMember = {
  id: string;
  username: string;
  email: string | null;
};

export type RoleMemberList = {
  total: number;
  truncated: boolean;
  rows: RoleMember[];
};

/** People in `members` whose username or email is in `identifiers`. */
export function roleMembersInIdentifiers(members: RoleMember[], identifiers: string[]): RoleMember[] {
  const wanted = new Set(identifiers.map((id) => id.trim().toLowerCase()).filter(Boolean));
  return members.filter((member) => {
    const username = member.username.trim().toLowerCase();
    const email = member.email?.trim().toLowerCase() ?? '';
    return wanted.has(username) || (email !== '' && wanted.has(email));
  });
}

export async function fetchAdminRoleMembers(roleKey: string): Promise<RoleMemberList> {
  const { data, error } = await supabase.rpc('admin_list_role_members', {
    p_role: roleKey,
  });
  if (error) throw error;
  const raw = (data ?? {}) as Partial<RoleMemberList>;
  const rows = Array.isArray(raw.rows) ? raw.rows.filter((row) => row && typeof row.id === 'string' && typeof row.username === 'string') : [];
  return {
    total: Number(raw.total ?? rows.length),
    truncated: Boolean(raw.truncated),
    rows: rows.map((row) => ({
      id: row.id,
      username: row.username,
      email: row.email ?? null,
    })),
  };
}

export function roleMembersErrorMessage(err: unknown): string {
  if (
    err
    && typeof err === 'object'
    && 'message' in err
    && isMissingAdminRpc(err as PostgrestError, 'admin_list_role_members')
  ) {
    return `The current member list is not available yet. ${ADMIN_MIGRATION_HINT}`;
  }
  const message = err && typeof err === 'object' && 'message' in err
    ? String((err as { message: unknown }).message)
    : err instanceof Error
      ? err.message
      : '';
  if (message.includes('not_authorized')) return 'You need an admin role to see who has this role.';
  if (message.includes('invalid_role')) return 'That role no longer exists. Refresh and try again.';
  return message || 'Could not load who already has this role.';
}

export async function grantRoleToUsers(
  roleKey: string,
  identifiers: string[],
): Promise<RoleGrantResult> {
  const { data, error } = await supabase.rpc('admin_grant_role_to_users', {
    p_role: roleKey,
    p_identifiers: identifiers,
  });
  if (error) throw error;
  const raw = (data ?? {}) as Partial<RoleGrantResult>;
  return {
    added: Array.isArray(raw.added) ? raw.added : [],
    already: Array.isArray(raw.already) ? raw.already : [],
    missing: Array.isArray(raw.missing) ? raw.missing : [],
  };
}

export function roleGrantErrorMessage(err: unknown): string {
  if (
    err
    && typeof err === 'object'
    && 'message' in err
    && isMissingAdminRpc(err as PostgrestError, 'admin_grant_role_to_users')
  ) {
    return `Batch add is not available yet. ${ADMIN_MIGRATION_HINT}`;
  }
  const message = err && typeof err === 'object' && 'message' in err
    ? String((err as { message: unknown }).message)
    : err instanceof Error
      ? err.message
      : '';
  if (message.includes('not_authorized')) return 'You need an admin role to add users.';
  if (message.includes('invalid_role')) return 'That role no longer exists. Refresh and try again.';
  if (message.includes('too_many_users')) {
    return `Add at most ${ROLE_GRANT_BATCH_LIMIT} people at a time.`;
  }
  if (message.includes('no_users')) return 'Add at least one username or email.';
  return message || 'Could not add users to this role.';
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

export async function fetchTopInviters(range: HealthMetricsRange): Promise<AdminTopInviter[]> {
  const { data, error } = await supabase.rpc('admin_get_top_inviters', {
    p_start: range.start,
    p_end: range.end,
  });
  if (error) throw error;
  return Array.isArray(data) ? data as AdminTopInviter[] : [];
}

export async function fetchHealthMetrics(range: HealthMetricsRange): Promise<HealthMetrics> {
  const { data, error } = await supabase.rpc('admin_get_health_metrics', {
    p_start: range.start,
    p_end: range.end,
  });
  if (error) throw error;
  return data as HealthMetrics;
}

export async function fetchCommunityMetrics(): Promise<CommunityMetrics> {
  const { data, error } = await supabase.rpc('admin_get_community_metrics');
  if (error) throw error;
  return data as CommunityMetrics;
}

export async function fetchAdminChallenges(
  filters: ChallengeListFilters = {},
): Promise<PaginatedResult<AdminChallengeRow>> {
  const pageSize = resolvePageSize(filters.pageSize, filters.limit, 25);
  const page = filters.page ?? 0;
  const { data, error } = await supabase.rpc('admin_list_challenges', {
    p_limit: pageSize,
    p_offset: resolvePageOffset(page, pageSize),
    p_status: filters.status || null,
  });
  if (error) throw error;
  return parsePaginatedResult<AdminChallengeRow>(data);
}

export async function fetchAdminClubs(
  filters: PaginationFilters = {},
): Promise<PaginatedResult<AdminClubRow>> {
  const pageSize = resolvePageSize(filters.pageSize, filters.limit, 25);
  const page = filters.page ?? 0;
  const { data, error } = await supabase.rpc('admin_list_clubs', {
    p_limit: pageSize,
    p_offset: resolvePageOffset(page, pageSize),
  });
  if (error) throw error;
  return parsePaginatedResult<AdminClubRow>(data);
}

export async function fetchAdminClubRoster(clubId: string): Promise<AdminClubRoster> {
  const { data, error } = await supabase.rpc('admin_get_club_roster', {
    p_club_id: clubId,
  });
  if (error) throw error;
  return data as AdminClubRoster;
}

export type AdminSlumberChallengeRow = {
  id: string;
  title: string | null;
  description?: string | null;
  status: string;
  goal_minutes: number;
  no_expiration: boolean;
  expiration_days: number;
  started_at: string | null;
  expires_at: string | null;
  participant_count: number;
  max_participants: number | null;
  join_enabled: boolean;
  created_at: string;
  is_drawing?: boolean;
  drawing_referrals?: boolean;
  drawing_entry_config?: Array<{
    kind: 'goal' | 'referral';
    enabled: boolean;
    entries: number;
    max: number;
  }> | null;
  prize_sponsor_name?: string | null;
  prize_name?: string | null;
  prize_url?: string | null;
  prize_extra_urls?: string[] | null;
  prize_logo_url?: string | null;
  prize_image_url?: string | null;
  official_rules?: string | null;
  official_rules_url?: string | null;
};

export type AdminSlumberChallengeDraft = {
  title: string;
  description?: string | null;
  goalMinutes: number;
  noExpiration: boolean;
  expirationDays: number;
  expiresAt: string | null;
  maxParticipants: number | null;
  joinEnabled: boolean;
  isDrawing?: boolean;
  drawingReferrals?: boolean;
  drawingEntryConfig?: Array<{
    kind: 'goal' | 'referral';
    enabled: boolean;
    entries: number;
    max: number;
  }> | null;
  prizeSponsorName?: string | null;
  prizeName?: string | null;
  prizeUrl?: string | null;
  prizeExtraUrls?: string[] | null;
  prizeLogoUrl?: string | null;
  prizeImageUrl?: string | null;
  officialRules?: string | null;
  officialRulesUrl?: string | null;
};

export type AdminDrawingRosterRow = {
  user_id: string;
  username: string;
  email: string | null;
  accrued_minutes: number;
  referred_by: string | null;
  referred_by_username: string | null;
  drawing_attested_at: string | null;
  drawing_ineligible_at: string | null;
  drawing_alternate_entry: boolean;
  drawing_alternate_entries: number;
  joined_at: string | null;
  entries: number;
  referrals_joined: number;
  referrals_qualified: number;
};

export type AdminDrawingRoster = {
  challengeId: string;
  isDrawing: boolean;
  goalMinutes: number;
  joined: number;
  qualified: number;
  totalEntries: number;
  referralJoins: number;
  rows: AdminDrawingRosterRow[];
};

export async function fetchAdminSlumberChallenges(
  filters: ChallengeListFilters = {},
): Promise<PaginatedResult<AdminSlumberChallengeRow>> {
  const pageSize = resolvePageSize(filters.pageSize, filters.limit, 25);
  const page = filters.page ?? 0;
  const { data, error } = await supabase.rpc('admin_list_slumber_challenges', {
    p_limit: pageSize,
    p_offset: resolvePageOffset(page, pageSize),
    p_status: filters.status || null,
  });
  if (error) throw error;
  return parsePaginatedResult<AdminSlumberChallengeRow>(data);
}

export async function createAdminSlumberChallenge(input: {
  title: string;
  description?: string | null;
  goalMinutes: number;
  noExpiration: boolean;
  expiresInDays: number;
  maxParticipants: number | null;
  isDrawing?: boolean;
  drawingReferrals?: boolean;
  drawingEntryConfig?: Array<{
    kind: 'goal' | 'referral';
    enabled: boolean;
    entries: number;
    max: number;
  }> | null;
  prizeSponsorName?: string | null;
  prizeName?: string | null;
  prizeUrl?: string | null;
  prizeExtraUrls?: string[] | null;
  prizeLogoUrl?: string | null;
  prizeImageUrl?: string | null;
  officialRules?: string | null;
  officialRulesUrl?: string | null;
}): Promise<{ id: string; title: string }> {
  const { data, error } = await supabase.rpc('admin_create_slumber_challenge', {
    p_title: input.title,
    p_goal_minutes: input.goalMinutes,
    p_no_expiration: input.noExpiration,
    p_expires_in_days: input.expiresInDays,
    p_max_participants: input.maxParticipants,
    p_description: input.description?.trim() || null,
    p_is_drawing: Boolean(input.isDrawing),
    p_prize_sponsor_name: input.prizeSponsorName?.trim() || null,
    p_prize_name: input.prizeName?.trim() || null,
    p_prize_url: input.prizeUrl?.trim() || null,
    p_prize_extra_urls: input.prizeExtraUrls?.length ? input.prizeExtraUrls : null,
    p_prize_logo_url: input.prizeLogoUrl?.trim() || null,
    p_prize_image_url: input.prizeImageUrl?.trim() || null,
    p_official_rules: input.officialRules?.trim() || null,
    p_official_rules_url: input.officialRulesUrl?.trim() || null,
  });
  if (error) throw error;
  const row = (data ?? {}) as { id?: string; title?: string };
  if (!row.id) throw new Error('Could not create the race.');
  await setAdminDrawingReferrals(row.id, Boolean(input.isDrawing && input.drawingReferrals));
  if (input.isDrawing) {
    await setAdminDrawingEntryConfig(row.id, input.drawingEntryConfig ?? null);
  }
  return { id: row.id, title: row.title ?? input.title };
}

export async function startAdminSlumberChallenge(challengeId: string): Promise<void> {
  const { error } = await supabase.rpc('admin_start_slumber_challenge', {
    p_challenge_id: challengeId,
  });
  if (error) throw error;
}

export async function updateAdminSlumberChallenge(
  challengeId: string,
  draft: AdminSlumberChallengeDraft,
): Promise<void> {
  const { error } = await supabase.rpc('admin_update_slumber_challenge', {
    p_challenge_id: challengeId,
    p_title: draft.title,
    p_goal_minutes: draft.goalMinutes,
    p_no_expiration: draft.noExpiration,
    p_expiration_days: draft.expirationDays,
    p_expires_at: draft.expiresAt,
    p_max_participants: draft.maxParticipants,
    p_join_enabled: draft.joinEnabled,
    p_description: draft.description?.trim() ?? '',
    p_is_drawing: draft.isDrawing ?? false,
    p_prize_sponsor_name: draft.prizeSponsorName?.trim() || null,
    p_prize_name: draft.prizeName?.trim() || null,
    p_prize_url: draft.prizeUrl?.trim() || null,
    p_prize_extra_urls: draft.prizeExtraUrls ?? [],
    p_prize_logo_url: draft.prizeLogoUrl?.trim() || null,
    p_prize_image_url: draft.prizeImageUrl?.trim() || null,
    p_official_rules: draft.officialRules ?? '',
    p_official_rules_url: draft.officialRulesUrl?.trim() || null,
  });
  if (error) throw error;
  await setAdminDrawingReferrals(challengeId, Boolean(draft.isDrawing && draft.drawingReferrals));
  if (draft.isDrawing) {
    await setAdminDrawingEntryConfig(challengeId, draft.drawingEntryConfig ?? null);
  }
}

export async function setAdminDrawingReferrals(
  challengeId: string,
  enabled: boolean,
): Promise<void> {
  const { error } = await supabase.rpc('admin_set_drawing_referrals', {
    p_challenge_id: challengeId,
    p_enabled: enabled,
  });
  if (error) throw error;
}

export async function setAdminDrawingEntryConfig(
  challengeId: string,
  config: AdminSlumberChallengeDraft['drawingEntryConfig'],
): Promise<void> {
  const { error } = await supabase.rpc('admin_set_drawing_entry_config', {
    p_challenge_id: challengeId,
    p_config: config ?? [],
  });
  if (error) throw error;
}

function mentionsAdminRpc(err: unknown, rpcName: string): boolean {
  if (!err || typeof err !== 'object' || !('message' in err)) return false;
  const pg = err as PostgrestError;
  return isMissingAdminRpc(pg, rpcName) && new RegExp(rpcName, 'i').test(pg.message ?? '');
}

export function slumberChallengeErrorMessage(err: unknown, fallback: string): string {
  if (mentionsAdminRpc(err, 'admin_list_slumber_challenges')) {
    return `Slumber challenges are not available yet. ${ADMIN_MIGRATION_HINT}`;
  }
  if (mentionsAdminRpc(err, 'admin_update_slumber_challenge')) {
    return `Editing Slumber challenges is not available yet. ${ADMIN_MIGRATION_HINT}`;
  }
  const message = adminErrorMessage(err, fallback);
  if (message.includes('invalid_title')) return 'Title must be 1–80 characters.';
  if (message.includes('invalid_description')) return 'Description must be 280 characters or fewer.';
  if (message.includes('invalid_goal')) return 'Goal must be between 10 and 100 hours.';
  if (message.includes('invalid_expiration_days')) return 'Duration must be between 1 and 100 days.';
  if (message.includes('invalid_window')) return 'The end date has to be after the challenge started.';
  if (message.includes('invalid_max_participants')) return 'Max participants must be between 2 and 10,000, or left blank.';
  if (message.includes('not_slumber_challenge')) return 'That challenge is not hosted by Slumber.';
  if (message.includes('challenge_not_pending')) return 'That challenge has already started.';
  if (message.includes('challenge_not_endable')) return 'That challenge has already finished.';
  if (message.includes('not_authorized')) return 'You need an admin role to edit challenges.';
  if (message.includes('invalid_prize_sponsor')) return 'Sponsor name must be 80 characters or fewer.';
  if (message.includes('invalid_prize_name')) return 'Prize name must be 120 characters or fewer.';
  if (message.includes('invalid_official_rules')) return 'Official rules must be 20,000 characters or fewer.';
  if (message.includes('invalid_prize_url') || message.includes('invalid_prize_logo') || message.includes('invalid_prize_image') || message.includes('invalid_official_rules_url') || message.includes('invalid_prize_extra_urls')) {
    return 'Prize and rules links must be https:// URLs.';
  }
  if (message.includes('drawing_locked')) return 'Drawing vs race can only be changed before Start.';
  if (message.includes('attestation_required')) return 'That person still needs to agree to the official rules.';
  if (message.includes('not_drawing')) return 'That challenge is not a drawing.';
  if (message.includes('invalid_alternate_entries')) return 'AMOE entries must be between 0 and 100.';
  return message;
}

export async function fetchAdminDrawingRoster(challengeId: string): Promise<AdminDrawingRoster> {
  const { data, error } = await supabase.rpc('admin_list_drawing_roster', {
    p_challenge_id: challengeId,
  });
  if (error) throw error;
  const row = (data ?? {}) as AdminDrawingRoster;
  return {
    challengeId: row.challengeId ?? challengeId,
    isDrawing: Boolean(row.isDrawing),
    goalMinutes: Number(row.goalMinutes ?? 0),
    joined: Number(row.joined ?? 0),
    qualified: Number(row.qualified ?? 0),
    totalEntries: Number(row.totalEntries ?? 0),
    referralJoins: Number(row.referralJoins ?? 0),
    rows: Array.isArray(row.rows) ? row.rows : [],
  };
}

export async function setAdminDrawingParticipant(
  challengeId: string,
  userId: string,
  patch: { ineligible?: boolean; alternateEntries?: number },
): Promise<void> {
  const { error } = await supabase.rpc('admin_set_drawing_participant', {
    p_challenge_id: challengeId,
    p_user_id: userId,
    p_ineligible: patch.ineligible ?? null,
    p_alternate_entries: patch.alternateEntries ?? null,
  });
  if (error) throw error;
}

export async function adminCancelChallenge(challengeId: string): Promise<void> {
  const { error } = await supabase.rpc('admin_cancel_challenge', {
    p_challenge_id: challengeId,
  });
  if (error) throw error;
}

export async function fetchDataIssues(
  filters: DataIssueFilters = {},
): Promise<PaginatedResult<DataIssueRow>> {
  const pageSize = resolvePageSize(filters.pageSize, filters.limit, 25);
  const page = filters.page ?? 0;
  const { data, error } = await supabase.rpc('admin_list_data_issues', {
    p_limit: pageSize,
    p_offset: resolvePageOffset(page, pageSize),
    p_days: filters.days ?? null,
  });
  if (error) throw error;
  return parsePaginatedResult<DataIssueRow>(data);
}

export async function fetchAdminUserDetail(userId: string): Promise<AdminUserDetail> {
  const { data, error } = await supabase.rpc('admin_get_user_detail', {
    p_user_id: userId,
  });
  if (error) throw error;
  return data as AdminUserDetail;
}

export async function fetchAdminUserConnections(userId: string): Promise<AdminUserConnections> {
  const { data, error } = await supabase.rpc('admin_get_user_connections', {
    p_user_id: userId,
  });
  if (error) throw error;
  return normalizeAdminUserConnections(data);
}

function asConnectionList<T>(value: unknown): AdminConnectionList<T> {
  if (value && typeof value === 'object' && 'rows' in value) {
    const row = value as { total?: unknown; rows?: unknown };
    return {
      total: typeof row.total === 'number' ? row.total : Array.isArray(row.rows) ? row.rows.length : 0,
      rows: Array.isArray(row.rows) ? (row.rows as T[]) : [],
    };
  }
  return { total: 0, rows: [] };
}

function normalizeAdminUserConnections(data: unknown): AdminUserConnections {
  const row = (data && typeof data === 'object' ? data : {}) as Record<string, unknown>;
  const challenges = asConnectionList<AdminUserChallengeRow>(row.challenges);
  return {
    friends: asConnectionList<AdminUserFriendRow>(row.friends),
    pending_friends: asConnectionList<AdminPendingFriendRow>(row.pending_friends),
    clubs: asConnectionList<AdminUserClubRow>(row.clubs),
    challenges: {
      ...challenges,
      rows: challenges.rows.map((challenge) => ({
        ...challenge,
        others: Array.isArray(challenge.others) ? challenge.others : [],
        is_group: Boolean(challenge.is_group),
      })),
    },
  };
}

export async function resetUserStreak(userId: string): Promise<AdminUserOpResult> {
  const { data, error } = await supabase.rpc('admin_reset_user_streak', {
    p_user_id: userId,
  });
  if (error) throw error;
  return data as AdminUserOpResult;
}

export async function setUserSuspended(
  userId: string,
  suspended: boolean,
): Promise<AdminUserOpResult> {
  const { data, error } = await supabase.rpc('admin_set_user_suspended', {
    p_user_id: userId,
    p_suspended: suspended,
  });
  if (error) throw error;
  return data as AdminUserOpResult;
}

export async function deleteAdminUserAccount(userId: string): Promise<void> {
  const { error } = await supabase.rpc('admin_delete_account', {
    p_user_id: userId,
  });
  if (error) throw error;
}

export async function broadcastAdminNotification(
  message: string,
  options: {
    role?: string | null;
    joinedWithinDays?: number | null;
    limit?: number;
  } = {},
): Promise<BroadcastNotificationResult> {
  const { data, error } = await supabase.rpc('admin_broadcast_notification', {
    p_message: message,
    p_role: options.role || null,
    p_joined_within_days: options.joinedWithinDays ?? null,
    p_limit: options.limit ?? 500,
  });
  if (error) throw error;
  const row = data as BroadcastNotificationResult | null;
  return row ?? { sent: 0, device_tokens: 0 };
}

export const ADMIN_CAMPAIGN_ACTION_KINDS = ['challenge', 'message', 'url'] as const;

export type AdminCampaignActionKind = (typeof ADMIN_CAMPAIGN_ACTION_KINDS)[number];

export function defaultAdminCampaignCta(kind: AdminCampaignActionKind): string {
  if (kind === 'message') return 'Got it';
  if (kind === 'url') return 'Open';
  return 'Join';
}

export type AdminCampaignRow = {
  id: string;
  title: string;
  body: string;
  emoji: string | null;
  cta_label: string;
  action_kind?: AdminCampaignActionKind | null;
  challenge_id: string | null;
  challenge_title: string | null;
  join_token: string | null;
  cta_url?: string | null;
  image_url?: string | null;
  open_link_enabled: boolean | null;
  challenge_status: string | null;
  hosted_by?: string | null;
  target_roles: string[];
  starts_at: string | null;
  ends_at: string | null;
  enabled: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
  goal_minutes?: number | null;
  challenge_started_at?: string | null;
  challenge_expires_at?: string | null;
  no_expiration?: boolean | null;
  max_participants?: number | null;
};

export type AdminCampaignDraft = {
  id?: string | null;
  title: string;
  body: string;
  emoji: string;
  cta_label: string;
  action_kind: AdminCampaignActionKind;
  challenge_id: string;
  cta_url: string;
  image_url: string;
  target_roles: string[];
  starts_at: string | null;
  ends_at: string | null;
  enabled: boolean;
  priority: number;
};

export async function fetchAdminCampaigns(): Promise<AdminCampaignRow[]> {
  const { data, error } = await supabase.rpc('admin_list_app_campaigns');
  if (error) throw error;
  return (data ?? []) as AdminCampaignRow[];
}

export async function upsertAdminCampaign(draft: AdminCampaignDraft): Promise<string> {
  const { data, error } = await supabase.rpc('admin_upsert_app_campaign', {
    p_id: draft.id || null,
    p_title: draft.title,
    p_body: draft.body,
    p_emoji: draft.emoji || null,
    p_cta_label: draft.cta_label || defaultAdminCampaignCta(draft.action_kind),
    p_challenge_id: draft.action_kind === 'challenge' ? draft.challenge_id || null : null,
    p_target_roles: draft.target_roles,
    p_starts_at: draft.starts_at,
    p_ends_at: draft.ends_at,
    p_enabled: draft.enabled,
    p_priority: draft.priority,
    p_action_kind: draft.action_kind,
    p_cta_url: draft.action_kind === 'url' ? draft.cta_url || null : null,
    p_image_url: draft.image_url.trim() || null,
  });
  if (error) throw error;
  return data as string;
}

export const CAMPAIGN_IMAGE_BUCKET = 'campaign-images';

export async function uploadAdminCampaignImage(file: File): Promise<string> {
  const { data: sessionData } = await supabase.auth.getUser();
  const userId = sessionData.user?.id;
  if (!userId) throw new Error('not_authenticated');
  if (!file.type.startsWith('image/')) throw new Error('image_required');
  if (file.size > 5 * 1024 * 1024) throw new Error('image_too_large');

  const ext = file.name.split('.').pop()?.toLowerCase() === 'png'
    ? 'png'
    : file.name.split('.').pop()?.toLowerCase() === 'webp'
      ? 'webp'
      : 'jpg';
  const path = `${userId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from(CAMPAIGN_IMAGE_BUCKET).upload(path, file, {
    contentType: file.type || `image/${ext === 'jpg' ? 'jpeg' : ext}`,
    upsert: false,
  });
  if (error) throw error;
  return supabase.storage.from(CAMPAIGN_IMAGE_BUCKET).getPublicUrl(path).data.publicUrl;
}

export async function endAdminSlumberChallenge(challengeId: string): Promise<void> {
  const { error } = await supabase.rpc('admin_end_slumber_challenge', {
    p_challenge_id: challengeId,
  });
  if (error) throw error;
}

export async function setAdminCampaignEnabled(id: string, enabled: boolean): Promise<void> {
  const { error } = await supabase.rpc('admin_set_app_campaign_enabled', {
    p_id: id,
    p_enabled: enabled,
  });
  if (error) throw error;
}

export async function deleteAdminCampaign(id: string): Promise<void> {
  const { error } = await supabase.rpc('admin_delete_app_campaign', { p_id: id });
  if (error) throw error;
}

export type AppUpdatePlatform = 'ios' | 'android';

export type AppUpdatePolicyRow = {
  platform: AppUpdatePlatform;
  min_version: string | null;
  is_blocking: boolean;
  message: string | null;
  image_url: string | null;
  enabled: boolean;
  updated_at: string;
};

export async function fetchAppUpdatePolicies(): Promise<AppUpdatePolicyRow[]> {
  const { data, error } = await supabase.rpc('admin_get_app_update_policy');
  if (error) throw error;
  const rows = (data as AppUpdatePolicyRow[] | null) ?? [];
  return rows.filter((row) => row.platform === 'ios' || row.platform === 'android');
}

export async function upsertAppUpdatePolicy(input: {
  platform: AppUpdatePlatform;
  minVersion: string | null;
  isBlocking: boolean;
  message: string | null;
  imageUrl: string | null;
  enabled: boolean;
}): Promise<void> {
  const { error } = await supabase.rpc('admin_upsert_app_update_policy', {
    p_platform: input.platform,
    p_min_version: input.minVersion,
    p_is_blocking: input.isBlocking,
    p_message: input.message,
    p_image_url: input.imageUrl,
    p_enabled: input.enabled,
  });
  if (error) throw error;
}
