import type { GridColDef } from '@mui/x-data-grid';
import type { AdminRoleDefinitionRow, AdminTagRow } from '../../lib/admin';
import AdminGridAction from './AdminGridAction';
import AdminGridActions from './AdminGridActions';
import {
  AdminStatusPill,
  gridActionsColumn,
  idCodeColumn,
  type AdminMobileSummary,
} from './gridColumnHelpers';

function RoleSwatch({ color }: { color: string }) {
  return (
    <span
      className="admin-role-swatch"
      style={{ backgroundColor: color }}
      aria-hidden="true"
    />
  );
}

export const tagMobileSummary: AdminMobileSummary = {
  title: (row: AdminTagRow) => `${row.emoji} ${row.label}`.trim(),
  searchText: (row: AdminTagRow) => `${row.emoji} ${row.label} ${row.value}`,
  facts: [
    { label: 'Used', value: (row: AdminTagRow) => Number(row.usage_count ?? 0) },
    { label: 'Value', value: (row: AdminTagRow) => row.value },
  ],
};

export const roleMobileSummary: AdminMobileSummary = {
  title: (row: AdminRoleDefinitionRow) => `${row.badge} ${row.label}`.trim(),
  searchText: (row: AdminRoleDefinitionRow) => `${row.badge} ${row.label} ${row.key}`,
  status: (row: AdminRoleDefinitionRow) => (
    <AdminStatusPill tone={row.assignable ? 'on' : 'off'}>
      {row.assignable ? 'Assignable' : 'Hidden'}
    </AdminStatusPill>
  ),
  facts: [
    { label: 'Users', value: (row: AdminRoleDefinitionRow) => Number(row.usage_count ?? 0) },
    { label: 'Key', value: (row: AdminRoleDefinitionRow) => row.key },
    {
      label: 'Access',
      value: (row: AdminRoleDefinitionRow) => (row.is_admin ? 'Admin' : 'Member'),
    },
  ],
};

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
    {
      field: 'usage_count',
      headerName: 'Used',
      type: 'number',
      width: 80,
      flex: 0,
      valueGetter: (_value, row) => Number(row.usage_count ?? 0),
    },
    {
      field: 'sort_order',
      headerName: 'Order',
      type: 'number',
      width: 80,
      flex: 0,
      valueGetter: (_value, row) => Number(row.sort_order ?? 0),
    },
    idCodeColumn<AdminTagRow>('value', 'Value'),
    {
      field: 'actions',
      headerName: 'Actions',
      ...gridActionsColumn,
      width: 168,
      renderCell: ({ row }) => (
        <AdminGridActions>
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
            variant="danger"
            onClick={(e) => {
              e.stopPropagation();
              handlers.onDelete(row);
            }}
          >
            Delete
          </AdminGridAction>
        </AdminGridActions>
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
    {
      field: 'is_admin',
      headerName: 'Access',
      width: 150,
      flex: 0,
      valueGetter: (_value, row) => `${row.is_admin ? 'Admin' : 'Member'} ${row.assignable ? 'Assignable' : 'Hidden'}`.trim(),
      renderCell: ({ row }) => (
        <span>
          {row.is_admin ? 'Admin' : 'Member'}
          {row.assignable ? ' · Assignable' : ' · Hidden'}
        </span>
      ),
    },
    {
      field: 'usage_count',
      headerName: 'Users',
      type: 'number',
      width: 80,
      flex: 0,
      valueGetter: (_value, row) => Number(row.usage_count ?? 0),
    },
    {
      field: 'sort_order',
      headerName: 'Order',
      type: 'number',
      width: 80,
      flex: 0,
      valueGetter: (_value, row) => Number(row.sort_order ?? 0),
    },
    {
      field: 'ring_color',
      headerName: 'Colors',
      width: 280,
      flex: 0,
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
    idCodeColumn<AdminRoleDefinitionRow>('key', 'Key', { width: 140 }),
    {
      field: 'actions',
      headerName: 'Actions',
      ...gridActionsColumn,
      width: 168,
      renderCell: ({ row }) => (
        <AdminGridActions>
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
            variant="danger"
            onClick={(e) => {
              e.stopPropagation();
              handlers.onDelete(row);
            }}
          >
            Delete
          </AdminGridAction>
        </AdminGridActions>
      ),
    },
  ];
}
