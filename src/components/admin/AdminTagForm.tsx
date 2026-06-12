import type { FormEvent } from 'react';
import type { AdminTagRow, TagDraft } from '../../lib/admin';
import AdminPanel from './AdminPanel';

type Props = {
  draft: TagDraft;
  tags: AdminTagRow[];
  saving: boolean;
  formError: string | null;
  onChange: (draft: TagDraft) => void;
  onSubmit: (e: FormEvent) => void;
  onCancel: () => void;
};

export default function AdminTagForm({
  draft,
  tags,
  saving,
  formError,
  onChange,
  onSubmit,
  onCancel,
}: Props) {
  const isEditing = draft.value && tags.some((t) => t.value === draft.value);

  return (
    <AdminPanel
      title={isEditing ? `Edit “${draft.label || draft.value}”` : 'Add tag'}
      description={<>Value is stored uppercase (e.g. <code>LATE_CAFFEINE</code>) and shown in the post composer.</>}
      highlighted={Boolean(isEditing)}
      headerAction={isEditing ? (
        <button className="admin-button admin-button-ghost" type="button" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
      ) : null}
    >
      <form className="admin-form-grid" onSubmit={onSubmit}>
        <div className="admin-field admin-field--span-2">
          <label className="admin-label" htmlFor="tag-value">Value</label>
          <input
            id="tag-value"
            className="admin-input"
            value={draft.value}
            onChange={(e) => onChange({ ...draft, value: e.target.value.toUpperCase() })}
            placeholder="LATE_CAFFEINE"
            required
            disabled={Boolean(isEditing)}
          />
        </div>
        <div className="admin-field">
          <label className="admin-label" htmlFor="tag-emoji">Emoji</label>
          <input
            id="tag-emoji"
            className="admin-input admin-input-emoji"
            value={draft.emoji}
            onChange={(e) => onChange({ ...draft, emoji: e.target.value })}
            placeholder="☕"
            required
          />
        </div>
        <div className="admin-field">
          <label className="admin-label" htmlFor="tag-sort">Sort order</label>
          <input
            id="tag-sort"
            className="admin-input"
            type="number"
            value={draft.sort_order}
            onChange={(e) => onChange({ ...draft, sort_order: Number(e.target.value) || 0 })}
          />
        </div>
        <div className="admin-field admin-field--span-2">
          <label className="admin-label" htmlFor="tag-label">Label</label>
          <input
            id="tag-label"
            className="admin-input"
            value={draft.label}
            onChange={(e) => onChange({ ...draft, label: e.target.value })}
            placeholder="Late Caffeine"
            required
          />
        </div>

        {formError ? <p className="admin-error admin-field--span-2">{formError}</p> : null}

        <div className="admin-form-actions admin-field--span-2">
          <button className="admin-button" type="submit" disabled={saving}>
            {saving ? 'Saving…' : isEditing ? 'Save changes' : 'Create tag'}
          </button>
        </div>
      </form>
    </AdminPanel>
  );
}
