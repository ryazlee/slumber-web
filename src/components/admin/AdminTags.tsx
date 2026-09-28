import { useCallback, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import type { AdminTagRow, TagDraft, TagSuggestionRow } from '../../lib/admin';
import { getOptionalQueryErrorMessage } from '../../lib/queryError';
import { useAdminCatalogForm } from '../../hooks/useAdminCatalogForm';
import { usePaginatedFilters } from '../../hooks/usePaginatedFilters';
import {
  useAdminTagsCatalog,
  useApproveAdminTagSuggestion,
  useDeleteAdminTag,
  useUpsertAdminTag,
} from '../../hooks/useAdmin';
import AdminTagSuggestions from './AdminTagSuggestions';
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
    setFormOpen,
  } = useAdminCatalogForm(EMPTY_DRAFT);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const { paginationModel, setPaginationModel, filters: catalogFilters } = usePaginatedFilters({});

  const tagsQuery = useAdminTagsCatalog(catalogFilters);
  const tags = tagsQuery.data?.rows ?? [];
  const tagsTotal = tagsQuery.data?.total ?? 0;
  const loading = tagsQuery.isLoading;
  const error = getOptionalQueryErrorMessage(tagsQuery.error, 'Could not load tags.');

  const upsertMutation = useUpsertAdminTag();
  const deleteMutation = useDeleteAdminTag();
  const approveMutation = useApproveAdminTagSuggestion();
  const saving = upsertMutation.isPending || deleteMutation.isPending || approveMutation.isPending;

  const closePanel = useCallback(() => {
    setApprovingId(null);
    closeForm();
  }, [closeForm]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      if (approvingId) {
        await approveMutation.mutateAsync({ id: approvingId, tag: draft });
      } else {
        await upsertMutation.mutateAsync(draft);
      }
      closePanel();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Could not save tag.');
    }
  };

  const handleReview = (suggestion: TagSuggestionRow) => {
    setApprovingId(suggestion.id);
    setEditingValue(null);
    setDraft({
      value: suggestion.value,
      emoji: suggestion.emoji,
      label: suggestion.label,
      sort_order: 0,
    });
    setFormError(null);
    setFormOpen(true);
    scrollAdminPanelIntoView(ADMIN_CATALOG_FORM_ID);
  };

  const handleEdit = (tag: AdminTagRow) => {
    setApprovingId(null);
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
      if (editingValue === tag.value) closePanel();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Could not delete tag.');
    }
  };

  const columns = useMemo(
    () => buildAdminTagColumns({
      editingValue,
      onEdit: handleEdit,
      onCloseEdit: closePanel,
      onDelete: (tag) => { void handleDelete(tag); },
    }),
    [editingValue, closePanel],
  );

  return (
    <AdminSection
      className="admin-tags"
      error={error}
      lead="The factor-tag catalog people pick when logging a night. Custom tags wait here until you approve them. Usage lives under People → Tag usage."
    >
      <AdminListToolbar
        actions={!showForm ? (
          <button className="admin-button" type="button" onClick={() => {
            setApprovingId(null);
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

      <AdminTagSuggestions onApprove={handleReview} />

      {showForm ? (
        <AdminTagForm
          key={approvingId ?? editingValue ?? 'create'}
          panelId={ADMIN_CATALOG_FORM_ID}
          draft={draft}
          tags={tags}
          saving={saving}
          formError={formError}
          mode={approvingId ? 'approve' : undefined}
          onChange={setDraft}
          onSubmit={handleSubmit}
          onCancel={closePanel}
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
