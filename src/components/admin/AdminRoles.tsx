import { useCallback, useState } from 'react';
import type { FormEvent } from 'react';
import { type GridColDef } from '@mui/x-data-grid';
import type { AdminRoleDefinitionRow, RoleDefinitionDraft } from '../../lib/admin';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { useDeleteAdminRole, useUpsertAdminRole } from '../../hooks/useAdmin';
import { ADMIN_CATALOG_FORM_ID, scrollAdminPanelIntoView } from './adminScroll';
import AdminDataGrid from './AdminDataGrid';
import AdminGridAction from './AdminGridAction';
import AdminListToolbar from './AdminListToolbar';
import AdminRoleDefinitionForm from './AdminRoleDefinitionForm';
import AdminSection from './AdminSection';

type Props = {
  roles: AdminRoleDefinitionRow[];
  loading: boolean;
  error: string | null;
};

const EMPTY_DRAFT: RoleDefinitionDraft = {
  key: '',
  label: '',
  badge: '',
  ring_color: '#9B7EDE',
  badge_color: '',
  is_admin: false,
  assignable: true,
  sort_order: 0,
};

function RoleSwatch({ color }: { color: string }) {
  return (
    <span
      className="admin-role-swatch"
      style={{ backgroundColor: color }}
      aria-hidden="true"
    />
  );
}

export default function AdminRoles({ roles, loading, error }: Props) {
  const [draft, setDraft] = useState<RoleDefinitionDraft>(EMPTY_DRAFT);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const upsertMutation = useUpsertAdminRole();
  const deleteMutation = useDeleteAdminRole();
  const saving = upsertMutation.isPending || deleteMutation.isPending;
  const showForm = formOpen || editingKey !== null;

  const closeForm = useCallback(() => {
    setDraft(EMPTY_DRAFT);
    setEditingKey(null);
    setFormOpen(false);
    setFormError(null);
  }, []);

  useEscapeKey(showForm, closeForm);

  const openCreate = () => {
    setDraft(EMPTY_DRAFT);
    setEditingKey(null);
    setFormOpen(true);
    setFormError(null);
    scrollAdminPanelIntoView(ADMIN_CATALOG_FORM_ID);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      await upsertMutation.mutateAsync(draft);
      closeForm();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Could not save role.');
    }
  };

  const handleEdit = (role: AdminRoleDefinitionRow) => {
    setEditingKey(role.key);
    setFormOpen(true);
    setDraft({
      key: role.key,
      label: role.label,
      badge: role.badge,
      ring_color: role.ring_color,
      badge_color: role.badge_color ?? '',
      is_admin: role.is_admin,
      assignable: role.assignable,
      sort_order: role.sort_order,
    });
    setFormError(null);
    scrollAdminPanelIntoView(ADMIN_CATALOG_FORM_ID);
  };

  const handleDelete = async (role: AdminRoleDefinitionRow) => {
    if (role.usage_count > 0) {
      window.alert(`Cannot delete "${role.label}" — ${role.usage_count} user(s) still have this role. Remove it from users first.`);
      return;
    }
    if (!window.confirm(`Delete role "${role.label}"?`)) return;

    setFormError(null);
    try {
      await deleteMutation.mutateAsync(role.key);
      if (editingKey === role.key) closeForm();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not delete role.';
      setFormError(message.includes('role_in_use')
        ? 'This role is still assigned to users. Remove it from users first.'
        : message);
    }
  };

  const columns: GridColDef<AdminRoleDefinitionRow>[] = [
    {
      field: 'label',
      headerName: 'Role',
      flex: 1,
      minWidth: 140,
      valueGetter: (_value, row) => `${row.badge} ${row.label}`,
    },
    {
      field: 'key',
      headerName: 'Key',
      flex: 1,
      minWidth: 120,
      renderCell: ({ value }) => <code className="admin-code">{value}</code>,
    },
    {
      field: 'ring_color',
      headerName: 'Colors',
      flex: 1.2,
      minWidth: 180,
      sortable: false,
      valueGetter: (_value, row) => `${row.ring_color} ${row.badge_color ?? ''}`,
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
      valueGetter: (_value, row) => `${row.is_admin ? 'Admin' : ''} ${row.assignable ? 'Assignable' : 'Hidden'}`,
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
    },
    {
      field: 'usage_count',
      headerName: 'Users',
      type: 'number',
      width: 90,
    },
    {
      field: 'actions',
      headerName: '',
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      width: 140,
      renderCell: ({ row }) => (
        <div className="admin-grid-actions">
          <AdminGridAction
            active={editingKey === row.key}
            onClick={(e) => {
              e.stopPropagation();
              if (editingKey === row.key) {
                closeForm();
              } else {
                handleEdit(row);
              }
            }}
          >
            {editingKey === row.key ? 'Editing' : 'Edit'}
          </AdminGridAction>
          <AdminGridAction
            danger
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(row);
            }}
          >
            Delete
          </AdminGridAction>
        </div>
      ),
    },
  ];

  return (
    <AdminSection className="admin-tags" error={error}>
      <AdminListToolbar
        actions={!showForm ? (
          <button className="admin-button" type="button" onClick={openCreate}>
            + Add role
          </button>
        ) : null}
      >
        <p className="admin-muted admin-table-summary">
          {roles.length} role{roles.length === 1 ? '' : 's'} — click Edit on a row to change it
        </p>
      </AdminListToolbar>

      {showForm ? (
        <AdminRoleDefinitionForm
          panelId={ADMIN_CATALOG_FORM_ID}
          draft={draft}
          editingKey={editingKey}
          saving={saving}
          formError={formError}
          onChange={setDraft}
          onSubmit={handleSubmit}
          onCancel={closeForm}
        />
      ) : null}

      {!loading && (
        <AdminDataGrid
          persistKey="admin-roles"
          rows={roles}
          columns={columns}
          getRowId={(row) => row.key}
          loading={loading}
          label="Roles"
          getRowClassName={(params) => (params.id === editingKey ? 'admin-grid-row-editing' : '')}
          initialState={{
            sorting: { sortModel: [{ field: 'sort_order', sort: 'asc' }] },
          }}
        />
      )}
      {loading && <p className="admin-muted">Loading roles…</p>}
    </AdminSection>
  );
}
