import { useCallback, useState } from 'react';
import type { FormEvent } from 'react';
import { type GridColDef } from '@mui/x-data-grid';
import type { AdminTagRow, TagDraft } from '../../lib/admin';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { useDeleteAdminTag, useUpsertAdminTag } from '../../hooks/useAdmin';
import { ADMIN_CATALOG_FORM_ID, scrollAdminPanelIntoView } from './adminScroll';
import AdminDataGrid from './AdminDataGrid';
import AdminGridAction from './AdminGridAction';
import AdminListToolbar from './AdminListToolbar';
import AdminSection from './AdminSection';
import AdminTagForm from './AdminTagForm';

type Props = {
  tags: AdminTagRow[];
  loading: boolean;
  error: string | null;
};

const EMPTY_DRAFT: TagDraft = { value: '', emoji: '', label: '', sort_order: 0 };

export default function AdminTags({ tags, loading, error }: Props) {
  const [draft, setDraft] = useState<TagDraft>(EMPTY_DRAFT);
  const [editingValue, setEditingValue] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
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

  const columns: GridColDef<AdminTagRow>[] = [
    {
      field: 'label',
      headerName: 'Tag',
      flex: 1.2,
      minWidth: 140,
      valueGetter: (_value, row) => `${row.emoji} ${row.label}`,
    },
    {
      field: 'value',
      headerName: 'Value',
      flex: 1,
      minWidth: 140,
      renderCell: ({ value }) => <code className="admin-code">{value}</code>,
    },
    {
      field: 'sort_order',
      headerName: 'Order',
      type: 'number',
      width: 90,
    },
    {
      field: 'usage_count',
      headerName: 'Used',
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
            active={editingValue === row.value}
            onClick={(e) => {
              e.stopPropagation();
              if (editingValue === row.value) {
                closeForm();
              } else {
                handleEdit(row);
              }
            }}
          >
            {editingValue === row.value ? 'Editing' : 'Edit'}
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
            + Add tag
          </button>
        ) : null}
      >
        <p className="admin-muted admin-table-summary">
          {tags.length} tag{tags.length === 1 ? '' : 's'} — click Edit on a row to change it
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

      {!loading && (
        <AdminDataGrid
          persistKey="admin-tags"
          rows={tags}
          columns={columns}
          getRowId={(row) => row.value}
          loading={loading}
          label="Tags"
          getRowClassName={(params) => (params.id === editingValue ? 'admin-grid-row-editing' : '')}
          initialState={{
            sorting: { sortModel: [{ field: 'sort_order', sort: 'asc' }] },
          }}
        />
      )}
      {loading && <p className="admin-muted">Loading tags…</p>}
    </AdminSection>
  );
}
