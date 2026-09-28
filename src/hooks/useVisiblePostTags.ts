import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { loadMyPendingTags, visiblePostTags, type TagDefinition } from '../lib/tags';
import { queryKeys } from './queryKeys';
import { useTags } from './useCatalog';

const EMPTY_PENDING: TagDefinition[] = [];

export function useMyPendingTags(enabled = true) {
  const { user } = useAuth();
  return useQuery({
    queryKey: queryKeys.myPendingTags,
    queryFn: loadMyPendingTags,
    enabled: enabled && !!user,
  });
}

export function useVisiblePostTags(tags: string[], isOwnPost: boolean): ReturnType<typeof visiblePostTags> {
  const { data: catalog } = useTags();
  const { data: pending } = useMyPendingTags(isOwnPost);
  const pendingTags = isOwnPost ? (pending ?? EMPTY_PENDING) : EMPTY_PENDING;

  return useMemo(
    () => visiblePostTags(tags, catalog, pendingTags),
    [catalog, pendingTags, tags],
  );
}
