import { useMemo } from 'react';
import type { PaginationFilters } from '../lib/adminPagination';
import { useAdminGridPagination } from './useAdminGridPagination';

/** Combines server pagination state with extra filter fields for paginated admin queries. */
export function usePaginatedFilters<T extends Record<string, unknown>>(
  extraFilters: T,
  resetDeps: readonly unknown[] = [],
): {
  paginationModel: ReturnType<typeof useAdminGridPagination>['paginationModel'];
  setPaginationModel: ReturnType<typeof useAdminGridPagination>['setPaginationModel'];
  filters: T & Required<Pick<PaginationFilters, 'page' | 'pageSize'>>;
} {
  const { paginationModel, setPaginationModel } = useAdminGridPagination(resetDeps);

  const filters = useMemo(
    () => ({
      ...extraFilters,
      page: paginationModel.page,
      pageSize: paginationModel.pageSize,
    }),
    [extraFilters, paginationModel.page, paginationModel.pageSize],
  );

  return { paginationModel, setPaginationModel, filters };
}
