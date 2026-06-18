import { useEffect, useState } from 'react';
import type { GridPaginationModel } from '@mui/x-data-grid';
import { ADMIN_DEFAULT_PAGE_SIZE } from '../lib/adminPagination';

export function useAdminGridPagination(resetDeps: readonly unknown[] = []) {
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: ADMIN_DEFAULT_PAGE_SIZE,
  });

  useEffect(() => {
    setPaginationModel((current) => (current.page === 0 ? current : { ...current, page: 0 }));
    // Reset to page 0 when filters change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, resetDeps);

  return { paginationModel, setPaginationModel };
}
