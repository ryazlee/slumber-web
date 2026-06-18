import { useCallback, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import type { AdminRoleDefinitionRow, RoleDefinitionDraft } from '../../lib/admin';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { useDeleteAdminRole, useUpsertAdminRole } from '../../hooks/useAdmin';
import { ADMIN_CATALOG_FORM_ID, scrollAdminPanelIntoView } from './adminScroll';
import { buildAdminRoleColumns } from './catalogGridColumns';
import AdminDataGrid from './AdminDataGrid';
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

  const columns = useMemo(
    () => buildAdminRoleColumns({
      editingKey,
      onEdit: handleEdit,
      onCloseEdit: closeForm,
      onDelete: (role) => { void handleDelete(role); },
    }),
    [editingKey, closeForm, handleEdit, handleDelete],
  );

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
          {roles.length} role{roles.length === 1 ? '' : 's'} — sort/filter via toolbar · click Edit to change
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
