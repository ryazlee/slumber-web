import { useState } from 'react';
import type { FormEvent } from 'react';
import { type GridColDef } from '@mui/x-data-grid';
import type { AdminTagRow, TagDraft } from '../../lib/admin';
import { useDeleteAdminTag, useUpsertAdminTag } from '../../hooks/useAdmin';
import AdminDataGrid from './AdminDataGrid';

type Props = {
  tags: AdminTagRow[];
  loading: boolean;
  error: string | null;
};

const EMPTY_DRAFT: TagDraft = { value: '', emoji: '', label: '', sort_order: 0 };

export default function AdminTags({ tags, loading, error }: Props) {
  const [draft, setDraft] = useState<TagDraft>(EMPTY_DRAFT);
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
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Could not save tag.');
    }
  };

  const handleEdit = (tag: AdminTagRow) => {
    setDraft({
      value: tag.value,
      emoji: tag.emoji,
      label: tag.label,
      sort_order: tag.sort_order,
    });
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
      if (draft.value === tag.value) setDraft(EMPTY_DRAFT);
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
          <button
            type="button"
            className="admin-link-btn"
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(row);
            }}
          >
            Edit
          </button>
          <button
            type="button"
            className="admin-link-btn admin-link-danger"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(row);
            }}
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="admin-tags">
      <div className="admin-card">
        <h2 className="admin-section-title">{draft.value ? 'Edit tag' : 'Add tag'}</h2>
        <p className="admin-muted admin-tags-hint">
          Value is stored uppercase (e.g. <code>LATE_CAFFEINE</code>). Shown in the post composer.
        </p>
        <form className="admin-form admin-tag-form" onSubmit={handleSubmit}>
          <div className="admin-tag-form-fields">
            <div className="admin-tag-form-row admin-tag-form-span-2">
              <label className="admin-label" htmlFor="tag-value">Value</label>
              <input
                id="tag-value"
                className="admin-input"
                value={draft.value}
                onChange={(e) => setDraft({ ...draft, value: e.target.value.toUpperCase() })}
                placeholder="LATE_CAFFEINE"
                required
              />
            </div>
            <div className="admin-tag-form-row">
              <label className="admin-label" htmlFor="tag-emoji">Emoji</label>
              <input
                id="tag-emoji"
                className="admin-input admin-input-emoji"
                value={draft.emoji}
                onChange={(e) => setDraft({ ...draft, emoji: e.target.value })}
                placeholder="☕"
                required
              />
            </div>
            <div className="admin-tag-form-row">
              <label className="admin-label" htmlFor="tag-sort">Sort order</label>
              <input
                id="tag-sort"
                className="admin-input"
                type="number"
                value={draft.sort_order}
                onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) || 0 })}
              />
            </div>
            <div className="admin-tag-form-row admin-tag-form-span-2">
              <label className="admin-label" htmlFor="tag-label">Label</label>
              <input
                id="tag-label"
                className="admin-input"
                value={draft.label}
                onChange={(e) => setDraft({ ...draft, label: e.target.value })}
                placeholder="Late Caffeine"
                required
              />
            </div>
          </div>
          {formError && <p className="admin-error">{formError}</p>}
          <div className="admin-tag-form-actions">
            <button className="admin-button" type="submit" disabled={saving}>
              {saving ? 'Saving…' : draft.value && tags.some((t) => t.value === draft.value) ? 'Update tag' : 'Add tag'}
            </button>
            {draft.value ? (
              <button
                className="admin-button admin-button-ghost"
                type="button"
                onClick={() => { setDraft(EMPTY_DRAFT); setFormError(null); }}
              >
                Cancel edit
              </button>
            ) : null}
          </div>
        </form>
      </div>

      <p className="admin-muted admin-filter-summary">
        {tags.length} tag{tags.length === 1 ? '' : 's'} — sort and filter in the table toolbar
      </p>

      {error && <p className="admin-error admin-error-banner">{error}</p>}

      {!loading && (
        <AdminDataGrid
          persistKey="admin-tags"
          rows={tags}
          columns={columns}
          getRowId={(row) => row.value}
          loading={loading}
          label="Tags"
          initialState={{
            sorting: { sortModel: [{ field: 'sort_order', sort: 'asc' }] },
          }}
        />
      )}
      {loading && <p className="admin-muted">Loading tags…</p>}
    </div>
  );
}
