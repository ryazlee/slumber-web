import type { InfiniteData } from '@tanstack/react-query';

/** Default page size for keyset infinite lists (board messages, etc.). */
export const INFINITE_PAGE_SIZE = 20;

/** Flatten paginated query pages and deduplicate by `id`. */
export function flattenInfinitePages<T extends { id: string }>(
  data: InfiniteData<T[]> | undefined,
): T[] {
  const flat = data?.pages.flat() ?? [];
  const seen = new Set<string>();
  return flat.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}
