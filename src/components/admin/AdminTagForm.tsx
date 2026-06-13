import { useRef } from 'react';
import type { FormEvent } from 'react';
import type { AdminTagRow, TagDraft } from '../../lib/admin';
import { labelToTagValue } from './catalogUtils';
import AdminEmojiPicker from './AdminEmojiPicker';
import AdminPanel from './AdminPanel';

type Props = {
  draft: TagDraft;
  tags: AdminTagRow[];
  saving: boolean;
  formError: string | null;
  panelId?: string;
  onChange: (draft: TagDraft) => void;
  onSubmit: (e: FormEvent) => void;
  onCancel: () => void;
};

export default function AdminTagForm({
  draft,
  tags,
  saving,
  formError,
  panelId,
  onChange,
  onSubmit,
  onCancel,
}: Props) {
  const isEditing = Boolean(draft.value && tags.some((t) => t.value === draft.value));
  const valueTouchedRef = useRef(false);
  const previewLabel = draft.label.trim() || 'Tag label';
  const previewEmoji = draft.emoji.trim() || '☕';

  const updateDraft = (next: TagDraft) => {
    onChange(next);
  };

  const updateLabel = (label: string) => {
    if (!isEditing && !valueTouchedRef.current) {
      updateDraft({ ...draft, label, value: labelToTagValue(label) });
      return;
    }
    updateDraft({ ...draft, label });
  };

  return (
    <AdminPanel
      id={panelId}
      title={isEditing ? `Edit “${draft.label || draft.value}”` : 'New tag'}
      description="Label is what users see. Value is auto-filled from the label — edit only if you need a specific key."
      highlighted={isEditing}
      headerAction={(
        <button className="admin-button admin-button-ghost" type="button" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
      )}
    >
      <div className="admin-catalog-preview">
        <span className="admin-catalog-preview-emoji" aria-hidden>{previewEmoji}</span>
        <div>
          <p className="admin-catalog-preview-title">{previewLabel}</p>
          <p className="admin-catalog-preview-sub">
            {draft.value ? <code className="admin-code">{draft.value}</code> : 'Value fills in as you type the label'}
          </p>
        </div>
      </div>

      <form className="admin-catalog-form" onSubmit={onSubmit}>
        <div className="admin-field">
          <label className="admin-label" htmlFor="tag-label">Display label</label>
          <input
            id="tag-label"
            className="admin-input"
            value={draft.label}
            onChange={(e) => updateLabel(e.target.value)}
            placeholder="Late Caffeine"
            required
            autoComplete="off"
            autoFocus
          />
        </div>

        <AdminEmojiPicker
          id="tag-emoji"
          label="Emoji"
          value={draft.emoji}
          onChange={(emoji) => updateDraft({ ...draft, emoji })}
          required
        />

        <div className="admin-field">
          <label className="admin-label" htmlFor="tag-value">Stored value</label>
          <input
            id="tag-value"
            className="admin-input"
            value={draft.value}
            onChange={(e) => {
              valueTouchedRef.current = true;
              updateDraft({ ...draft, value: e.target.value.toUpperCase() });
            }}
            placeholder="LATE_CAFFEINE"
            required
            disabled={isEditing}
            autoComplete="off"
            spellCheck={false}
          />
        </div>

        <div className="admin-field admin-field--narrow">
          <label className="admin-label" htmlFor="tag-sort">Sort order</label>
          <input
            id="tag-sort"
            className="admin-input"
            type="number"
            value={draft.sort_order}
            onChange={(e) => updateDraft({ ...draft, sort_order: Number(e.target.value) || 0 })}
          />
        </div>

        {formError ? <p className="admin-error">{formError}</p> : null}

        <div className="admin-form-actions admin-form-actions--sticky">
          <button className="admin-button" type="submit" disabled={saving}>
            {saving ? 'Saving…' : isEditing ? 'Save changes' : 'Create tag'}
          </button>
        </div>
      </form>
    </AdminPanel>
  );
}
