import { useMemo } from 'react';
import type { RecentUserRow } from '../../lib/admin';
import { useAvatarRoleStyles } from '../../hooks/useCatalog';
import { formatRoleLabel, type RoleOption } from '../../lib/userRoles';
import AdminFieldGroup from './AdminFieldGroup';
import AdminPanel from './AdminPanel';

type Props = {
  user: RecentUserRow;
  roleOptions: RoleOption[];
  draftRoles: string[];
  saving: boolean;
  error: string | null;
  onChange: (roles: string[]) => void;
  onSave: () => void;
  onCancel: () => void;
};

function RolePreview({ roleKey, roleStyles }: { roleKey: string | undefined; roleStyles: Map<string, { color: string; badge: string; label: string }> }) {
  const style = roleKey ? roleStyles.get(roleKey) : undefined;
  const ringColor = style?.color ?? 'var(--border)';

  return (
    <div className="admin-role-preview">
      <div
        className="admin-role-preview-ring"
        style={{ boxShadow: `0 0 0 3px ${ringColor}` }}
        aria-hidden
      >
        <span className="admin-role-preview-avatar">@</span>
      </div>
      <div className="admin-role-preview-meta">
        <p className="admin-role-preview-title">Avatar ring preview</p>
        <p className="admin-role-preview-detail">
          {style ? (
            <>{style.badge} {style.label}</>
          ) : (
            'No ring — assign a role and put it first'
          )}
        </p>
      </div>
    </div>
  );
}

export default function AdminUserRoleEditor({
  user,
  roleOptions,
  draftRoles,
  saving,
  error,
  onChange,
  onSave,
  onCancel,
}: Props) {
  const stylesQuery = useAvatarRoleStyles();
  const roleStyles = stylesQuery.data ?? new Map();

  const roleByKey = useMemo(
    () => new Map(roleOptions.map((opt) => [opt.key, opt])),
    [roleOptions],
  );

  const toggleRole = (key: string) => {
    if (draftRoles.includes(key)) {
      onChange(draftRoles.filter((r) => r !== key));
      return;
    }
    onChange([...draftRoles, key]);
  };

  const setPrimary = (key: string) => {
    onChange([key, ...draftRoles.filter((r) => r !== key)]);
  };

  const primaryKey = draftRoles[0];
  const hasChanges = JSON.stringify(draftRoles) !== JSON.stringify(
    (user.user_roles ?? []).filter((r) => roleByKey.has(r)),
  );

  const metaParts = [
    user.email,
    hasChanges ? 'Unsaved changes' : null,
  ].filter(Boolean);

  return (
    <AdminPanel
      title={`@${user.username}`}
      meta={metaParts.length ? metaParts.join(' · ') : undefined}
      description={<>Tap roles to assign or remove. The <strong>first</strong> role sets the avatar ring in the app.</>}
      highlighted
      headerAction={(
        <button type="button" className="admin-button admin-button-ghost" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
      )}
    >
      <RolePreview roleKey={primaryKey} roleStyles={roleStyles} />

      {draftRoles.length > 0 ? (
        <AdminFieldGroup title="Priority order">
          <ol className="admin-role-priority-list">
            {draftRoles.map((key, index) => {
              const opt = roleByKey.get(key);
              return (
                <li key={key} className="admin-role-priority-item">
                  <span className="admin-role-priority-rank">{index + 1}</span>
                  <span className="admin-role-priority-label">
                    {opt ? `${opt.badge} ${opt.label}` : formatRoleLabel(key)}
                    {index === 0 ? <span className="admin-role-primary">Ring</span> : null}
                  </span>
                  <span className="admin-role-priority-actions">
                    {index > 0 ? (
                      <button
                        type="button"
                        className="admin-action-btn admin-action-btn--ghost"
                        onClick={() => setPrimary(key)}
                      >
                        Set as ring
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="admin-action-btn admin-action-btn--danger"
                      onClick={() => toggleRole(key)}
                    >
                      Remove
                    </button>
                  </span>
                </li>
              );
            })}
          </ol>
        </AdminFieldGroup>
      ) : null}

      <AdminFieldGroup title="All roles">
        <div className="admin-role-picker-grid" role="group" aria-label="Toggle roles">
          {roleOptions.map((opt) => {
            const active = draftRoles.includes(opt.key);
            return (
              <button
                key={opt.key}
                type="button"
                className={`admin-role-picker-btn${active ? ' admin-role-picker-btn--active' : ''}`}
                aria-pressed={active}
                onClick={() => toggleRole(opt.key)}
              >
                <span className="admin-role-picker-badge">{opt.badge}</span>
                <span className="admin-role-picker-name">{opt.label}</span>
                {active ? <span className="admin-role-picker-check" aria-hidden>✓</span> : null}
              </button>
            );
          })}
        </div>
      </AdminFieldGroup>

      {error ? <p className="admin-error">{error}</p> : null}

      <div className="admin-form-actions">
        <button className="admin-button" type="button" onClick={onSave} disabled={saving || !hasChanges}>
          {saving ? 'Saving…' : 'Save changes'}
        </button>
        <button className="admin-button admin-button-ghost" type="button" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
      </div>
    </AdminPanel>
  );
}
