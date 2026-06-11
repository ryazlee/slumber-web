import type { GridColDef } from '@mui/x-data-grid';
import { formatWhen } from './format';

export function dateColumn(field: string, headerName: string, flex = 1): GridColDef {
  return {
    field,
    headerName,
    flex,
    minWidth: 140,
    valueFormatter: (value) => (value ? formatWhen(String(value)) : '—'),
    sortComparator: (v1, v2) => new Date(String(v1)).getTime() - new Date(String(v2)).getTime(),
  };
}
