import { DataGrid, type DataGridProps } from '@mui/x-data-grid';

const DEFAULT_PAGE_SIZE = 25;

export default function AdminDataGrid({
  initialState,
  pageSizeOptions = [10, 25, 50, 100],
  ...props
}: DataGridProps) {
  return (
    <div className="admin-data-grid-wrap">
      <DataGrid
        disableRowSelectionOnClick
        autoHeight
        showToolbar
        sx={{ width: '100%', maxWidth: '100%', minWidth: 0 }}
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
