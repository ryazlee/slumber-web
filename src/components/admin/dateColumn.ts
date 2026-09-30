import type { GridColDef } from '@mui/x-data-grid';
import { formatWhen } from './format';

/** Fixed width so a date column cannot grow and push actions off the desktop table. */
export function dateColumn(field: string, headerName: string, flex = 0): GridColDef {
  return {
    field,
    headerName,
    flex,
    width: flex > 0 ? undefined : 152,
    minWidth: 132,
    valueFormatter: (value) => (value ? formatWhen(String(value)) : '—'),
    sortComparator: (v1, v2) => new Date(String(v1)).getTime() - new Date(String(v2)).getTime(),
  };
}
