import { DataGrid, type DataGridProps } from '@mui/x-data-grid';

const DEFAULT_PAGE_SIZE = 25;

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
} as const;

export default function AdminDataGrid({
  initialState,
  pageSizeOptions = [10, 25, 50, 100],
  sx,
  ...props
}: DataGridProps) {
  return (
    <div className="admin-table-wrap admin-data-grid-wrap">
      <DataGrid
        disableRowSelectionOnClick
        autoHeight
        showToolbar
        sx={{ ...GRID_CONTAINMENT_SX, ...sx }}
        pageSizeOptions={pageSizeOptions}
        initialState={{
          pagination: {
            paginationModel: {
              pageSize: DEFAULT_PAGE_SIZE,
              ...initialState?.pagination?.paginationModel,
            },
            ...initialState?.pagination,
          },
          ...initialState,
        }}
        {...props}
      />
    </div>
  );
}
