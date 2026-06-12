import type { FormEvent } from 'react';
import type { RoleDefinitionDraft } from '../../lib/admin';

type Props = {
  draft: RoleDefinitionDraft;
  editingKey: string | null;
  saving: boolean;
  formError: string | null;
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
      <p className="admin-label">Live preview</p>
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
  onChange,
  onSubmit,
  onCancel,
}: Props) {
  const isEditing = editingKey !== null;

  return (
    <div className="admin-card admin-role-form-card">
      <div className="admin-role-form-header">
        <div>
          <h2 className="admin-section-title">{isEditing ? `Edit “${editingKey}”` : 'Add role'}</h2>
          <p className="admin-muted admin-tags-hint">
            Roles control avatar rings, badges, and admin access. Users&apos; <strong>first</strong> role sets their ring in the app.
          </p>
        </div>
        {isEditing ? (
          <button className="admin-button admin-button-ghost" type="button" onClick={onCancel} disabled={saving}>
            Cancel edit
          </button>
        ) : null}
      </div>

      <form className="admin-role-form-layout" onSubmit={onSubmit}>
        <div className="admin-role-form-fields">
          <fieldset className="admin-form-section">
            <legend className="admin-form-section-title">Identity</legend>
            <div className="admin-form-section-grid">
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
                />
                <p className="admin-field-hint">Stored in <code>profiles.user_roles</code>. Cannot change after create.</p>
              </div>
              <div className="admin-field">
                <label className="admin-label" htmlFor="role-label">Display label</label>
                <input
                  id="role-label"
                  className="admin-input"
                  value={draft.label}
                  onChange={(e) => onChange({ ...draft, label: e.target.value })}
                  placeholder="Early bird"
                  required
                />
              </div>
              <div className="admin-field">
                <label className="admin-label" htmlFor="role-badge">Badge emoji</label>
                <input
                  id="role-badge"
                  className="admin-input admin-input-emoji"
                  value={draft.badge}
                  onChange={(e) => onChange({ ...draft, badge: e.target.value })}
                  placeholder="🌅"
                  required
                />
              </div>
              <div className="admin-field">
                <label className="admin-label" htmlFor="role-sort">Sort order</label>
                <input
                  id="role-sort"
                  className="admin-input"
                  type="number"
                  value={draft.sort_order}
                  onChange={(e) => onChange({ ...draft, sort_order: Number(e.target.value) || 0 })}
                />
                <p className="admin-field-hint">Lower numbers appear first in pickers.</p>
              </div>
            </div>
          </fieldset>

          <fieldset className="admin-form-section">
            <legend className="admin-form-section-title">Appearance</legend>
            <div className="admin-form-section-grid">
              <div className="admin-field">
                <label className="admin-label" htmlFor="role-ring">Avatar ring color</label>
                <div className="admin-color-input-row">
                  <input
                    id="role-ring"
                    className="admin-input admin-input-color"
                    type="color"
                    value={draft.ring_color}
                    onChange={(e) => onChange({ ...draft, ring_color: e.target.value })}
                  />
                  <code className="admin-code">{draft.ring_color}</code>
                </div>
              </div>
              <div className="admin-field">
                <label className="admin-label" htmlFor="role-badge-color">Badge background (optional)</label>
                <div className="admin-color-input-row">
                  <input
                    id="role-badge-color"
                    className="admin-input admin-input-color"
                    type="color"
                    value={draft.badge_color || '#000000'}
                    onChange={(e) => onChange({ ...draft, badge_color: e.target.value })}
                  />
                  <code className="admin-code">{draft.badge_color || 'default'}</code>
                </div>
              </div>
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

          <div className="admin-tag-form-actions">
            <button className="admin-button" type="submit" disabled={saving}>
              {saving ? 'Saving…' : isEditing ? 'Save changes' : 'Create role'}
            </button>
          </div>
        </div>

        <RoleDefinitionPreview draft={draft} />
      </form>
    </div>
  );
}
