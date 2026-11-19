import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchAdminDevMessages,
  fetchAdminDevThreads,
  replyAdminDevMessage,
  searchAdminDevMessageUserIds,
} from '../lib/devMessages';
import { queryKeys } from './queryKeys';

const REFRESH_MS = 10_000;

export function useAdminDevThreads() {
  return useQuery({
    queryKey: queryKeys.admin.devThreads,
    queryFn: fetchAdminDevThreads,
    refetchInterval: REFRESH_MS,
  });
}

/** User ids with a message body match. Disabled until the query is at least 2 characters. */
export function useAdminDevMessageUserIds(query: string) {
  const q = query.trim();
  return useQuery({
    queryKey: queryKeys.admin.devMessageSearch(q),
    queryFn: () => searchAdminDevMessageUserIds(q),
    enabled: q.length >= 2,
    refetchInterval: REFRESH_MS,
  });
}

export function useAdminDevMessages(userId: string | null) {
  return useQuery({
    queryKey: queryKeys.admin.devMessages(userId ?? ''),
    queryFn: () => fetchAdminDevMessages(userId ?? ''),
    enabled: Boolean(userId),
    refetchInterval: REFRESH_MS,
  });
}

export function useAdminDevReply(userId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => {
      if (!userId) throw new Error('Pick a conversation first.');
      return replyAdminDevMessage(userId, body);
    },
    onSuccess: () => {
      if (!userId) return;
      void qc.invalidateQueries({ queryKey: queryKeys.admin.devMessages(userId) });
      void qc.invalidateQueries({ queryKey: queryKeys.admin.devThreads });
      void qc.invalidateQueries({ queryKey: queryKeys.admin.devMessageSearches });
    },
  });
}
