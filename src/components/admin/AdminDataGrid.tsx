import { DataGrid, useGridApiRef, type DataGridProps, type GridInitialState, type GridPaginationModel } from '@mui/x-data-grid';
import { useCallback, useLayoutEffect, useMemo, useRef, useState, type ReactNode, type Ref } from 'react';
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
import type { AdminMobileSummary } from './gridColumnHelpers';

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
  '& .MuiDataGrid-toolbarContainer, & .MuiDataGrid-toolbar': {
    overflow: 'hidden',
    maxWidth: '100%',
    flexWrap: 'wrap',
  },
  '& .MuiDataGrid-main': {
    overflow: 'hidden',
  },
  '& .MuiDataGrid-virtualScroller': {
    overflowX: 'auto',
  },
  '& .MuiDataGrid-columnHeader, & .MuiDataGrid-columnHeaderTitle': {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  '& .MuiDataGrid-cell': {
    display: 'flex',
    alignItems: 'center',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    py: '8px',
    lineHeight: 1.35,
  },
  '& .MuiDataGrid-cell .admin-code': {
    display: 'block',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    wordBreak: 'normal',
    maxWidth: '100%',
  },
  '& .MuiDataGrid-cell:has(.admin-raw-cell--open)': {
    alignItems: 'flex-start',
    overflow: 'visible',
    whiteSpace: 'normal',
  },
} as const;

type AdminDataGridProps = DataGridProps & {
  /** Unique key for persisting sort, filters, columns, and pagination in localStorage. */
  persistKey: string;
  /** When set, enables server-side pagination with shared admin defaults. */
  serverPagination?: AdminServerPagination;
  /** Search or lookup rendered inside the table card, above the column headers. */
  search?: ReactNode;
  /**
   * Kept so existing tables can still describe a row. Narrow screens scroll the full
   * grid horizontally instead of stacking this into a multi-line card.
   */
  mobileSummary?: AdminMobileSummary;
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

export function AdminGridSearchField({
  id,
  label,
  value,
  onChange,
  placeholder,
  inputRef,
  note,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  inputRef?: Ref<HTMLInputElement>;
  note?: ReactNode;
}) {
  return (
    <>
      <label className="admin-grid-search" htmlFor={id}>
        <span className="admin-grid-search-label">{label}</span>
        <input
          ref={inputRef}
          id={id}
          className="admin-input"
          type="search"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete="off"
        />
      </label>
      {note}
    </>
  );
}

export default function AdminDataGrid({
  persistKey,
  initialState,
  serverPagination,
  search,
  mobileSummary: _mobileSummary,
  pageSizeOptions: pageSizeOptionsProp,
  paginationMode: paginationModeProp,
  rowCount: rowCountProp,
  paginationModel: paginationModelProp,
  onPaginationModelChange: onPaginationModelChangeProp,
  disableColumnSorting: disableColumnSortingProp,
  sx,
  slotProps,
  columns,
  getRowHeight,
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
    if (exported.columns?.orderedFields?.includes('__summary')) return;
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
        disableColumnSorting: disableColumnSortingProp ?? false,
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
      {search ? <div className="admin-grid-searchbar">{search}</div> : null}
      <DataGrid
        key={persistKey}
        apiRef={apiRef}
        columns={columns}
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
        getRowHeight={getRowHeight}
        {...paginationProps}
        {...props}
        density={props.density ?? 'standard'}
      />
    </div>
  );
}
