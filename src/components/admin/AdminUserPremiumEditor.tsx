import AdminFieldGroup from './AdminFieldGroup';
import AdminPanel from './AdminPanel';
import { ADMIN_CATALOG_FORM_ID } from './adminScroll';

type Props = {
  username: string;
  isPremium: boolean;
  premiumUntil: string | null;
  draftGranted: boolean;
  draftUntil: string;
  saving: boolean;
  error: string | null;
  onGrantChange: (granted: boolean) => void;
  onUntilChange: (value: string) => void;
  onPreset: (preset: 'year' | 'lifetime') => void;
  onSave: () => void;
  onCancel: () => void;
  hasChanges: boolean;
};

function formatExpiry(value: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function AdminUserPremiumEditor({
  username,
  isPremium,
  premiumUntil,
  draftGranted,
  draftUntil,
  saving,
  error,
  onGrantChange,
  onUntilChange,
  onPreset,
  onSave,
  onCancel,
  hasChanges,
}: Props) {
  const statusLabel = isPremium
    ? `Active${premiumUntil ? ` until ${formatExpiry(premiumUntil)}` : ''}`
    : 'Not subscribed';

  return (
    <AdminPanel
      id={`${ADMIN_CATALOG_FORM_ID}-premium`}
      title={`Premium · @${username}`}
      meta={hasChanges ? 'Unsaved changes' : statusLabel}
      description={(
        <>
          Sets <code>is_premium</code> for full feature access. This is separate from the cosmetic
          {' '}<strong>premium</strong> avatar role above.
        </>
      )}
    >
      <AdminFieldGroup title="Entitlement">
        <label className="admin-checkbox-label">
          <input
            type="checkbox"
            checked={draftGranted}
            onChange={(e) => onGrantChange(e.target.checked)}
            disabled={saving}
          />
          <span>Grant Premium access</span>
        </label>
      </AdminFieldGroup>

      {draftGranted ? (
        <AdminFieldGroup title="Expires">
          <div className="admin-form-actions">
            <input
              className="admin-input"
              type="date"
              value={draftUntil}
              onChange={(e) => onUntilChange(e.target.value)}
              disabled={saving}
            />
            <button
              type="button"
              className="admin-button admin-button-ghost"
              onClick={() => onPreset('year')}
              disabled={saving}
            >
              +1 year
            </button>
            <button
              type="button"
              className="admin-button admin-button-ghost"
              onClick={() => onPreset('lifetime')}
              disabled={saving}
            >
              Lifetime
            </button>
          </div>
        </AdminFieldGroup>
      ) : null}

      {error ? <p className="admin-error">{error}</p> : null}

      <div className="admin-form-actions">
        <button className="admin-button" type="button" onClick={onSave} disabled={saving || !hasChanges}>
          {saving ? 'Saving…' : 'Save Premium'}
        </button>
        <button className="admin-button admin-button-ghost" type="button" onClick={onCancel} disabled={saving}>
          Reset
        </button>
      </div>
    </AdminPanel>
  );
}
