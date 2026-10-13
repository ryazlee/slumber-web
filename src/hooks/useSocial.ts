import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  acceptFriendRequest,
  cancelFriendRequest,
  declineFriendRequest,
  fetchClubAnalytics,
  fetchClubMembers,
  fetchClubs,
  fetchFriends,
  fetchInboundFriendRequests,
  respondToClubInvite,
  sendFriendRequest,
} from '../lib/social';
import { queryKeys } from './queryKeys';

export function useFriends() {
  return useQuery({
    queryKey: queryKeys.friends,
    queryFn: fetchFriends,
  });
}

export function useFriendRequests() {
  return useQuery({
    queryKey: queryKeys.friendRequests,
    queryFn: fetchInboundFriendRequests,
  });
}

export function useClubs() {
  return useQuery({
    queryKey: queryKeys.clubs,
    queryFn: fetchClubs,
  });
}

export function useClubMembers(clubId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.clubMembers(clubId ?? ''),
    queryFn: () => fetchClubMembers(clubId!),
    enabled: Boolean(clubId) && enabled,
  });
}

function invalidateSocial(
  qc: ReturnType<typeof useQueryClient>,
  counterpartUserId?: string,
) {
  void qc.invalidateQueries({ queryKey: queryKeys.friends });
  void qc.invalidateQueries({ queryKey: queryKeys.friendRequests });
  if (counterpartUserId) {
    void qc.invalidateQueries({ queryKey: queryKeys.profile(counterpartUserId) });
    void qc.invalidateQueries({ queryKey: queryKeys.userPosts(counterpartUserId) });
  }
}

export function useSendFriendRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: sendFriendRequest,
    onSuccess: (_data, targetUserId) => invalidateSocial(qc, targetUserId),
  });
}

export function useCancelFriendRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: cancelFriendRequest,
    onSuccess: (_data, targetUserId) => invalidateSocial(qc, targetUserId),
  });
}

export function useAcceptFriendRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: acceptFriendRequest,
    onSuccess: (_data, requesterId) => invalidateSocial(qc, requesterId),
  });
}

export function useDeclineFriendRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: declineFriendRequest,
    onSuccess: (_data, requesterId) => invalidateSocial(qc, requesterId),
  });
}

export function useClubAnalytics(clubId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.clubAnalytics(clubId ?? ''),
    queryFn: () => fetchClubAnalytics(clubId!),
    staleTime: 60_000,
    enabled: Boolean(clubId) && enabled,
  });
}

export function useRespondToClubInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ clubId, accept }: { clubId: string; accept: boolean }) =>
      respondToClubInvite(clubId, accept),
    onSuccess: (_data, { clubId }) => {
      void qc.invalidateQueries({ queryKey: queryKeys.clubs });
      void qc.invalidateQueries({ queryKey: queryKeys.clubMembers(clubId) });
      void qc.invalidateQueries({ queryKey: queryKeys.clubAnalytics(clubId) });
    },
  });
}
