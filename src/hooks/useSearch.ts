import { useQuery } from '@tanstack/react-query';
import { searchAll } from '../lib/search';
import { useDebouncedValue } from './useDebouncedValue';
import { queryKeys } from './queryKeys';

export function useSearch(query: string) {
  const trimmed = query.trim();
  const debouncedQuery = useDebouncedValue(trimmed);

  return useQuery({
    queryKey: queryKeys.search(debouncedQuery),
    queryFn: () => searchAll(debouncedQuery),
    enabled: debouncedQuery.length > 0,
  });
}
