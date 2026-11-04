export type PaginatedResult<T> = {
  total: number;
  rows: T[];
};

export const ADMIN_DEFAULT_PAGE_SIZE = 25;
export const ADMIN_MAX_PAGE_SIZE = 100;
export const ADMIN_SERVER_GRID_PAGE_SIZE_OPTIONS = [25, 50, 100] as const;
/** Max rows loaded for moderation queue grouping (not the paginated table view). */
export const ADMIN_QUEUE_FETCH_LIMIT = 5000;

function parseJsonValue(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function asRowArray<T>(rows: unknown): T[] {
  const value = parseJsonValue(rows);
  return Array.isArray(value) ? (value as T[]) : [];
}

export function parsePaginatedResult<T>(data: unknown): PaginatedResult<T> {
  const payload = parseJsonValue(data) as { total?: number | string; rows?: unknown } | null;
  const total = typeof payload?.total === 'number' ? payload.total : Number(payload?.total);
  return {
    total: Number.isFinite(total) ? total : 0,
    rows: asRowArray<T>(payload?.rows),
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
