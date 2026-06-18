import type { GridColDef } from '@mui/x-data-grid';
import type { AdminRoleDefinitionRow, AdminTagRow } from '../../lib/admin';
import AdminGridAction from './AdminGridAction';
import { gridActionsColumn, idCodeColumn } from './gridColumnHelpers';

function RoleSwatch({ color }: { color: string }) {
  return (
    <span
      className="admin-role-swatch"
      style={{ backgroundColor: color }}
      aria-hidden="true"
    />
  );
}

export function buildAdminTagColumns(handlers: {
  editingValue: string | null;
  onEdit: (tag: AdminTagRow) => void;
  onCloseEdit: () => void;
  onDelete: (tag: AdminTagRow) => void;
}): GridColDef<AdminTagRow>[] {
  return [
    {
      field: 'label',
      headerName: 'Tag',
      flex: 1.2,
      minWidth: 140,
      valueGetter: (_value, row) => `${row.emoji} ${row.label}`,
    },
    idCodeColumn<AdminTagRow>('value', 'Value', { flex: 1, minWidth: 140 }),
    {
      field: 'sort_order',
      headerName: 'Order',
      type: 'number',
      width: 90,
      valueGetter: (_value, row) => Number(row.sort_order ?? 0),
    },
    {
      field: 'usage_count',
      headerName: 'Used',
      type: 'number',
      width: 90,
      valueGetter: (_value, row) => Number(row.usage_count ?? 0),
    },
    {
      field: 'actions',
      headerName: '',
      ...gridActionsColumn,
      width: 140,
      renderCell: ({ row }) => (
        <div className="admin-grid-actions">
          <AdminGridAction
            active={handlers.editingValue === row.value}
            onClick={(e) => {
              e.stopPropagation();
              if (handlers.editingValue === row.value) {
                handlers.onCloseEdit();
              } else {
                handlers.onEdit(row);
              }
            }}
          >
            {handlers.editingValue === row.value ? 'Editing' : 'Edit'}
          </AdminGridAction>
          <AdminGridAction
            danger
            onClick={(e) => {
              e.stopPropagation();
              handlers.onDelete(row);
            }}
          >
            Delete
          </AdminGridAction>
        </div>
      ),
    },
  ];
}

export function buildAdminRoleColumns(handlers: {
  editingKey: string | null;
  onEdit: (role: AdminRoleDefinitionRow) => void;
  onCloseEdit: () => void;
  onDelete: (role: AdminRoleDefinitionRow) => void;
}): GridColDef<AdminRoleDefinitionRow>[] {
  return [
    {
      field: 'label',
      headerName: 'Role',
      flex: 1,
      minWidth: 140,
      valueGetter: (_value, row) => `${row.badge} ${row.label}`,
    },
    idCodeColumn<AdminRoleDefinitionRow>('key', 'Key', { flex: 1, minWidth: 120 }),
    {
      field: 'ring_color',
      headerName: 'Colors',
      flex: 1.2,
      minWidth: 180,
      valueGetter: (_value, row) => `${row.ring_color} ${row.badge_color ?? ''}`.trim(),
      renderCell: ({ row }) => (
        <div className="admin-td-stack">
          <span className="admin-color-row">
            <RoleSwatch color={row.ring_color} /> Ring {row.ring_color}
          </span>
          {row.badge_color ? (
            <span className="admin-color-row">
              <RoleSwatch color={row.badge_color} /> Badge {row.badge_color}
            </span>
          ) : null}
        </div>
      ),
    },
    {
      field: 'is_admin',
      headerName: 'Flags',
      flex: 1,
      minWidth: 120,
      valueGetter: (_value, row) => `${row.is_admin ? 'Admin' : ''} ${row.assignable ? 'Assignable' : 'Hidden'}`.trim(),
      renderCell: ({ row }) => (
        <span>
          {row.is_admin ? 'Admin' : '—'}
          {row.assignable ? ' · Assignable' : ' · Hidden'}
        </span>
      ),
    },
    {
      field: 'sort_order',
      headerName: 'Order',
      type: 'number',
      width: 90,
      valueGetter: (_value, row) => Number(row.sort_order ?? 0),
    },
    {
      field: 'usage_count',
      headerName: 'Users',
      type: 'number',
      width: 90,
      valueGetter: (_value, row) => Number(row.usage_count ?? 0),
    },
    {
      field: 'actions',
      headerName: '',
      ...gridActionsColumn,
      width: 140,
      renderCell: ({ row }) => (
        <div className="admin-grid-actions">
          <AdminGridAction
            active={handlers.editingKey === row.key}
            onClick={(e) => {
              e.stopPropagation();
              if (handlers.editingKey === row.key) {
                handlers.onCloseEdit();
              } else {
                handlers.onEdit(row);
              }
            }}
          >
            {handlers.editingKey === row.key ? 'Editing' : 'Edit'}
          </AdminGridAction>
          <AdminGridAction
            danger
            onClick={(e) => {
              e.stopPropagation();
              handlers.onDelete(row);
            }}
          >
            Delete
          </AdminGridAction>
        </div>
      ),
    },
  ];
}
