import type { FormEvent } from 'react';
import type { RoleDefinitionDraft } from '../../lib/admin';
import AdminColorField from './AdminColorField';
import AdminEmojiPicker from './AdminEmojiPicker';
import AdminPanel from './AdminPanel';

type Props = {
  draft: RoleDefinitionDraft;
  editingKey: string | null;
  saving: boolean;
  formError: string | null;
  panelId?: string;
  onChange: (draft: RoleDefinitionDraft) => void;
  onSubmit: (e: FormEvent) => void;
  onCancel: () => void;
};

function RoleDefinitionPreview({ draft }: { draft: RoleDefinitionDraft }) {
  const ringColor = draft.ring_color || '#9B7EDE';
  const badgeColor = draft.badge_color || undefined;
  const label = draft.label.trim() || 'Role label';
  const badge = draft.badge.trim() || '✨';

  return (
    <div className="admin-role-def-preview">
      <p className="admin-field-group-title">Live preview</p>
      <div className="admin-role-def-preview-card">
        <div
          className="admin-role-preview-ring admin-role-preview-ring--lg"
          style={{ boxShadow: `0 0 0 3px ${ringColor}` }}
        >
          <span className="admin-role-preview-avatar">@</span>
        </div>
        <div className="admin-role-def-preview-badge">
          <span
            className="admin-role-def-preview-pill"
            style={badgeColor ? { backgroundColor: badgeColor } : undefined}
          >
            {badge} {label}
          </span>
        </div>
        <ul className="admin-role-def-preview-flags">
          {draft.is_admin ? <li>Grants admin dashboard access</li> : null}
          {draft.assignable ? <li>Assignable to users</li> : <li>Hidden from assignment</li>}
        </ul>
      </div>
    </div>
  );
}

export default function AdminRoleDefinitionForm({
  draft,
  editingKey,
  saving,
  formError,
  panelId,
  onChange,
  onSubmit,
  onCancel,
}: Props) {
  const isEditing = editingKey !== null;

  return (
    <AdminPanel
      id={panelId}
      title={isEditing ? `Edit “${editingKey}”` : 'Add role'}
      description="First assigned role sets the user’s avatar ring in the app."
      headerAction={isEditing ? (
        <button className="admin-button admin-button-ghost" type="button" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
      ) : null}
      highlighted={isEditing}
    >
      <form className="admin-role-form-layout" onSubmit={onSubmit}>
        <RoleDefinitionPreview draft={draft} />

        <div className="admin-role-form-fields">
          <fieldset className="admin-form-section">
            <legend className="admin-form-section-title">Basics</legend>
            <div className="admin-catalog-form">
              <div className="admin-field">
                <label className="admin-label" htmlFor="role-label">Display label</label>
                <input
                  id="role-label"
                  className="admin-input"
                  value={draft.label}
                  onChange={(e) => onChange({ ...draft, label: e.target.value })}
                  placeholder="Early bird"
                  required
                  autoComplete="off"
                  autoFocus={!isEditing}
                />
              </div>

              <AdminEmojiPicker
                id="role-badge"
                label="Badge emoji"
                value={draft.badge}
                onChange={(badge) => onChange({ ...draft, badge })}
                required
              />

              <div className="admin-field">
                <label className="admin-label" htmlFor="role-key">Key</label>
                <input
                  id="role-key"
                  className="admin-input"
                  value={draft.key}
                  onChange={(e) => onChange({ ...draft, key: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                  placeholder="early_bird"
                  required
                  disabled={isEditing}
                  autoComplete="off"
                  spellCheck={false}
                />
                <p className="admin-field-hint">
                  {isEditing ? 'Key is fixed after create.' : 'Lowercase snake_case stored in profiles.user_roles.'}
                </p>
              </div>

              <div className="admin-field admin-field--narrow">
                <label className="admin-label" htmlFor="role-sort">Sort order</label>
                <input
                  id="role-sort"
                  className="admin-input"
                  type="number"
                  value={draft.sort_order}
                  onChange={(e) => onChange({ ...draft, sort_order: Number(e.target.value) || 0 })}
                />
              </div>
            </div>
          </fieldset>

          <fieldset className="admin-form-section">
            <legend className="admin-form-section-title">Colors</legend>
            <div className="admin-catalog-form">
              <AdminColorField
                id="role-ring"
                label="Avatar ring"
                value={draft.ring_color}
                onChange={(ring_color) => onChange({ ...draft, ring_color })}
              />
              <AdminColorField
                id="role-badge-color"
                label="Badge background"
                value={draft.badge_color ?? ''}
                onChange={(badge_color) => onChange({ ...draft, badge_color })}
                optional
              />
            </div>
          </fieldset>

          <fieldset className="admin-form-section">
            <legend className="admin-form-section-title">Access</legend>
            <div className="admin-role-checks">
              <label className="admin-check">
                <input
                  type="checkbox"
                  checked={draft.is_admin}
                  onChange={(e) => onChange({ ...draft, is_admin: e.target.checked })}
                />
                <span>
                  <strong>Admin dashboard</strong>
                  <span className="admin-check-desc">Can open this admin site</span>
                </span>
              </label>
              <label className="admin-check">
                <input
                  type="checkbox"
                  checked={draft.assignable}
                  onChange={(e) => onChange({ ...draft, assignable: e.target.checked })}
                />
                <span>
                  <strong>Assignable</strong>
                  <span className="admin-check-desc">Shows in user role pickers</span>
                </span>
              </label>
            </div>
          </fieldset>

          {formError ? <p className="admin-error">{formError}</p> : null}

          <div className="admin-form-actions admin-form-actions--sticky">
            <button className="admin-button" type="submit" disabled={saving}>
              {saving ? 'Saving…' : isEditing ? 'Save changes' : 'Create role'}
            </button>
          </div>
        </div>
      </form>
    </AdminPanel>
  );
}
