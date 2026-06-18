import { useMemo } from 'react';
import type { FormEvent } from 'react';
import type { AdminTagRow, TagDraft } from '../../lib/admin';
import { getOptionalQueryErrorMessage } from '../../lib/queryError';
import { useAdminCatalogForm } from '../../hooks/useAdminCatalogForm';
import { usePaginatedFilters } from '../../hooks/usePaginatedFilters';
import { useAdminTagsCatalog, useDeleteAdminTag, useUpsertAdminTag } from '../../hooks/useAdmin';
import { ADMIN_CATALOG_FORM_ID, scrollAdminPanelIntoView } from './adminScroll';
import { buildAdminTagColumns } from './catalogGridColumns';
import AdminDataGrid from './AdminDataGrid';
import AdminGridClientFilterHint from './AdminGridClientFilterHint';
import AdminListToolbar from './AdminListToolbar';
import AdminSection, { AdminTableSummary } from './AdminSection';
import AdminTagForm from './AdminTagForm';
import { pluralCount } from './format';

const EMPTY_DRAFT: TagDraft = { value: '', emoji: '', label: '', sort_order: 0 };

export default function AdminTags() {
  const {
    draft,
    setDraft,
    editingId: editingValue,
    setEditingId: setEditingValue,
    formError,
    setFormError,
    showForm,
    closeForm,
    openCreate,
  } = useAdminCatalogForm(EMPTY_DRAFT);

  const { paginationModel, setPaginationModel, filters: catalogFilters } = usePaginatedFilters({});

  const tagsQuery = useAdminTagsCatalog(catalogFilters);
  const tags = tagsQuery.data?.rows ?? [];
  const tagsTotal = tagsQuery.data?.total ?? 0;
  const loading = tagsQuery.isLoading;
  const error = getOptionalQueryErrorMessage(tagsQuery.error, 'Could not load tags.');

  const upsertMutation = useUpsertAdminTag();
  const deleteMutation = useDeleteAdminTag();
  const saving = upsertMutation.isPending || deleteMutation.isPending;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      await upsertMutation.mutateAsync(draft);
      closeForm();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Could not save tag.');
    }
  };

  const handleEdit = (tag: AdminTagRow) => {
    setEditingValue(tag.value);
    setDraft({
      value: tag.value,
      emoji: tag.emoji,
      label: tag.label,
      sort_order: tag.sort_order,
    });
    setFormError(null);
    scrollAdminPanelIntoView(ADMIN_CATALOG_FORM_ID);
  };

  const handleDelete = async (tag: AdminTagRow) => {
    const msg = tag.usage_count > 0
      ? `Delete "${tag.label}"? It's on ${tag.usage_count} post(s). Existing posts will keep the key.`
      : `Delete "${tag.label}"?`;
    if (!window.confirm(msg)) return;

    setFormError(null);
    try {
      await deleteMutation.mutateAsync(tag.value);
      if (editingValue === tag.value) closeForm();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Could not delete tag.');
    }
  };

  const columns = useMemo(
    () => buildAdminTagColumns({
      editingValue,
      onEdit: handleEdit,
      onCloseEdit: closeForm,
      onDelete: (tag) => { void handleDelete(tag); },
    }),
    [editingValue, closeForm],
  );

  return (
    <AdminSection className="admin-tags" error={error}>
      <AdminListToolbar
        actions={!showForm ? (
          <button className="admin-button" type="button" onClick={() => {
            openCreate();
            scrollAdminPanelIntoView(ADMIN_CATALOG_FORM_ID);
          }}
          >
            + Add tag
          </button>
        ) : null}
      >
        <AdminTableSummary>
          {pluralCount(tagsTotal, 'tag')}
          {' · '}
          <AdminGridClientFilterHint suffix=" · click Edit to change" />
        </AdminTableSummary>
      </AdminListToolbar>

      {showForm ? (
        <AdminTagForm
          panelId={ADMIN_CATALOG_FORM_ID}
          draft={draft}
          tags={tags}
          saving={saving}
          formError={formError}
          onChange={setDraft}
          onSubmit={handleSubmit}
          onCancel={closeForm}
        />
      ) : null}

      {!loading && tagsTotal > 0 ? (
        <AdminDataGrid
          persistKey="admin-tags"
          rows={tags}
          columns={columns}
          getRowId={(row) => row.value}
          loading={tagsQuery.isFetching}
          label="Tags"
          getRowClassName={(params) => (params.id === editingValue ? 'admin-grid-row-editing' : '')}
          serverPagination={{
            rowCount: tagsTotal,
            paginationModel,
            onPaginationModelChange: setPaginationModel,
          }}
          initialState={{
            sorting: { sortModel: [{ field: 'sort_order', sort: 'asc' }] },
          }}
        />
      ) : null}
      {!loading && tagsTotal === 0 ? (
        <p className="admin-muted">No tags yet.</p>
      ) : null}
      {loading ? <p className="admin-muted">Loading tags…</p> : null}
    </AdminSection>
  );
}
