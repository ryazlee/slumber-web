import { useMemo } from 'react';
import type { FormEvent } from 'react';
import type { AdminRoleDefinitionRow, RoleDefinitionDraft } from '../../lib/admin';
import { getOptionalQueryErrorMessage } from '../../lib/queryError';
import { useAdminCatalogForm } from '../../hooks/useAdminCatalogForm';
import { usePaginatedFilters } from '../../hooks/usePaginatedFilters';
import { useAdminRoleDefinitions, useDeleteAdminRole, useUpsertAdminRole } from '../../hooks/useAdmin';
import { ADMIN_CATALOG_FORM_ID, scrollAdminPanelIntoView } from './adminScroll';
import { buildAdminRoleColumns } from './catalogGridColumns';
import AdminDataGrid from './AdminDataGrid';
import AdminGridClientFilterHint from './AdminGridClientFilterHint';
import AdminListToolbar from './AdminListToolbar';
import AdminRoleDefinitionForm from './AdminRoleDefinitionForm';
import AdminSection, { AdminTableSummary } from './AdminSection';
import { pluralCount } from './format';

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

export default function AdminRoles() {
  const {
    draft,
    setDraft,
    editingId: editingKey,
    setEditingId: setEditingKey,
    formError,
    setFormError,
    showForm,
    closeForm,
    openCreate,
  } = useAdminCatalogForm(EMPTY_DRAFT);

  const { paginationModel, setPaginationModel, filters: catalogFilters } = usePaginatedFilters({});

  const rolesQuery = useAdminRoleDefinitions(catalogFilters);
  const roles = rolesQuery.data?.rows ?? [];
  const rolesTotal = rolesQuery.data?.total ?? 0;
  const loading = rolesQuery.isLoading;
  const error = getOptionalQueryErrorMessage(rolesQuery.error, 'Could not load roles.');

  const upsertMutation = useUpsertAdminRole();
  const deleteMutation = useDeleteAdminRole();
  const saving = upsertMutation.isPending || deleteMutation.isPending;

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
    <AdminSection className="admin-roles" error={error}>
      <AdminListToolbar
        actions={!showForm ? (
          <button className="admin-button" type="button" onClick={() => {
            openCreate();
            scrollAdminPanelIntoView(ADMIN_CATALOG_FORM_ID);
          }}
          >
            + Add role
          </button>
        ) : null}
      >
        <AdminTableSummary>
          {pluralCount(rolesTotal, 'role')}
          {' · '}
          <AdminGridClientFilterHint suffix=" · click Edit to change" />
        </AdminTableSummary>
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

      {!loading && rolesTotal > 0 ? (
        <AdminDataGrid
          persistKey="admin-roles"
          rows={roles}
          columns={columns}
          getRowId={(row) => row.key}
          loading={rolesQuery.isFetching}
          label="Roles"
          getRowClassName={(params) => (params.id === editingKey ? 'admin-grid-row-editing' : '')}
          serverPagination={{
            rowCount: rolesTotal,
            paginationModel,
            onPaginationModelChange: setPaginationModel,
          }}
          initialState={{
            sorting: { sortModel: [{ field: 'sort_order', sort: 'asc' }] },
          }}
        />
      ) : null}
      {!loading && rolesTotal === 0 ? (
        <p className="admin-muted">No roles yet.</p>
      ) : null}
      {loading ? <p className="admin-muted">Loading roles…</p> : null}
    </AdminSection>
  );
}
