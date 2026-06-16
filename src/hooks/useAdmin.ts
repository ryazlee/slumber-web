import { useIsFetching, useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import {
  deleteAdminRoleDefinition,
  deleteAdminTag,
  fetchAdminRoleDefinitions,
  fetchAdminTags,
  fetchAnalyticsMetrics,
  fetchAppVersions,
  fetchCommentReports,
  fetchDailyActivity,
  fetchDashboardMetrics,
  fetchPostReports,
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
  checkIsModerator,
  formatAdminRpcError,
  type AnalyticsFilters,
  type TagDraft,
  type RoleDefinitionDraft,
  type PremiumUserFilters,
  type UserSearchFilters,
} from '../lib/admin';
import { clearTagsCache } from '../lib/tags';
import { clearRoleDefinitionCache } from '../lib/userRoles';
import { queryKeys } from './queryKeys';

export function useIsModerator(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.isModerator,
    queryFn: checkIsModerator,
    enabled,
    staleTime: 5 * 60_000,
  });
}

export function useDashboardMetrics(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.admin.dashboard,
    queryFn: fetchDashboardMetrics,
    enabled,
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

export function usePostReports() {
  return useQuery({
    queryKey: queryKeys.admin.postReports,
    queryFn: fetchPostReports,
  });
}

export function useCommentReports() {
  return useQuery({
    queryKey: queryKeys.admin.commentReports,
    queryFn: fetchCommentReports,
  });
}

export function useAdminTagsCatalog() {
  return useQuery({
    queryKey: queryKeys.admin.tags,
    queryFn: () => fetchAdminTags(),
  });
}

export function useAdminRoleDefinitions() {
  return useQuery({
    queryKey: queryKeys.admin.roleDefinitions,
    queryFn: fetchAdminRoleDefinitions,
  });
}

export function useAppVersions() {
  return useQuery({
    queryKey: queryKeys.admin.appVersions,
    queryFn: fetchAppVersions,
  });
}

export function useAdminUserSearch(filters: UserSearchFilters, enabled = true) {
  return useQuery({
    queryKey: queryKeys.admin.userSearch(filters),
    queryFn: () => searchAdminUsers(filters),
    enabled,
  });
}

export function useAdminAnalyticsBundle(filters: AnalyticsFilters) {
  const results = useQueries({
    queries: [
      {
        queryKey: queryKeys.admin.analyticsMetrics(filters),
        queryFn: () => fetchAnalyticsMetrics(filters),
      },
      {
        queryKey: queryKeys.admin.analyticsActivity(filters),
        queryFn: () => fetchDailyActivity(filters),
      },
      {
        queryKey: queryKeys.admin.analyticsUsers(filters),
        queryFn: () => fetchRecentUsers(filters),
      },
      {
        queryKey: queryKeys.admin.analyticsPosts(filters),
        queryFn: () => fetchRecentPosts(filters),
      },
      {
        queryKey: queryKeys.admin.analyticsTags(filters),
        queryFn: () => fetchAdminTags(filters),
      },
    ],
  });

  const [metricsQ, activityQ, usersQ, postsQ, tagsQ] = results;

  const loading = results.some((r) => r.isLoading);
  const fetching = results.some((r) => r.isFetching);

  let error: string | null = null;
  const warnings: string[] = [];

  if (metricsQ.isError) {
    error = formatAdminRpcError('Metrics', metricsQ.error);
  } else if (activityQ.isError) {
    error = formatAdminRpcError('Daily activity', activityQ.error);
  } else {
    if (usersQ.isError) warnings.push(formatAdminRpcError('Users', usersQ.error));
    if (postsQ.isError) warnings.push(formatAdminRpcError('Posts', postsQ.error));
    if (tagsQ.isError) warnings.push(formatAdminRpcError('Tags', tagsQ.error));
    if (warnings.length > 0) error = warnings.join(' · ');
  }

  const tags = tagsQ.data
    ? [...tagsQ.data].sort((a, b) => b.usage_count - a.usage_count)
    : [];

  return {
    metrics: metricsQ.data ?? null,
    activity: activityQ.data ?? [],
    users: usersQ.data ?? [],
    posts: postsQ.data ?? [],
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
      void qc.invalidateQueries({ queryKey: queryKeys.admin.tags });
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
      void qc.invalidateQueries({ queryKey: queryKeys.admin.tags });
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
      void qc.invalidateQueries({ queryKey: queryKeys.admin.roleDefinitions });
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
      void qc.invalidateQueries({ queryKey: queryKeys.admin.roleDefinitions });
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
  });
}

export function usePremiumUsers(filters: PremiumUserFilters, enabled = true) {
  return useQuery({
    queryKey: queryKeys.admin.premiumUsers(filters),
    queryFn: () => fetchPremiumUsers(filters),
    enabled,
  });
}

export function useSendAdminNotification() {
  return useMutation({
    mutationFn: ({ userId, message }: { userId: string; message: string }) =>
      sendAdminNotification(userId, message),
  });
}
