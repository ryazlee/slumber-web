import { useQuery } from '@tanstack/react-query';
import { loadAvatarRoleStyles } from '../lib/avatarRoles';
import { loadTags } from '../lib/tags';
import { loadRoleDefinitions } from '../lib/userRoles';
import { queryKeys } from './queryKeys';

export function useTags() {
  return useQuery({
    queryKey: queryKeys.tags,
    queryFn: loadTags,
    staleTime: 5 * 60_000,
  });
}

export function useAvatarRoleStyles() {
  return useQuery({
    queryKey: queryKeys.avatarRoleStyles,
    queryFn: loadAvatarRoleStyles,
    staleTime: 5 * 60_000,
  });
}

export function useAssignableRoles() {
  return useQuery({
    queryKey: queryKeys.assignableRoles,
    queryFn: loadRoleDefinitions,
    staleTime: 5 * 60_000,
  });
}
