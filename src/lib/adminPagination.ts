export type PaginatedResult<T> = {
  total: number;
  rows: T[];
};

export const ADMIN_DEFAULT_PAGE_SIZE = 25;
export const ADMIN_MAX_PAGE_SIZE = 100;
/** Max rows loaded for moderation queue grouping (not the paginated table view). */
export const ADMIN_QUEUE_FETCH_LIMIT = 5000;

export function parsePaginatedResult<T>(data: unknown): PaginatedResult<T> {
  const payload = data as { total?: number; rows?: T[] } | null;
  return {
    total: typeof payload?.total === 'number' ? payload.total : 0,
    rows: Array.isArray(payload?.rows) ? payload.rows : [],
  };
}

export function resolvePageSize(
  pageSize?: number,
  legacyLimit?: number,
  fallback = ADMIN_DEFAULT_PAGE_SIZE,
): number {
  const raw = pageSize ?? legacyLimit ?? fallback;
  return Math.max(1, Math.min(raw, ADMIN_MAX_PAGE_SIZE));
}

export function resolvePageOffset(page = 0, pageSize = ADMIN_DEFAULT_PAGE_SIZE): number {
  return Math.max(0, page) * pageSize;
}

export type PaginationFilters = {
  page?: number;
  pageSize?: number;
  /** @deprecated use pageSize */
  limit?: number;
};
