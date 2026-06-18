import { useCallback, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import type { AdminTagRow, TagDraft } from '../../lib/admin';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { useAdminGridPagination } from '../../hooks/useAdminGridPagination';
import { useAdminTagsCatalog, useDeleteAdminTag, useUpsertAdminTag } from '../../hooks/useAdmin';
import { ADMIN_CATALOG_FORM_ID, scrollAdminPanelIntoView } from './adminScroll';
import { buildAdminTagColumns } from './catalogGridColumns';
import AdminDataGrid from './AdminDataGrid';
import AdminListToolbar from './AdminListToolbar';
import AdminSection from './AdminSection';
import AdminTagForm from './AdminTagForm';

const EMPTY_DRAFT: TagDraft = { value: '', emoji: '', label: '', sort_order: 0 };

export default function AdminTags() {
  const [draft, setDraft] = useState<TagDraft>(EMPTY_DRAFT);
  const [editingValue, setEditingValue] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const { paginationModel, setPaginationModel } = useAdminGridPagination();
  const catalogFilters = useMemo(() => ({
    page: paginationModel.page,
    pageSize: paginationModel.pageSize,
  }), [paginationModel.page, paginationModel.pageSize]);

  const tagsQuery = useAdminTagsCatalog(catalogFilters);
  const tags = tagsQuery.data?.rows ?? [];
  const tagsTotal = tagsQuery.data?.total ?? 0;
  const loading = tagsQuery.isLoading;
  const error = tagsQuery.error instanceof Error
    ? tagsQuery.error.message
    : tagsQuery.error
      ? 'Could not load tags.'
      : null;

  const upsertMutation = useUpsertAdminTag();
  const deleteMutation = useDeleteAdminTag();
  const saving = upsertMutation.isPending || deleteMutation.isPending;
  const showForm = formOpen || editingValue !== null;

  const closeForm = useCallback(() => {
    setDraft(EMPTY_DRAFT);
    setEditingValue(null);
    setFormOpen(false);
    setFormError(null);
  }, []);

  useEscapeKey(showForm, closeForm);

  const openCreate = () => {
    setDraft(EMPTY_DRAFT);
    setEditingValue(null);
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
      setFormError(err instanceof Error ? err.message : 'Could not save tag.');
    }
  };

  const handleEdit = (tag: AdminTagRow) => {
    setEditingValue(tag.value);
    setFormOpen(true);
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
          <button className="admin-button" type="button" onClick={openCreate}>
            + Add tag
          </button>
        ) : null}
      >
        <p className="admin-muted admin-table-summary">
          {tagsTotal} tag{tagsTotal === 1 ? '' : 's'}
          {' · toolbar search and column filters apply to the current page · click Edit to change'}
        </p>
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
          paginationMode="server"
          rowCount={tagsTotal}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[25, 50, 100]}
          disableColumnSorting
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
