import { DataGrid, useGridApiRef, type DataGridProps, type GridInitialState, type GridPaginationModel } from '@mui/x-data-grid';
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  ADMIN_DEFAULT_PAGE_SIZE,
  ADMIN_SERVER_GRID_PAGE_SIZE_OPTIONS,
} from '../../lib/adminPagination';
import {
  loadAdminGridState,
  mergeGridInitialState,
  saveAdminGridState,
} from '../../lib/adminGridState';
import { ADMIN_SEARCH_DEBOUNCE_MS } from '../../lib/adminSearch';

const PERSIST_DEBOUNCE_MS = 300;

export type AdminServerPagination = {
  rowCount: number;
  paginationModel: GridPaginationModel;
  onPaginationModelChange: (model: GridPaginationModel) => void;
};

const GRID_CONTAINMENT_SX = {
  width: '100%',
  maxWidth: '100%',
  minWidth: 0,
  '& .MuiDataGrid-toolbarContainer': {
    overflow: 'hidden',
    maxWidth: '100%',
  },
  '& .MuiDataGrid-main': {
    overflow: 'hidden',
  },
  '& .MuiDataGrid-virtualScroller': {
    overflowX: 'auto',
  },
  '& .MuiDataGrid-cell, & .MuiDataGrid-columnHeader, & .MuiDataGrid-columnHeaderTitle': {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  '& .MuiDataGrid-cell .admin-code': {
    display: 'block',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    wordBreak: 'normal',
    maxWidth: '100%',
  },
  '& .MuiDataGrid-cell:has(.admin-grid-actions)': {
    display: 'flex',
    alignItems: 'center',
    overflow: 'visible',
    whiteSpace: 'normal',
  },
} as const;

type AdminDataGridProps = DataGridProps & {
  /** Unique key for persisting sort, filters, columns, and pagination in localStorage. */
  persistKey: string;
  /** When set, enables server-side pagination with shared admin defaults. */
  serverPagination?: AdminServerPagination;
};

function buildDefaultInitialState(initialState?: GridInitialState): GridInitialState {
  return {
    pagination: {
      paginationModel: {
        pageSize: ADMIN_DEFAULT_PAGE_SIZE,
        ...initialState?.pagination?.paginationModel,
      },
      ...initialState?.pagination,
    },
    ...initialState,
  };
}

export default function AdminDataGrid({
  persistKey,
  initialState,
  serverPagination,
  pageSizeOptions: pageSizeOptionsProp,
  paginationMode: paginationModeProp,
  rowCount: rowCountProp,
  paginationModel: paginationModelProp,
  onPaginationModelChange: onPaginationModelChangeProp,
  disableColumnSorting: disableColumnSortingProp,
  sx,
  slotProps,
  ...props
}: AdminDataGridProps) {
  const apiRef = useGridApiRef();
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const lastSerializedRef = useRef<string | null>(null);

  const [restoredInitialState] = useState(() => {
    const defaults = buildDefaultInitialState(initialState);
    const persisted = loadAdminGridState(persistKey);
    return mergeGridInitialState(defaults, persisted);
  });

  const persistState = useCallback(() => {
    if (!apiRef.current) return;
    const exported = apiRef.current.exportState();
    const serialized = JSON.stringify(exported);
    if (serialized === lastSerializedRef.current) return;
    lastSerializedRef.current = serialized;
    saveAdminGridState(persistKey, exported);
  }, [apiRef, persistKey]);

  const handleStateChange = useCallback(() => {
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(persistState, PERSIST_DEBOUNCE_MS);
  }, [persistState]);

  useLayoutEffect(() => () => {
    clearTimeout(saveTimerRef.current);
    persistState();
  }, [persistState]);

  const mergedSx = useMemo(() => ({ ...GRID_CONTAINMENT_SX, ...sx }), [sx]);

  const mergedSlotProps = useMemo(() => ({
    ...slotProps,
    toolbar: {
      ...slotProps?.toolbar,
      quickFilterProps: {
        debounceMs: ADMIN_SEARCH_DEBOUNCE_MS,
        defaultExpanded: true,
        ...slotProps?.toolbar?.quickFilterProps,
      },
    },
  }), [slotProps]);

  const pageSizeOptions = pageSizeOptionsProp
    ?? (serverPagination ? [...ADMIN_SERVER_GRID_PAGE_SIZE_OPTIONS] : [10, 25, 50, 100]);

  const paginationProps = serverPagination
    ? {
        paginationMode: 'server' as const,
        rowCount: serverPagination.rowCount,
        paginationModel: serverPagination.paginationModel,
        onPaginationModelChange: serverPagination.onPaginationModelChange,
        disableColumnSorting: disableColumnSortingProp ?? true,
      }
    : {
        paginationMode: paginationModeProp,
        rowCount: rowCountProp,
        paginationModel: paginationModelProp,
        onPaginationModelChange: onPaginationModelChangeProp,
        disableColumnSorting: disableColumnSortingProp,
      };

  return (
    <div className="admin-table-wrap admin-data-grid-wrap">
      <DataGrid
        apiRef={apiRef}
        disableRowSelectionOnClick
        autoHeight
        showToolbar
        ignoreDiacritics
        filterDebounceMs={ADMIN_SEARCH_DEBOUNCE_MS}
        sx={mergedSx}
        slotProps={mergedSlotProps}
        pageSizeOptions={pageSizeOptions}
        initialState={restoredInitialState}
        onStateChange={handleStateChange}
        {...paginationProps}
        {...props}
      />
    </div>
  );
}
