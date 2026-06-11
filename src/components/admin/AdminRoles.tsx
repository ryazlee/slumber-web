import { useState } from 'react';
import type { FormEvent } from 'react';
import { type GridColDef } from '@mui/x-data-grid';
import type { AdminRoleDefinitionRow, RoleDefinitionDraft } from '../../lib/admin';
import { deleteAdminRoleDefinition, upsertAdminRoleDefinition } from '../../lib/admin';
import { clearRoleDefinitionCache } from '../../lib/userRoles';
import AdminDataGrid from './AdminDataGrid';

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

  const columns: GridColDef<AdminRoleDefinitionRow>[] = [
    {
      field: 'label',
      headerName: 'Role',
      flex: 1,
      minWidth: 140,
      valueGetter: (_value, row) => `${row.badge} ${row.label}`,
    },
    {
      field: 'key',
      headerName: 'Key',
      flex: 1,
      minWidth: 120,
      renderCell: ({ value }) => <code className="admin-code">{value}</code>,
    },
    {
      field: 'ring_color',
      headerName: 'Colors',
      flex: 1.2,
      minWidth: 180,
      sortable: false,
      valueGetter: (_value, row) => `${row.ring_color} ${row.badge_color ?? ''}`,
      renderCell: ({ row }) => (
        <div className="admin-td-stack">
          <span className="admin-color-row">
            <RoleSwatch color={row.ring_color} /> Ring {row.ring_color}
          </span>
          {row.badge_color ? (
            <span className="admin-color-row">
              <RoleSwatch color={row.badge_color} /> Badge {row.badge_color}
            </span>
          ) : null}
        </div>
      ),
    },
    {
      field: 'is_admin',
      headerName: 'Flags',
      flex: 1,
      minWidth: 120,
      valueGetter: (_value, row) => `${row.is_admin ? 'Admin' : ''} ${row.assignable ? 'Assignable' : 'Hidden'}`,
      renderCell: ({ row }) => (
        <span>
          {row.is_admin ? 'Admin' : '—'}
          {row.assignable ? ' · Assignable' : ' · Hidden'}
        </span>
      ),
    },
    {
      field: 'sort_order',
      headerName: 'Order',
      type: 'number',
      width: 90,
    },
    {
      field: 'usage_count',
      headerName: 'Users',
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

      <p className="admin-muted admin-filter-summary">
        {roles.length} role{roles.length === 1 ? '' : 's'} — sort and filter in the table toolbar
      </p>

      {error && <p className="admin-error admin-error-banner">{error}</p>}

      {!loading && (
        <AdminDataGrid
          rows={roles}
          columns={columns}
          getRowId={(row) => row.key}
          loading={loading}
          label="Roles"
          initialState={{
            sorting: { sortModel: [{ field: 'sort_order', sort: 'asc' }] },
          }}
        />
      )}
      {loading && <p className="admin-muted">Loading roles…</p>}
    </div>
  );
}
