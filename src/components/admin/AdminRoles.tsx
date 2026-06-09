import { useState } from 'react';
import type { FormEvent } from 'react';
import type { AdminRoleDefinitionRow, RoleDefinitionDraft } from '../../lib/admin';
import { deleteAdminRoleDefinition, upsertAdminRoleDefinition } from '../../lib/admin';
import { clearRoleDefinitionCache } from '../../lib/userRoles';

type Props = {
  roles: AdminRoleDefinitionRow[];
  loading: boolean;
  error: string | null;
  onChanged: () => void;
};

const EMPTY_DRAFT: RoleDefinitionDraft = {
  key: '',
  label: '',
  badge: '',
  ring_color: '#9B7EDE',
  badge_color: '',
  is_admin: false,
  assignable: true,
  sort_order: 0,
};

function RoleSwatch({ color }: { color: string }) {
  return (
    <span
      className="admin-role-swatch"
      style={{ backgroundColor: color }}
      aria-hidden="true"
    />
  );
}

export default function AdminRoles({ roles, loading, error, onChanged }: Props) {
  const [draft, setDraft] = useState<RoleDefinitionDraft>(EMPTY_DRAFT);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const isEditing = editingKey !== null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSaving(true);
    try {
      await upsertAdminRoleDefinition(draft);
      clearRoleDefinitionCache();
      setDraft(EMPTY_DRAFT);
      setEditingKey(null);
      onChanged();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Could not save role.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (role: AdminRoleDefinitionRow) => {
    setEditingKey(role.key);
    setDraft({
      key: role.key,
      label: role.label,
      badge: role.badge,
      ring_color: role.ring_color,
      badge_color: role.badge_color ?? '',
      is_admin: role.is_admin,
      assignable: role.assignable,
      sort_order: role.sort_order,
    });
    setFormError(null);
  };

  const handleCancel = () => {
    setDraft(EMPTY_DRAFT);
    setEditingKey(null);
    setFormError(null);
  };

  const handleDelete = async (role: AdminRoleDefinitionRow) => {
    if (role.usage_count > 0) {
      window.alert(`Cannot delete "${role.label}" — ${role.usage_count} user(s) still have this role. Remove it from users first.`);
      return;
    }
    if (!window.confirm(`Delete role "${role.label}"?`)) return;

    setFormError(null);
    setSaving(true);
    try {
      await deleteAdminRoleDefinition(role.key);
      clearRoleDefinitionCache();
      if (editingKey === role.key) handleCancel();
      onChanged();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not delete role.';
      setFormError(message.includes('role_in_use')
        ? 'This role is still assigned to users. Remove it from users first.'
        : message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-tags">
      <div className="admin-card">
        <h2 className="admin-section-title">{isEditing ? `Edit ${editingKey}` : 'Add role'}</h2>
        <p className="admin-muted admin-tags-hint">
          Defines avatar ring colors, badges, and labels. Keys go in <code>profiles.user_roles</code>; first key = ring in the app.
          <code>is_admin</code> grants access to this dashboard.
        </p>
        <form className="admin-form admin-tag-form" onSubmit={handleSubmit}>
          <div className="admin-tag-form-fields">
            <div className="admin-tag-form-row admin-tag-form-span-2">
              <label className="admin-label" htmlFor="role-key">Key</label>
              <input
                id="role-key"
                className="admin-input"
                value={draft.key}
                onChange={(e) => setDraft({ ...draft, key: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                placeholder="early_bird"
                required
                disabled={isEditing}
              />
            </div>
            <div className="admin-tag-form-row admin-tag-form-span-2">
              <label className="admin-label" htmlFor="role-label">Label</label>
              <input
                id="role-label"
                className="admin-input"
                value={draft.label}
                onChange={(e) => setDraft({ ...draft, label: e.target.value })}
                placeholder="Early bird"
                required
              />
            </div>
            <div className="admin-tag-form-row">
              <label className="admin-label" htmlFor="role-badge">Badge</label>
              <input
                id="role-badge"
                className="admin-input admin-input-emoji"
                value={draft.badge}
                onChange={(e) => setDraft({ ...draft, badge: e.target.value })}
                placeholder="🌅"
                required
              />
            </div>
            <div className="admin-tag-form-row">
              <label className="admin-label" htmlFor="role-sort">Sort order</label>
              <input
                id="role-sort"
                className="admin-input"
                type="number"
                value={draft.sort_order}
                onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) || 0 })}
              />
            </div>
            <div className="admin-tag-form-row">
              <label className="admin-label" htmlFor="role-ring">Ring color</label>
              <input
                id="role-ring"
                className="admin-input admin-input-color"
                type="color"
                value={draft.ring_color}
                onChange={(e) => setDraft({ ...draft, ring_color: e.target.value })}
              />
            </div>
            <div className="admin-tag-form-row">
              <label className="admin-label" htmlFor="role-badge-color">Badge color (optional)</label>
              <input
                id="role-badge-color"
                className="admin-input admin-input-color"
                type="color"
                value={draft.badge_color || '#000000'}
                onChange={(e) => setDraft({ ...draft, badge_color: e.target.value })}
              />
            </div>
            <div className="admin-tag-form-row admin-role-checks admin-tag-form-span-2">
              <label className="admin-check">
                <input
                  type="checkbox"
                  checked={draft.is_admin}
                  onChange={(e) => setDraft({ ...draft, is_admin: e.target.checked })}
                />
                Admin access (dashboard)
              </label>
              <label className="admin-check">
                <input
                  type="checkbox"
                  checked={draft.assignable}
                  onChange={(e) => setDraft({ ...draft, assignable: e.target.checked })}
                />
                Assignable to users
              </label>
            </div>
          </div>
          {formError && <p className="admin-error">{formError}</p>}
          <div className="admin-tag-form-actions">
            <button className="admin-button" type="submit" disabled={saving}>
              {saving ? 'Saving…' : isEditing ? 'Update role' : 'Add role'}
            </button>
            {isEditing && (
              <button className="admin-button admin-button-ghost" type="button" onClick={handleCancel} disabled={saving}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {error && <p className="admin-error admin-error-banner">{error}</p>}
      {loading && <p className="admin-muted">Loading roles…</p>}

      {!loading && (
        <div className="admin-table-wrap">
          <table className="admin-table admin-table--cards">
            <thead>
              <tr>
                <th>Role</th>
                <th>Key</th>
                <th>Colors</th>
                <th>Flags</th>
                <th>Order</th>
                <th>Users</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {roles.map((role) => (
                <tr key={role.key}>
                  <td data-label="Role">{role.badge} {role.label}</td>
                  <td data-label="Key"><code className="admin-code">{role.key}</code></td>
                  <td data-label="Colors" className="admin-td-stack">
                    <span className="admin-color-row">
                      <RoleSwatch color={role.ring_color} /> Ring {role.ring_color}
                    </span>
                    {role.badge_color && (
                      <span className="admin-color-row">
                        <RoleSwatch color={role.badge_color} /> Badge {role.badge_color}
                      </span>
                    )}
                  </td>
                  <td data-label="Flags" className="admin-td-stack">
                    {role.is_admin ? 'Admin' : '—'}
                    {role.assignable ? ' · Assignable' : ' · Hidden'}
                  </td>
                  <td data-label="Order">{role.sort_order}</td>
                  <td data-label="Users">{role.usage_count}</td>
                  <td className="admin-tag-actions admin-td-actions">
                    <button type="button" className="admin-link-btn" onClick={() => handleEdit(role)}>Edit</button>
                    <button type="button" className="admin-link-btn admin-link-danger" onClick={() => handleDelete(role)}>Delete</button>
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
