import { useState } from 'react';
import type { FormEvent } from 'react';
import { type GridColDef } from '@mui/x-data-grid';
import type { AdminTagRow, TagDraft } from '../../lib/admin';
import { useDeleteAdminTag, useUpsertAdminTag } from '../../hooks/useAdmin';
import AdminDataGrid from './AdminDataGrid';
import AdminGridAction from './AdminGridAction';
import AdminSection, { AdminTableSummary } from './AdminSection';
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
  const [formError, setFormError] = useState<string | null>(null);
  const upsertMutation = useUpsertAdminTag();
  const deleteMutation = useDeleteAdminTag();
  const saving = upsertMutation.isPending || deleteMutation.isPending;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      await upsertMutation.mutateAsync(draft);
      setDraft(EMPTY_DRAFT);
      setEditingValue(null);
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
  };

  const handleCancel = () => {
    setDraft(EMPTY_DRAFT);
    setEditingValue(null);
    setFormError(null);
  };

  const handleDelete = async (tag: AdminTagRow) => {
    const msg = tag.usage_count > 0
      ? `Delete "${tag.label}"? It's on ${tag.usage_count} post(s). Existing posts will keep the key.`
      : `Delete "${tag.label}"?`;
    if (!window.confirm(msg)) return;

    setFormError(null);
    try {
      await deleteMutation.mutateAsync(tag.value);
      if (editingValue === tag.value) handleCancel();
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
                handleCancel();
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
    <AdminSection
      className="admin-tags"
      error={error}
    >
      <AdminTagForm
        draft={draft}
        tags={tags}
        saving={saving}
        formError={formError}
        onChange={setDraft}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />

      {!loading && (
        <>
        <AdminTableSummary>
          {tags.length} tag{tags.length === 1 ? '' : 's'} — click Edit in the table to load a tag into the form above
        </AdminTableSummary>
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
        </>
      )}
      {loading && <p className="admin-muted">Loading tags…</p>}
    </AdminSection>
  );
}
