import { useIsFetching, useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import {
  deleteAdminRoleDefinition,
  deleteAdminTag,
  fetchAdminRoleDefinitions,
  fetchAdminTags,
  fetchAnalyticsMetrics,
  fetchAppVersions,
  fetchCommentReports,
  fetchCommentReportsQueue,
  fetchDailyActivity,
  fetchDashboardMetrics,
  fetchPostReports,
  fetchPostReportsQueue,
  fetchPremiumMetrics,
  fetchPremiumUsers,
  fetchRecentPosts,
  fetchRecentUsers,
  searchAdminUsers,
  sendAdminNotification,
  updateUserPremium,
  updateUserRoles,
  upsertAdminRoleDefinition,
  upsertAdminTag,
  dismissPostReports,
  dismissCommentReports,
  adminSoftDeletePost,
  adminDeleteComment,
  checkIsModerator,
  formatAdminRpcError,
  recalculateSleepPostStages,
  recalculateSleepPostStagesBulk,
  repairDoubledSleepPostStages,
  repairDoubledSleepPostStagesBulk,
  broadcastAdminNotification,
  adminCancelChallenge,
  fetchAdminChallenges,
  fetchAdminClubs,
  fetchAdminUserDetail,
  fetchCohortRetention,
  fetchCommunityMetrics,
  fetchDataIssues,
  fetchHealthMetrics,
  repairInflatedStages,
  resetUserStreak,
  setUserSuspended,
  type AnalyticsFilters,
  type TagDraft,
  type ChallengeListFilters,
  type DataIssueFilters,
  type RoleDefinitionDraft,
  type PremiumUserFilters,
  type ReportListFilters,
  type UserSearchFilters,
  type CatalogListFilters,
} from '../lib/admin';
import {
  ADMIN_CATALOG_STALE_MS,
  ADMIN_QUERY_GC_MS,
  ADMIN_QUERY_STALE_MS,
  ADMIN_REPORTS_STALE_MS,
} from '../lib/adminQueryCache';
import type { PaginationFilters } from '../lib/adminPagination';
import { clearTagsCache } from '../lib/tags';
import { clearRoleDefinitionCache } from '../lib/userRoles';
import { queryKeys } from './queryKeys';

const adminQueryOptions = {
  staleTime: ADMIN_QUERY_STALE_MS,
  gcTime: ADMIN_QUERY_GC_MS,
} as const;

const catalogQueryOptions = {
  staleTime: ADMIN_CATALOG_STALE_MS,
  gcTime: ADMIN_QUERY_GC_MS,
} as const;

export function useIsModerator(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.isModerator,
    queryFn: checkIsModerator,
    enabled,
    staleTime: ADMIN_CATALOG_STALE_MS,
    gcTime: ADMIN_QUERY_GC_MS,
  });
}

export function useDashboardMetrics(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.admin.dashboard,
    queryFn: fetchDashboardMetrics,
    enabled,
    ...adminQueryOptions,
  });
}

export function useAdminRefreshing() {
  return useIsFetching({ queryKey: queryKeys.admin.all }) > 0;
}

export function useAdminRefresh() {
  const qc = useQueryClient();
  const refreshing = useAdminRefreshing();

  const triggerRefresh = useCallback(() => {
    void qc.invalidateQueries({ queryKey: queryKeys.admin.all });
  }, [qc]);

  const refreshMetrics = useCallback(async () => {
    await qc.invalidateQueries({ queryKey: queryKeys.admin.dashboard });
  }, [qc]);

  return { triggerRefresh, refreshMetrics, refreshing };
}

export function usePostReportsQueue() {
  return useQuery({
    queryKey: queryKeys.admin.postReportsQueue,
    queryFn: fetchPostReportsQueue,
    staleTime: ADMIN_REPORTS_STALE_MS,
    gcTime: ADMIN_QUERY_GC_MS,
  });
}

export function useCommentReportsQueue() {
  return useQuery({
    queryKey: queryKeys.admin.commentReportsQueue,
    queryFn: fetchCommentReportsQueue,
    staleTime: ADMIN_REPORTS_STALE_MS,
    gcTime: ADMIN_QUERY_GC_MS,
  });
}

export function usePostReportsPage(filters: ReportListFilters, enabled = true) {
  return useQuery({
    queryKey: queryKeys.admin.postReportsPage(filters),
    queryFn: () => fetchPostReports(filters),
    enabled,
    placeholderData: (previous) => previous,
    staleTime: ADMIN_REPORTS_STALE_MS,
    gcTime: ADMIN_QUERY_GC_MS,
  });
}

export function useCommentReportsPage(filters: ReportListFilters, enabled = true) {
  return useQuery({
    queryKey: queryKeys.admin.commentReportsPage(filters),
    queryFn: () => fetchCommentReports(filters),
    enabled,
    placeholderData: (previous) => previous,
    staleTime: ADMIN_REPORTS_STALE_MS,
    gcTime: ADMIN_QUERY_GC_MS,
  });
}

function invalidateReportQueries(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: ['admin', 'post-reports'] });
  void qc.invalidateQueries({ queryKey: ['admin', 'comment-reports'] });
  void qc.invalidateQueries({ queryKey: queryKeys.admin.dashboard });
}

export function useDismissPostReports() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (postId: string) => dismissPostReports(postId),
    onSuccess: () => invalidateReportQueries(qc),
  });
}

export function useDismissCommentReports() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (commentId: string) => dismissCommentReports(commentId),
    onSuccess: () => invalidateReportQueries(qc),
  });
}

export function useAdminSoftDeletePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (postId: string) => adminSoftDeletePost(postId),
    onSuccess: () => invalidateReportQueries(qc),
  });
}

export function useAdminDeleteComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (commentId: string) => adminDeleteComment(commentId),
    onSuccess: () => invalidateReportQueries(qc),
  });
}

export function useAdminTagsCatalog(filters: CatalogListFilters = {}) {
  return useQuery({
    queryKey: queryKeys.admin.tags(filters),
    queryFn: () => fetchAdminTags(filters),
    ...catalogQueryOptions,
  });
}

export function useAdminRoleDefinitions(filters: CatalogListFilters = {}) {
  return useQuery({
    queryKey: queryKeys.admin.roleDefinitions(filters),
    queryFn: () => fetchAdminRoleDefinitions(filters),
    ...catalogQueryOptions,
  });
}

export function useAppVersions() {
  return useQuery({
    queryKey: queryKeys.admin.appVersions,
    queryFn: fetchAppVersions,
    ...catalogQueryOptions,
  });
}

export function useAdminUserSearch(filters: UserSearchFilters, enabled = true) {
  return useQuery({
    queryKey: queryKeys.admin.userSearch(filters),
    queryFn: () => searchAdminUsers(filters),
    enabled,
    placeholderData: (previous) => previous,
    ...adminQueryOptions,
  });
}

export function useAdminRecentUsers(filters: AnalyticsFilters) {
  return useQuery({
    queryKey: queryKeys.admin.analyticsUsers(filters),
    queryFn: () => fetchRecentUsers(filters),
    placeholderData: (previous) => previous,
    ...adminQueryOptions,
  });
}

export function useAdminPostsPageData(filters: AnalyticsFilters) {
  const results = useQueries({
    queries: [
      {
        queryKey: queryKeys.admin.postsPageMetrics(filters),
        queryFn: () => fetchAnalyticsMetrics(filters),
        ...adminQueryOptions,
      },
      {
        queryKey: queryKeys.admin.postsPageActivity(filters),
        queryFn: () => fetchDailyActivity(filters),
        ...adminQueryOptions,
      },
      {
        queryKey: queryKeys.admin.recentPosts(filters),
        queryFn: () => fetchRecentPosts(filters),
        ...adminQueryOptions,
      },
    ],
  });

  const [metricsQ, activityQ, postsQ] = results;
  const loading = results.some((r) => r.isLoading);
  const fetching = results.some((r) => r.isFetching);

  let error: string | null = null;
  if (metricsQ.isError) {
    error = formatAdminRpcError('Metrics', metricsQ.error);
  } else if (activityQ.isError) {
    error = formatAdminRpcError('Daily activity', activityQ.error);
  } else if (postsQ.isError) {
    error = formatAdminRpcError('Posts', postsQ.error);
  }

  return {
    metrics: metricsQ.data ?? null,
    activity: activityQ.data ?? [],
    posts: postsQ.data?.rows ?? [],
    postsTotal: postsQ.data?.total ?? 0,
    loading,
    fetching,
    error,
  };
}

export function useAdminAnalyticsBundle(filters: AnalyticsFilters) {
  const tagFilters = useMemo(
    () => ({ ...filters, page: 0, pageSize: 100 }),
    [filters],
  );

  const results = useQueries({
    queries: [
      {
        queryKey: queryKeys.admin.analyticsMetrics(filters),
        queryFn: () => fetchAnalyticsMetrics(filters),
        ...adminQueryOptions,
      },
      {
        queryKey: queryKeys.admin.analyticsActivity(filters),
        queryFn: () => fetchDailyActivity(filters),
        ...adminQueryOptions,
      },
      {
        queryKey: queryKeys.admin.analyticsTags(tagFilters),
        queryFn: () => fetchAdminTags(tagFilters),
        ...catalogQueryOptions,
      },
    ],
  });

  const [metricsQ, activityQ, tagsQ] = results;

  const loading = results.some((r) => r.isLoading);
  const fetching = results.some((r) => r.isFetching);

  let error: string | null = null;
  if (metricsQ.isError) {
    error = formatAdminRpcError('Metrics', metricsQ.error);
  } else if (activityQ.isError) {
    error = formatAdminRpcError('Daily activity', activityQ.error);
  } else if (tagsQ.isError) {
    error = formatAdminRpcError('Tags', tagsQ.error);
  }

  const tags = tagsQ.data?.rows
    ? [...tagsQ.data.rows].sort((a, b) => b.usage_count - a.usage_count)
    : [];

  return {
    metrics: metricsQ.data ?? null,
    activity: activityQ.data ?? [],
    tags,
    loading,
    fetching,
    error,
  };
}

export function useUpsertAdminTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tag: TagDraft) => upsertAdminTag(tag),
    onSuccess: () => {
      clearTagsCache();
      void qc.invalidateQueries({ queryKey: ['admin', 'tags'] });
      void qc.invalidateQueries({ queryKey: ['admin', 'analytics', 'tags'] });
      void qc.invalidateQueries({ queryKey: queryKeys.tags });
    },
  });
}

export function useDeleteAdminTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (value: string) => deleteAdminTag(value),
    onSuccess: () => {
      clearTagsCache();
      void qc.invalidateQueries({ queryKey: ['admin', 'tags'] });
      void qc.invalidateQueries({ queryKey: ['admin', 'analytics', 'tags'] });
      void qc.invalidateQueries({ queryKey: queryKeys.tags });
    },
  });
}

export function useUpsertAdminRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (role: RoleDefinitionDraft) => upsertAdminRoleDefinition(role),
    onSuccess: () => {
      clearRoleDefinitionCache();
      void qc.invalidateQueries({ queryKey: ['admin', 'role-definitions'] });
      void qc.invalidateQueries({ queryKey: queryKeys.assignableRoles });
      void qc.invalidateQueries({ queryKey: queryKeys.avatarRoleStyles });
    },
  });
}

export function useDeleteAdminRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (key: string) => deleteAdminRoleDefinition(key),
    onSuccess: () => {
      clearRoleDefinitionCache();
      void qc.invalidateQueries({ queryKey: ['admin', 'role-definitions'] });
      void qc.invalidateQueries({ queryKey: queryKeys.assignableRoles });
      void qc.invalidateQueries({ queryKey: queryKeys.avatarRoleStyles });
    },
  });
}

export function useUpdateUserRoles() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, roles }: { userId: string; roles: string[] }) =>
      updateUserRoles(userId, roles),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'user-search'] });
      void qc.invalidateQueries({ queryKey: ['admin', 'analytics', 'users'] });
      void qc.invalidateQueries({ queryKey: queryKeys.admin.dashboard });
    },
  });
}

export function useUpdateUserPremium() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      userId,
      isPremium,
      premiumUntil,
    }: {
      userId: string;
      isPremium: boolean;
      premiumUntil: string | null;
    }) => updateUserPremium(userId, isPremium, premiumUntil),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'user-search'] });
      void qc.invalidateQueries({ queryKey: ['admin', 'analytics', 'users'] });
      void qc.invalidateQueries({ queryKey: queryKeys.admin.dashboard });
      void qc.invalidateQueries({ queryKey: queryKeys.admin.premiumMetrics });
      void qc.invalidateQueries({ queryKey: ['admin', 'premium', 'users'] });
    },
  });
}

export function usePremiumMetrics() {
  return useQuery({
    queryKey: queryKeys.admin.premiumMetrics,
    queryFn: fetchPremiumMetrics,
    ...adminQueryOptions,
  });
}

export function usePremiumUsers(filters: PremiumUserFilters, enabled = true) {
  return useQuery({
    queryKey: queryKeys.admin.premiumUsers(filters),
    queryFn: () => fetchPremiumUsers(filters),
    enabled,
    placeholderData: (previous) => previous,
    ...adminQueryOptions,
  });
}

export function useSendAdminNotification() {
  return useMutation({
    mutationFn: ({ userId, message }: { userId: string; message: string }) =>
      sendAdminNotification(userId, message),
  });
}

export function useRecalculateSleepPostStages() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (postId: string) => recalculateSleepPostStages(postId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'posts'] });
    },
  });
}

export function useRecalculateSleepPostStagesBulk() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (postIds: string[]) => recalculateSleepPostStagesBulk(postIds),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'posts'] });
    },
  });
}

export function useRepairDoubledSleepPostStages() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (postId: string) => repairDoubledSleepPostStages(postId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'posts'] });
    },
  });
}

export function useRepairDoubledSleepPostStagesBulk() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (postIds: string[]) => repairDoubledSleepPostStagesBulk(postIds),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'posts'] });
      void qc.invalidateQueries({ queryKey: ['admin', 'data-issues'] });
      void qc.invalidateQueries({ queryKey: queryKeys.admin.healthMetrics(7) });
    },
  });
}

export function useHealthMetrics(days = 7, enabled = true) {
  return useQuery({
    queryKey: queryKeys.admin.healthMetrics(days),
    queryFn: () => fetchHealthMetrics(days),
    enabled,
    ...adminQueryOptions,
  });
}

export function useCohortRetention(weeks = 8, enabled = true) {
  return useQuery({
    queryKey: queryKeys.admin.cohortRetention(weeks),
    queryFn: () => fetchCohortRetention(weeks),
    enabled,
    ...adminQueryOptions,
  });
}

export function useCommunityMetrics(enabled = true) {
  return useQuery({
    queryKey: queryKeys.admin.communityMetrics,
    queryFn: fetchCommunityMetrics,
    enabled,
    ...adminQueryOptions,
  });
}

export function useAdminChallenges(filters: ChallengeListFilters, enabled = true) {
  return useQuery({
    queryKey: queryKeys.admin.challenges(filters),
    queryFn: () => fetchAdminChallenges(filters),
    enabled,
    placeholderData: (previous) => previous,
    ...adminQueryOptions,
  });
}

export function useAdminClubs(filters: PaginationFilters, enabled = true) {
  return useQuery({
    queryKey: queryKeys.admin.clubs(filters),
    queryFn: () => fetchAdminClubs(filters),
    enabled,
    placeholderData: (previous) => previous,
    ...adminQueryOptions,
  });
}

export function useDataIssues(filters: DataIssueFilters, enabled = true) {
  return useQuery({
    queryKey: queryKeys.admin.dataIssues(filters),
    queryFn: () => fetchDataIssues(filters),
    enabled,
    placeholderData: (previous) => previous,
    ...adminQueryOptions,
  });
}

export function useAdminUserDetail(userId: string | null) {
  return useQuery({
    queryKey: queryKeys.admin.userDetail(userId ?? ''),
    queryFn: () => fetchAdminUserDetail(userId!),
    enabled: Boolean(userId),
    ...adminQueryOptions,
  });
}

export function useAdminUserPosts(filters: AnalyticsFilters, enabled = true) {
  return useQuery({
    queryKey: queryKeys.admin.userPosts(filters),
    queryFn: () => fetchRecentPosts(filters),
    enabled,
    ...adminQueryOptions,
  });
}

export function useResetUserStreak() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => resetUserStreak(userId),
    onSuccess: (_data, userId) => {
      void qc.invalidateQueries({ queryKey: queryKeys.admin.userDetail(userId) });
    },
  });
}

export function useSetUserSuspended() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, suspended }: { userId: string; suspended: boolean }) =>
      setUserSuspended(userId, suspended),
    onSuccess: (_data, { userId }) => {
      void qc.invalidateQueries({ queryKey: queryKeys.admin.userDetail(userId) });
      void qc.invalidateQueries({ queryKey: ['admin', 'user-search'] });
    },
  });
}

export function useRepairInflatedStages() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ limit, days }: { limit?: number; days?: number | null }) =>
      repairInflatedStages(limit, days),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'posts'] });
      void qc.invalidateQueries({ queryKey: ['admin', 'data-issues'] });
      void qc.invalidateQueries({ queryKey: ['admin', 'health'] });
    },
  });
}

export function useAdminCancelChallenge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (challengeId: string) => adminCancelChallenge(challengeId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'community'] });
      void qc.invalidateQueries({ queryKey: queryKeys.admin.dashboard });
    },
  });
}

export function useBroadcastAdminNotification() {
  return useMutation({
    mutationFn: ({
      message,
      role,
      joinedWithinDays,
      limit,
    }: {
      message: string;
      role?: string | null;
      joinedWithinDays?: number | null;
      limit?: number;
    }) => broadcastAdminNotification(message, { role, joinedWithinDays, limit }),
  });
}

export function useAdminSoftDeletePostFromGrid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (postId: string) => adminSoftDeletePost(postId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'posts'] });
      void qc.invalidateQueries({ queryKey: queryKeys.admin.dashboard });
    },
  });
}
