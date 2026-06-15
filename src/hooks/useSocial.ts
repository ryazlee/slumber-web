import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  acceptFriendRequest,
  declineFriendRequest,
  fetchClubMembers,
  fetchClubs,
  fetchFriends,
  fetchInboundFriendRequests,
  respondToClubInvite,
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

function invalidateSocial(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: queryKeys.friends });
  void qc.invalidateQueries({ queryKey: queryKeys.friendRequests });
}

export function useAcceptFriendRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: acceptFriendRequest,
    onSuccess: () => invalidateSocial(qc),
  });
}

export function useDeclineFriendRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: declineFriendRequest,
    onSuccess: () => invalidateSocial(qc),
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
    },
  });
}
