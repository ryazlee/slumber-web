import { useState } from 'react';
import type { FormEvent } from 'react';
import type { AdminCampaignActionKind, AdminCampaignDraft, AdminCampaignRow } from '../../lib/admin';
import { defaultAdminCampaignCta, uploadAdminCampaignImage } from '../../lib/admin';
import { getOptionalQueryErrorMessage } from '../../lib/queryError';
import {
  useAdminCampaigns,
  useCreateAdminSlumberChallenge,
  useSetAdminCampaignEnabled,
  useStartAdminSlumberChallenge,
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
  action_kind: 'challenge',
  challenge_id: '',
  cta_url: '',
  image_url: '',
  target_roles: [],
  starts_at: null,
  ends_at: null,
  enabled: true,
  priority: 0,
};

const EMPTY_SLUMBER = {
  title: '',
  goalHours: '40',
  days: '10',
  noExpiration: false,
  maxParticipants: '',
};

const DEFAULT_EMOJI: Record<AdminCampaignActionKind, string> = {
  challenge: '🏁',
  message: '📣',
  url: '🔗',
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

function actionLabel(kind: AdminCampaignActionKind | null | undefined): string {
  if (kind === 'message') return 'Message';
  if (kind === 'url') return 'Link';
  return 'Challenge';
}

function parseActionKind(value: string | null | undefined): AdminCampaignActionKind {
  if (value === 'message' || value === 'url' || value === 'challenge') return value;
  return 'challenge';
}

export default function AdminCampaigns() {
  const campaignsQuery = useAdminCampaigns();
  const upsertMutation = useUpsertAdminCampaign();
  const enabledMutation = useSetAdminCampaignEnabled();
  const createSlumberMutation = useCreateAdminSlumberChallenge();
  const startSlumberMutation = useStartAdminSlumberChallenge();
  const rolesQuery = useAssignableRoles();
  const roleOptions = rolesQuery.data ?? getCachedRoleOptions();

  const [draft, setDraft] = useState<AdminCampaignDraft>(EMPTY_DRAFT);
  const [slumber, setSlumber] = useState(EMPTY_SLUMBER);
  const [slumberNote, setSlumberNote] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const campaigns = campaignsQuery.data ?? [];
  const error = getOptionalQueryErrorMessage(campaignsQuery.error, 'Could not load campaigns.');
  const editing = Boolean(draft.id);

  const setActionKind = (action_kind: AdminCampaignActionKind) => {
    setDraft((prev) => {
      const wasDefaultCta = !prev.cta_label.trim()
        || Object.values({
          challenge: defaultAdminCampaignCta('challenge'),
          message: defaultAdminCampaignCta('message'),
          url: defaultAdminCampaignCta('url'),
        }).includes(prev.cta_label);
      const wasDefaultEmoji = !prev.emoji.trim()
        || Object.values(DEFAULT_EMOJI).includes(prev.emoji);
      return {
        ...prev,
        action_kind,
        cta_label: wasDefaultCta ? defaultAdminCampaignCta(action_kind) : prev.cta_label,
        emoji: wasDefaultEmoji ? DEFAULT_EMOJI[action_kind] : prev.emoji,
      };
    });
  };

  const handleEdit = (row: AdminCampaignRow) => {
    const action_kind = parseActionKind(row.action_kind);
    setDraft({
      id: row.id,
      title: row.title,
      body: row.body,
      emoji: row.emoji ?? '',
      cta_label: row.cta_label,
      action_kind,
      challenge_id: row.challenge_id ?? '',
      cta_url: row.cta_url ?? '',
      image_url: row.image_url ?? '',
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
    setSlumber(EMPTY_SLUMBER);
    setSlumberNote(null);
    setFormError(null);
  };

  const handleCreateSlumber = async () => {
    setFormError(null);
    setSlumberNote(null);
    const title = slumber.title.trim() || draft.title.trim();
    const goalHours = Number(slumber.goalHours);
    const days = Number(slumber.days);
    const maxRaw = slumber.maxParticipants.trim();
    const maxParticipants = maxRaw ? Number(maxRaw) : null;
    if (!title) {
      setFormError('Add a title for the Slumber challenge.');
      return;
    }
    if (!Number.isFinite(goalHours) || goalHours < 10 || goalHours > 100) {
      setFormError('Goal must be between 10 and 100 hours.');
      return;
    }
    if (!slumber.noExpiration && (!Number.isFinite(days) || days < 1 || days > 100)) {
      setFormError('Duration must be between 1 and 100 days.');
      return;
    }
    if (maxParticipants != null && (!Number.isInteger(maxParticipants) || maxParticipants < 2)) {
      setFormError('Max racers must be at least 2, or left blank.');
      return;
    }
    try {
      const created = await createSlumberMutation.mutateAsync({
        title,
        goalMinutes: Math.round(goalHours * 60),
        noExpiration: slumber.noExpiration,
        expiresInDays: slumber.noExpiration ? 10 : days,
        maxParticipants,
      });
      setDraft((prev) => ({ ...prev, challenge_id: created.id }));
      setSlumberNote(`Created “${created.title}”. Save the campaign to publish it. You are not a racer, so the join banner can show on your phone.`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not create challenge.';
      if (message.includes('invalid_goal')) {
        setFormError('Goal must be between 10 and 100 hours.');
      } else if (message.includes('invalid_title')) {
        setFormError('Challenge title must be 1–80 characters.');
      } else if (message.includes('invalid_expiration_days')) {
        setFormError('Duration must be between 1 and 100 days.');
      } else if (message.includes('invalid_max_participants')) {
        setFormError('Max racers must be between 2 and 10,000.');
      } else {
        setFormError(message);
      }
    }
  };

  const handleStartSlumber = async (challengeId: string) => {
    setListError(null);
    try {
      await startSlumberMutation.mutateAsync(challengeId);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not start challenge.';
      if (message.includes('insufficient_participants')) {
        setListError('Need at least one racer before starting.');
      } else if (message.includes('challenge_not_pending')) {
        setListError('That race has already started.');
      } else {
        setListError(message);
      }
    }
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
    if (draft.action_kind === 'challenge' && !draft.challenge_id.trim()) {
      setFormError('Paste the open-link challenge id.');
      return;
    }
    if (draft.action_kind === 'url' && !draft.cta_url.trim()) {
      setFormError('Paste a URL for the button to open.');
      return;
    }
    try {
      await upsertMutation.mutateAsync({
        ...draft,
        title: draft.title.trim(),
        body: draft.body.trim(),
        emoji: draft.emoji.trim(),
        cta_label: draft.cta_label.trim() || defaultAdminCampaignCta(draft.action_kind),
        challenge_id: draft.challenge_id.trim(),
        cta_url: draft.cta_url.trim(),
        image_url: draft.image_url.trim(),
      });
      handleReset();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not save campaign.';
      if (message.includes('challenge_not_open_link')) {
        setFormError('That challenge needs an active invite link.');
      } else if (message.includes('challenge_not_found')) {
        setFormError('Challenge not found.');
      } else if (message.includes('cta_url_required')) {
        setFormError('Use an http(s), slumber://, or / path.');
      } else if (message.includes('image_url_invalid')) {
        setFormError('Promo image must be an https URL.');
      } else {
        setFormError(message);
      }
    }
  };

  return (
    <AdminSection
      lead="The header shows every enabled campaign that is inside its dates and whose audience includes you. Leave audience empty to include everyone. The Feed banner only stays up while there is still something to do."
      error={error}
    >
      <AdminPanel
        title={editing ? 'Edit campaign' : 'New campaign'}
        description="Challenge, announcement, or link. Target developer + founder first, then clear roles to ship."
        headerAction={editing ? (
          <button type="button" className="admin-button admin-button-ghost" onClick={handleReset}>
            New
          </button>
        ) : null}
      >
        <form className="admin-compose-form" onSubmit={handleSubmit}>
          <label className="admin-label" htmlFor="campaign-kind">Type</label>
          <select
            id="campaign-kind"
            className="admin-input"
            value={draft.action_kind}
            onChange={(e) => setActionKind(e.target.value as AdminCampaignActionKind)}
          >
            <option value="challenge">Challenge — join an open-link race</option>
            <option value="message">Message — announce something</option>
            <option value="url">Link — open a URL</option>
          </select>

          <label className="admin-label" htmlFor="campaign-title">Title</label>
          <input
            id="campaign-title"
            className="admin-input"
            maxLength={80}
            value={draft.title}
            onChange={(e) => setDraft((prev) => ({ ...prev, title: e.target.value }))}
            placeholder={draft.action_kind === 'challenge' ? '$15 global sleep challenge' : 'Something new in Slumber'}
          />

          <label className="admin-label" htmlFor="campaign-body">Body</label>
          <textarea
            id="campaign-body"
            className="admin-input admin-textarea"
            rows={4}
            maxLength={500}
            value={draft.body}
            onChange={(e) => setDraft((prev) => ({ ...prev, body: e.target.value }))}
            placeholder={
              draft.action_kind === 'challenge'
                ? 'Join this week’s race. Free to enter.'
                : 'A short note for the popup, banner, and inbox row.'
            }
          />

          <label className="admin-label" htmlFor="campaign-image">Promo image</label>
          <input
            id="campaign-image"
            className="admin-input"
            value={draft.image_url}
            onChange={(e) => setDraft((prev) => ({ ...prev, image_url: e.target.value }))}
            placeholder="https://… or upload below"
          />
          <div className="admin-form-actions">
            <label className="admin-button admin-button-ghost">
              {uploadingImage ? 'Uploading…' : 'Upload image'}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                hidden
                disabled={uploadingImage}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  e.target.value = '';
                  if (!file) return;
                  setUploadingImage(true);
                  setFormError(null);
                  try {
                    const url = await uploadAdminCampaignImage(file);
                    setDraft((prev) => ({ ...prev, image_url: url }));
                  } catch (err: unknown) {
                    const message = err instanceof Error ? err.message : 'Could not upload image.';
                    if (message.includes('image_too_large')) {
                      setFormError('Image must be 5 MB or smaller.');
                    } else {
                      setFormError(message);
                    }
                  } finally {
                    setUploadingImage(false);
                  }
                }}
              />
            </label>
            {draft.image_url ? (
              <button
                type="button"
                className="admin-button admin-button-ghost"
                onClick={() => setDraft((prev) => ({ ...prev, image_url: '' }))}
              >
                Remove image
              </button>
            ) : null}
          </div>
          {draft.image_url ? (
            <img
              src={draft.image_url}
              alt=""
              style={{ maxWidth: 280, maxHeight: 160, objectFit: 'cover', borderRadius: 8 }}
            />
          ) : null}

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

          {draft.action_kind === 'challenge' ? (
            <>
              <AdminFieldGroup title="Slumber challenge">
                <p className="admin-muted">
                  Creates an open-link race hosted by Slumber. You are not added as a racer.
                </p>
                <label className="admin-label" htmlFor="slumber-title">Challenge title</label>
                <input
                  id="slumber-title"
                  className="admin-input"
                  maxLength={80}
                  value={slumber.title}
                  onChange={(e) => setSlumber((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder={draft.title.trim() || 'Same as the campaign title if left blank'}
                />
                <AdminFilterBar nested>
                  <AdminFilterField label="Goal (hours)" htmlFor="slumber-goal">
                    <input
                      id="slumber-goal"
                      className="admin-input"
                      type="number"
                      min={10}
                      max={100}
                      value={slumber.goalHours}
                      onChange={(e) => setSlumber((prev) => ({ ...prev, goalHours: e.target.value }))}
                    />
                  </AdminFilterField>
                  <AdminFilterField label="Days" htmlFor="slumber-days">
                    <input
                      id="slumber-days"
                      className="admin-input"
                      type="number"
                      min={1}
                      max={100}
                      disabled={slumber.noExpiration}
                      value={slumber.days}
                      onChange={(e) => setSlumber((prev) => ({ ...prev, days: e.target.value }))}
                    />
                  </AdminFilterField>
                  <AdminFilterField label="Max racers" htmlFor="slumber-max">
                    <input
                      id="slumber-max"
                      className="admin-input"
                      type="number"
                      min={2}
                      value={slumber.maxParticipants}
                      onChange={(e) => setSlumber((prev) => ({ ...prev, maxParticipants: e.target.value }))}
                      placeholder="No cap"
                    />
                  </AdminFilterField>
                </AdminFilterBar>
                <label className="admin-checkbox-label">
                  <input
                    type="checkbox"
                    checked={slumber.noExpiration}
                    onChange={(e) => setSlumber((prev) => ({ ...prev, noExpiration: e.target.checked }))}
                  />
                  <span>No end date</span>
                </label>
                <div className="admin-form-actions">
                  <button
                    type="button"
                    className="admin-button admin-button-ghost"
                    disabled={createSlumberMutation.isPending}
                    onClick={() => { void handleCreateSlumber(); }}
                  >
                    {createSlumberMutation.isPending ? 'Creating…' : 'Create Slumber challenge'}
                  </button>
                </div>
                {slumberNote ? <p className="admin-muted">{slumberNote}</p> : null}
              </AdminFieldGroup>

              <label className="admin-label" htmlFor="campaign-challenge">Challenge id</label>
              <input
                id="campaign-challenge"
                className="admin-input"
                value={draft.challenge_id}
                onChange={(e) => setDraft((prev) => ({ ...prev, challenge_id: e.target.value }))}
                placeholder="Filled in when you create a Slumber challenge, or paste an existing open-link id"
              />
            </>
          ) : null}

          {draft.action_kind === 'url' ? (
            <>
              <label className="admin-label" htmlFor="campaign-url">Link URL</label>
              <input
                id="campaign-url"
                className="admin-input"
                value={draft.cta_url}
                onChange={(e) => setDraft((prev) => ({ ...prev, cta_url: e.target.value }))}
                placeholder="https://useslumber.com/…"
              />
            </>
          ) : null}

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
        {listError ? <p className="admin-error">{listError}</p> : null}
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
                  <th>Action</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {campaigns.map((row) => {
                  const kind = parseActionKind(row.action_kind);
                  return (
                    <tr key={row.id}>
                      <td>
                      {row.image_url ? (
                        <img
                          src={row.image_url}
                          alt=""
                          style={{ width: 32, height: 32, objectFit: 'cover', borderRadius: 6, marginRight: 8, verticalAlign: 'middle' }}
                        />
                      ) : null}
                      {row.emoji ? `${row.emoji} ` : ''}
                      {row.title}
                        <div className="admin-muted">{row.enabled ? 'On' : 'Off'} · p{row.priority} · {actionLabel(kind)}</div>
                      </td>
                      <td>{audienceLabel(row.target_roles ?? [])}</td>
                      <td>
                        {kind === 'url' ? (
                          <>
                            {row.cta_url || '—'}
                            <div className="admin-muted">{row.cta_label}</div>
                          </>
                        ) : kind === 'message' ? (
                          <span className="admin-muted">{row.cta_label || 'Got it'}</span>
                        ) : (
                          <>
                            {row.challenge_title || row.challenge_id || '—'}
                            <div className="admin-muted">
                              {row.hosted_by === 'slumber' ? 'Slumber' : 'User'}
                              {' · '}
                              {row.open_link_enabled ? 'Open link' : 'Link off'}
                              {row.challenge_status ? ` · ${row.challenge_status}` : ''}
                            </div>
                          </>
                        )}
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
                        {row.hosted_by === 'slumber' && row.challenge_status === 'pending' && row.challenge_id ? (
                          <button
                            type="button"
                            className="admin-button admin-button-ghost admin-button-sm"
                            disabled={startSlumberMutation.isPending}
                            onClick={() => { void handleStartSlumber(row.challenge_id as string); }}
                          >
                            Start
                          </button>
                        ) : null}
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
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </AdminPanel>
    </AdminSection>
  );
}
