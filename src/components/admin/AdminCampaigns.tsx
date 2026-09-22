import { useState } from 'react';
import type { FormEvent } from 'react';
import type { AdminCampaignDraft, AdminCampaignRow } from '../../lib/admin';
import { getOptionalQueryErrorMessage } from '../../lib/queryError';
import {
  useAdminCampaigns,
  useSetAdminCampaignEnabled,
  useUpsertAdminCampaign,
} from '../../hooks/useAdmin';
import { useAssignableRoles } from '../../hooks/useCatalog';
import { getCachedRoleOptions } from '../../lib/userRoles';
import AdminFieldGroup from './AdminFieldGroup';
import AdminFilterBar, { AdminFilterField } from './AdminFilterBar';
import AdminPanel from './AdminPanel';
import AdminSection from './AdminSection';

const EMPTY_DRAFT: AdminCampaignDraft = {
  id: null,
  title: '',
  body: '',
  emoji: '🏁',
  cta_label: 'Join',
  challenge_id: '',
  target_roles: [],
  starts_at: null,
  ends_at: null,
  enabled: true,
  priority: 0,
};

function toLocalInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInput(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function audienceLabel(roles: string[]): string {
  return roles.length === 0 ? 'Everyone' : roles.join(', ');
}

export default function AdminCampaigns() {
  const campaignsQuery = useAdminCampaigns();
  const upsertMutation = useUpsertAdminCampaign();
  const enabledMutation = useSetAdminCampaignEnabled();
  const rolesQuery = useAssignableRoles();
  const roleOptions = rolesQuery.data ?? getCachedRoleOptions();

  const [draft, setDraft] = useState<AdminCampaignDraft>(EMPTY_DRAFT);
  const [formError, setFormError] = useState<string | null>(null);

  const campaigns = campaignsQuery.data ?? [];
  const error = getOptionalQueryErrorMessage(campaignsQuery.error, 'Could not load campaigns.');
  const editing = Boolean(draft.id);

  const handleEdit = (row: AdminCampaignRow) => {
    setDraft({
      id: row.id,
      title: row.title,
      body: row.body,
      emoji: row.emoji ?? '',
      cta_label: row.cta_label,
      challenge_id: row.challenge_id,
      target_roles: row.target_roles ?? [],
      starts_at: row.starts_at,
      ends_at: row.ends_at,
      enabled: row.enabled,
      priority: row.priority,
    });
    setFormError(null);
  };

  const handleReset = () => {
    setDraft(EMPTY_DRAFT);
    setFormError(null);
  };

  const toggleRole = (key: string) => {
    setDraft((prev) => ({
      ...prev,
      target_roles: prev.target_roles.includes(key)
        ? prev.target_roles.filter((role) => role !== key)
        : [...prev.target_roles, key],
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!draft.title.trim() || !draft.body.trim()) {
      setFormError('Title and body are required.');
      return;
    }
    if (!draft.challenge_id.trim()) {
      setFormError('Paste the open-link challenge id.');
      return;
    }
    try {
      await upsertMutation.mutateAsync({
        ...draft,
        title: draft.title.trim(),
        body: draft.body.trim(),
        emoji: draft.emoji.trim(),
        cta_label: draft.cta_label.trim() || 'Join',
        challenge_id: draft.challenge_id.trim(),
      });
      handleReset();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not save campaign.';
      if (message.includes('challenge_not_open_link')) {
        setFormError('That challenge needs an active invite link.');
      } else if (message.includes('challenge_not_found')) {
        setFormError('Challenge not found.');
      } else {
        setFormError(message);
      }
    }
  };

  return (
    <AdminSection
      lead="Popup once, then a Feed/Challenge banner and a pinned Notifications row. Hidden after they join the linked open challenge. Empty roles = everyone."
      error={error}
    >
      <AdminPanel
        title={editing ? 'Edit campaign' : 'New campaign'}
        description="Create the group race in the app with invite link on, then paste its id here. Target developer + founder first, then clear roles to ship."
        headerAction={editing ? (
          <button type="button" className="admin-button admin-button-ghost" onClick={handleReset}>
            New
          </button>
        ) : null}
      >
        <form className="admin-compose-form" onSubmit={handleSubmit}>
          <label className="admin-label" htmlFor="campaign-title">Title</label>
          <input
            id="campaign-title"
            className="admin-input"
            maxLength={80}
            value={draft.title}
            onChange={(e) => setDraft((prev) => ({ ...prev, title: e.target.value }))}
            placeholder="$15 global sleep challenge"
          />

          <label className="admin-label" htmlFor="campaign-body">Body</label>
          <textarea
            id="campaign-body"
            className="admin-input admin-textarea"
            rows={4}
            maxLength={500}
            value={draft.body}
            onChange={(e) => setDraft((prev) => ({ ...prev, body: e.target.value }))}
            placeholder="Join this week’s race. Free to enter."
          />

          <AdminFilterBar nested>
            <AdminFilterField label="Emoji" htmlFor="campaign-emoji">
              <input
                id="campaign-emoji"
                className="admin-input"
                maxLength={8}
                value={draft.emoji}
                onChange={(e) => setDraft((prev) => ({ ...prev, emoji: e.target.value }))}
              />
            </AdminFilterField>
            <AdminFilterField label="CTA" htmlFor="campaign-cta">
              <input
                id="campaign-cta"
                className="admin-input"
                maxLength={24}
                value={draft.cta_label}
                onChange={(e) => setDraft((prev) => ({ ...prev, cta_label: e.target.value }))}
              />
            </AdminFilterField>
            <AdminFilterField label="Priority" htmlFor="campaign-priority">
              <input
                id="campaign-priority"
                className="admin-input"
                type="number"
                value={draft.priority}
                onChange={(e) => setDraft((prev) => ({ ...prev, priority: Number(e.target.value) || 0 }))}
              />
            </AdminFilterField>
          </AdminFilterBar>

          <label className="admin-label" htmlFor="campaign-challenge">Challenge id</label>
          <input
            id="campaign-challenge"
            className="admin-input"
            value={draft.challenge_id}
            onChange={(e) => setDraft((prev) => ({ ...prev, challenge_id: e.target.value }))}
            placeholder="uuid from the open-link race"
          />

          <AdminFieldGroup title="Audience (none = everyone)">
            <div className="admin-role-checks">
              {roleOptions.map((role) => (
                <label key={role.key} className="admin-check">
                  <input
                    type="checkbox"
                    checked={draft.target_roles.includes(role.key)}
                    onChange={() => toggleRole(role.key)}
                  />
                  <span>{role.badge} {role.label}</span>
                </label>
              ))}
            </div>
          </AdminFieldGroup>

          <AdminFilterBar nested>
            <AdminFilterField label="Starts" htmlFor="campaign-starts">
              <input
                id="campaign-starts"
                className="admin-input"
                type="datetime-local"
                value={toLocalInput(draft.starts_at)}
                onChange={(e) => setDraft((prev) => ({ ...prev, starts_at: fromLocalInput(e.target.value) }))}
              />
            </AdminFilterField>
            <AdminFilterField label="Ends" htmlFor="campaign-ends">
              <input
                id="campaign-ends"
                className="admin-input"
                type="datetime-local"
                value={toLocalInput(draft.ends_at)}
                onChange={(e) => setDraft((prev) => ({ ...prev, ends_at: fromLocalInput(e.target.value) }))}
              />
            </AdminFilterField>
          </AdminFilterBar>

          <label className="admin-checkbox-label">
            <input
              type="checkbox"
              checked={draft.enabled}
              onChange={(e) => setDraft((prev) => ({ ...prev, enabled: e.target.checked }))}
            />
            <span>Enabled</span>
          </label>

          {formError ? <p className="admin-error">{formError}</p> : null}

          <div className="admin-form-actions">
            <button className="admin-button" type="submit" disabled={upsertMutation.isPending}>
              {upsertMutation.isPending ? 'Saving…' : editing ? 'Save campaign' : 'Create campaign'}
            </button>
          </div>
        </form>
      </AdminPanel>

      <AdminPanel title="Campaigns">
        {campaignsQuery.isLoading ? (
          <p className="admin-muted">Loading…</p>
        ) : campaigns.length === 0 ? (
          <p className="admin-empty-inline">No campaigns yet.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Audience</th>
                  <th>Challenge</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {campaigns.map((row) => (
                  <tr key={row.id}>
                    <td>
                      {row.emoji ? `${row.emoji} ` : ''}
                      {row.title}
                      <div className="admin-muted">{row.enabled ? 'On' : 'Off'} · p{row.priority}</div>
                    </td>
                    <td>{audienceLabel(row.target_roles ?? [])}</td>
                    <td>
                      {row.challenge_title || row.challenge_id}
                      <div className="admin-muted">
                        {row.open_link_enabled ? 'Open link' : 'Link off'} · {row.challenge_status}
                      </div>
                    </td>
                    <td>
                      {row.starts_at || row.ends_at
                        ? `${row.starts_at ? new Date(row.starts_at).toLocaleString() : 'now'} → ${row.ends_at ? new Date(row.ends_at).toLocaleString() : 'open'}`
                        : 'Open-ended'}
                    </td>
                    <td>
                      <button type="button" className="admin-button admin-button-ghost admin-button-sm" onClick={() => handleEdit(row)}>
                        Edit
                      </button>
                      <button
                        type="button"
                        className="admin-button admin-button-ghost admin-button-sm"
                        disabled={enabledMutation.isPending}
                        onClick={() => void enabledMutation.mutateAsync({ id: row.id, enabled: !row.enabled })}
                      >
                        {row.enabled ? 'Disable' : 'Enable'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminPanel>
    </AdminSection>
  );
}
