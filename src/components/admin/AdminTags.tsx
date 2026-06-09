import { useState } from 'react';
import type { FormEvent } from 'react';
import type { AdminTagRow, TagDraft } from '../../lib/admin';
import { deleteAdminTag, upsertAdminTag } from '../../lib/admin';

type Props = {
  tags: AdminTagRow[];
  loading: boolean;
  error: string | null;
  onChanged: () => void;
};

const EMPTY_DRAFT: TagDraft = { value: '', emoji: '', label: '', sort_order: 0 };

export default function AdminTags({ tags, loading, error, onChanged }: Props) {
  const [draft, setDraft] = useState<TagDraft>(EMPTY_DRAFT);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSaving(true);
    try {
      await upsertAdminTag(draft);
      setDraft(EMPTY_DRAFT);
      onChanged();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Could not save tag.');
    } finally {
      setSaving(false);
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
    setSaving(true);
    try {
      await deleteAdminTag(tag.value);
      if (draft.value === tag.value) setDraft(EMPTY_DRAFT);
      onChanged();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Could not delete tag.');
    } finally {
      setSaving(false);
    }
  };

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

      {error && <p className="admin-error admin-error-banner">{error}</p>}
      {loading && <p className="admin-muted">Loading tags…</p>}

      {!loading && (
        <div className="admin-table-wrap">
          <table className="admin-table admin-table--cards">
            <thead>
              <tr>
                <th>Tag</th>
                <th>Value</th>
                <th>Order</th>
                <th>Used</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {tags.map((tag) => (
                <tr key={tag.value}>
                  <td data-label="Tag">{tag.emoji} {tag.label}</td>
                  <td data-label="Value"><code className="admin-code">{tag.value}</code></td>
                  <td data-label="Order">{tag.sort_order}</td>
                  <td data-label="Used">{tag.usage_count}</td>
                  <td className="admin-tag-actions admin-td-actions">
                    <button type="button" className="admin-link-btn" onClick={() => handleEdit(tag)}>Edit</button>
                    <button type="button" className="admin-link-btn admin-link-danger" onClick={() => handleDelete(tag)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
