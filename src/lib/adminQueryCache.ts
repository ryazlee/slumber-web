/** How long admin list/metrics queries stay fresh before background refetch. */
export const ADMIN_QUERY_STALE_MS = 2 * 60_000;

/** Catalog data (tags, roles, app versions) changes less often. */
export const ADMIN_CATALOG_STALE_MS = 5 * 60_000;

/** Reports and dashboard headline metrics. */
export const ADMIN_REPORTS_STALE_MS = 90_000;

export const ADMIN_QUERY_GC_MS = 15 * 60_000;
