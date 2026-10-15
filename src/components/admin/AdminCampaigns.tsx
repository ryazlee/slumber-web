import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import type { AdminCampaignActionKind, AdminCampaignDraft, AdminCampaignRow } from '../../lib/admin';
import { adminErrorMessage, defaultAdminCampaignCta, uploadAdminCampaignImage } from '../../lib/admin';
import {
  useAdminCampaigns,
  useAdminSlumberChallenges,
  useDeleteAdminCampaign,
  useSetAdminCampaignEnabled,
  useUpsertAdminCampaign,
} from '../../hooks/useAdmin';
import { useAssignableRoles } from '../../hooks/useCatalog';
import { getCachedRoleOptions } from '../../lib/userRoles';
import AdminDateField from './AdminDateField';
import GrowingTextarea from '../GrowingTextarea';
import { WEB_TEXT_AREA_MAX_LINES } from '../../lib/commentInputGrow';
import {
  addDaysToLocalDateISO,
  formatScheduleWindow,
  isoToLocalDateInput,
  localDateInputToIso,
  toLocalDateISO,
} from './adminDateUtils';
import AdminFieldGroup from './AdminFieldGroup';
import AdminGridAction from './AdminGridAction';
import AdminGridActions from './AdminGridActions';
import { AdminStatusPill } from './gridColumnHelpers';
import AdminFilterBar, { AdminFilterField } from './AdminFilterBar';
import AdminFormDialog from './AdminFormDialog';
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

const DEFAULT_EMOJI: Record<AdminCampaignActionKind, string> = {
  challenge: '🏁',
  message: '📣',
  url: '🔗',
};

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

function snippet(body: string): string {
  const trimmed = body.replace(/\s+/g, ' ').trim();
  if (trimmed.length <= 110) return trimmed;
  return `${trimmed.slice(0, 107)}…`;
}

function actionDetail(row: AdminCampaignRow): string {
  const kind = parseActionKind(row.action_kind);
  if (kind === 'url') return row.cta_url?.trim() || row.cta_label || 'Link';
  if (kind === 'message') return row.cta_label?.trim() || 'Announcement';
  const title = row.challenge_title?.trim() || 'Linked challenge';
  const host = row.hosted_by === 'slumber' ? 'Slumber' : 'User hosted';
  const link = row.open_link_enabled ? 'Open link' : 'Link off';
  const status = row.challenge_status ? row.challenge_status : null;
  return [title, host, link, status].filter(Boolean).join(' · ');
}

export default function AdminCampaigns() {
  const campaignsQuery = useAdminCampaigns();
  const upsertMutation = useUpsertAdminCampaign();
  const enabledMutation = useSetAdminCampaignEnabled();
  const deleteMutation = useDeleteAdminCampaign();
  const rolesQuery = useAssignableRoles();
  const roleOptions = rolesQuery.data ?? getCachedRoleOptions();
  const linkableRacesQuery = useAdminSlumberChallenges(
    { status: null, pageSize: 100, page: 0 },
    true,
  );

  const [composerOpen, setComposerOpen] = useState(false);
  const [draft, setDraft] = useState<AdminCampaignDraft>(EMPTY_DRAFT);
  const [formError, setFormError] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const campaigns = campaignsQuery.data ?? [];
  const error = campaignsQuery.error
    ? adminErrorMessage(campaignsQuery.error, 'Could not load campaigns.')
    : null;
  const editing = Boolean(draft.id);

  const linkableRaces = useMemo(() => {
    const rows = linkableRacesQuery.data?.rows ?? [];
    return rows.filter((row) => (
      row.join_enabled
      && (row.status === 'pending' || row.status === 'active')
    ));
  }, [linkableRacesQuery.data?.rows]);

  const selectedRace = useMemo(
    () => linkableRaces.find((row) => row.id === draft.challenge_id)
      ?? (linkableRacesQuery.data?.rows ?? []).find((row) => row.id === draft.challenge_id),
    [draft.challenge_id, linkableRaces, linkableRacesQuery.data?.rows],
  );

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
    setComposerOpen(true);
  };

  const clearDraft = () => {
    setDraft(EMPTY_DRAFT);
    setFormError(null);
  };

  const closeComposer = () => {
    clearDraft();
    setComposerOpen(false);
  };

  const openComposer = () => {
    clearDraft();
    setComposerOpen(true);
  };

  const handleDelete = async (row: AdminCampaignRow) => {
    const msg = `Delete “${row.title}”? This removes it from the app. A linked race is left as-is.`;
    if (!window.confirm(msg)) return;
    setListError(null);
    try {
      await deleteMutation.mutateAsync(row.id);
      if (draft.id === row.id) closeComposer();
    } catch (err: unknown) {
      setListError(adminErrorMessage(err, 'Could not delete campaign.'));
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
      setFormError('Pick a Slumber race or paste an open-link challenge id.');
      return;
    }
    if (draft.action_kind === 'url' && !draft.cta_url.trim()) {
      setFormError('Paste a URL for the button to open.');
      return;
    }
    if (draft.starts_at && draft.ends_at && draft.ends_at <= draft.starts_at) {
      setFormError('End date must be on or after the start date.');
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
      closeComposer();
    } catch (err: unknown) {
      const message = adminErrorMessage(err, 'Could not save campaign.');
      if (message.includes('challenge_not_open_link')) {
        setFormError('That challenge needs an active invite link. Create or open one under Slumber races.');
      } else if (message.includes('challenge_not_found')) {
        setFormError('Challenge not found.');
      } else if (message.includes('cta_url_required')) {
        setFormError('Use an http(s), slumber://, / path, or mailto:useslumber@gmail.com.');
      } else if (message.includes('image_url_invalid')) {
        setFormError('Promo image must be an https URL.');
      } else if (message.includes('invalid_window')) {
        setFormError('End date must be after the start date.');
      } else if (message.includes('invalid_title') || message.includes('title_too_long')) {
        setFormError('Titles must be 1–80 characters.');
      } else {
        setFormError(message);
      }
    }
  };

  const renderCampaignActions = (row: AdminCampaignRow) => (
    <AdminGridActions>
      <AdminGridAction onClick={() => handleEdit(row)}>Edit</AdminGridAction>
      <AdminGridAction
        disabled={enabledMutation.isPending}
        onClick={() => { void enabledMutation.mutateAsync({ id: row.id, enabled: !row.enabled }); }}
      >
        {row.enabled ? 'Disable' : 'Enable'}
      </AdminGridAction>
      <AdminGridAction
        variant="danger"
        disabled={deleteMutation.isPending}
        onClick={() => { void handleDelete(row); }}
      >
        Delete
      </AdminGridAction>
    </AdminGridActions>
  );

  return (
    <AdminSection
      lead="Promos for the header moon, feed banner, and inbox. Dates here are only the campaign window — create and start Slumber races under Slumber races. Leave dates blank to keep a campaign up until you turn it off."
      error={error}
    >
      <div className="admin-form-actions">
        <button type="button" className="admin-button" onClick={openComposer}>
          New campaign
        </button>
        <Link className="admin-button admin-button-ghost" to="/admin/races">
          Slumber races
        </Link>
      </div>

      <AdminFormDialog
        open={composerOpen}
        onClose={closeComposer}
        title={editing ? 'Edit campaign' : 'New campaign'}
        wide
      >
        <p className="admin-panel-desc">
          Challenge, announcement, or link. Target developer + founder first, then clear roles to ship.
        </p>
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
          <GrowingTextarea
            id="campaign-body"
            className="admin-input admin-textarea"
            rows={4}
            maxLines={WEB_TEXT_AREA_MAX_LINES}
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
                    const message = adminErrorMessage(err, 'Could not upload image.');
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
            <AdminFieldGroup title="Linked race">
              <p className="admin-muted">
                Create the race under{' '}
                <Link to="/admin/races">Slumber races</Link>
                , then start it whenever you want. This campaign only needs the challenge id — its
                schedule is separate from the race window.
              </p>
              {linkableRaces.length > 0 ? (
                <>
                  <label className="admin-label" htmlFor="campaign-race-pick">Slumber race</label>
                  <select
                    id="campaign-race-pick"
                    className="admin-input"
                    value={linkableRaces.some((row) => row.id === draft.challenge_id) ? draft.challenge_id : ''}
                    onChange={(e) => setDraft((prev) => ({ ...prev, challenge_id: e.target.value }))}
                  >
                    <option value="">Pick a pending or active race…</option>
                    {linkableRaces.map((row) => (
                      <option key={row.id} value={row.id}>
                        {row.title?.trim() || 'Untitled'} · {row.status}
                        {row.join_enabled ? '' : ' · join closed'}
                      </option>
                    ))}
                  </select>
                </>
              ) : (
                <p className="admin-muted">
                  No joinable Slumber races yet.{' '}
                  <Link to="/admin/races">Create one</Link>
                  , then come back.
                </p>
              )}
              <label className="admin-label" htmlFor="campaign-challenge">Challenge id</label>
              <input
                id="campaign-challenge"
                className="admin-input"
                value={draft.challenge_id}
                onChange={(e) => setDraft((prev) => ({ ...prev, challenge_id: e.target.value.trim() }))}
                placeholder="Slumber race id or user open-link challenge id"
              />
              {selectedRace ? (
                <p className="admin-muted">
                  Linked: {selectedRace.title?.trim() || 'Untitled'} · {selectedRace.status}
                  {selectedRace.join_enabled ? ' · join open' : ' · join closed'}
                </p>
              ) : null}
            </AdminFieldGroup>
          ) : null}

          {draft.action_kind === 'url' ? (
            <>
              <label className="admin-label" htmlFor="campaign-url">Link URL</label>
              <input
                id="campaign-url"
                className="admin-input"
                value={draft.cta_url}
                onChange={(e) => setDraft((prev) => ({ ...prev, cta_url: e.target.value }))}
                placeholder="https://useslumber.com/… or mailto:useslumber@gmail.com"
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

          <AdminFieldGroup title="Campaign schedule">
            <p className="admin-muted">
              Optional. Controls when this promo shows in the app — not when the race scores.
              Leave both blank for an indefinite announcement, or set only a start or only an end.
            </p>
            <div className="admin-campaign-schedule">
              <AdminDateField
                id="campaign-starts"
                label="Starts"
                value={isoToLocalDateInput(draft.starts_at)}
                max={isoToLocalDateInput(draft.ends_at) || undefined}
                placeholder="Live immediately"
                onChange={(next) => setDraft((prev) => ({
                  ...prev,
                  starts_at: localDateInputToIso(next, 'start'),
                }))}
              />
              <AdminDateField
                id="campaign-ends"
                label="Ends"
                value={isoToLocalDateInput(draft.ends_at)}
                min={isoToLocalDateInput(draft.starts_at) || undefined}
                placeholder="No end date"
                onChange={(next) => setDraft((prev) => ({
                  ...prev,
                  ends_at: localDateInputToIso(next, 'end'),
                }))}
              />
            </div>
            <div className="admin-campaign-schedule-presets" role="group" aria-label="Schedule presets">
              <button
                type="button"
                className="admin-button admin-button-ghost admin-button-sm"
                onClick={() => {
                  const today = toLocalDateISO();
                  setDraft((prev) => ({
                    ...prev,
                    starts_at: localDateInputToIso(today, 'start'),
                    ends_at: localDateInputToIso(addDaysToLocalDateISO(today, 6), 'end'),
                  }));
                }}
              >
                Next 7 days
              </button>
              <button
                type="button"
                className="admin-button admin-button-ghost admin-button-sm"
                onClick={() => {
                  const today = toLocalDateISO();
                  setDraft((prev) => ({
                    ...prev,
                    starts_at: localDateInputToIso(today, 'start'),
                    ends_at: localDateInputToIso(addDaysToLocalDateISO(today, 13), 'end'),
                  }));
                }}
              >
                Next 14 days
              </button>
              <button
                type="button"
                className="admin-button admin-button-ghost admin-button-sm"
                onClick={() => setDraft((prev) => ({
                  ...prev,
                  starts_at: localDateInputToIso(toLocalDateISO(), 'start'),
                  ends_at: null,
                }))}
              >
                Start today
              </button>
              {(draft.starts_at || draft.ends_at) ? (
                <button
                  type="button"
                  className="admin-button admin-button-ghost admin-button-sm"
                  onClick={() => setDraft((prev) => ({
                    ...prev,
                    starts_at: null,
                    ends_at: null,
                  }))}
                >
                  Indefinite
                </button>
              ) : null}
            </div>
            <p className="admin-campaign-schedule-summary">
              {formatScheduleWindow(draft.starts_at, draft.ends_at)}
            </p>
          </AdminFieldGroup>

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
            {editing ? (
              <button
                type="button"
                className="admin-button admin-button-ghost"
                onClick={clearDraft}
                disabled={upsertMutation.isPending}
              >
                Start over
              </button>
            ) : null}
            <button
              type="button"
              className="admin-button admin-button-ghost"
              onClick={closeComposer}
              disabled={upsertMutation.isPending}
            >
              Cancel
            </button>
          </div>
        </form>
      </AdminFormDialog>

      <AdminPanel title="Campaigns">
        {listError ? <p className="admin-error">{listError}</p> : null}
        {campaignsQuery.isLoading ? (
          <p className="admin-muted">Loading…</p>
        ) : campaigns.length === 0 ? (
          <p className="admin-empty-inline">No campaigns yet.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table admin-table--readable admin-campaign-table">
              <thead>
                <tr>
                  <th>Campaign</th>
                  <th>Status</th>
                  <th>Action</th>
                  <th>Schedule</th>
                  <th>Audience</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((row) => {
                  const kind = parseActionKind(row.action_kind);
                  return (
                    <tr key={row.id}>
                      <td className="admin-td-wrap">
                        <div className="admin-campaign-title-row">
                          {row.image_url ? <img src={row.image_url} alt="" className="admin-campaign-thumb" /> : null}
                          <div>
                            <div className="admin-campaign-name">
                              {row.emoji ? `${row.emoji} ` : ''}{row.title}
                            </div>
                            {row.body?.trim() ? <div className="admin-campaign-sub">{snippet(row.body)}</div> : null}
                          </div>
                        </div>
                      </td>
                      <td>
                        <AdminStatusPill tone={row.enabled ? 'on' : 'off'}>
                          {row.enabled ? 'On' : 'Off'}
                        </AdminStatusPill>
                        <div className="admin-campaign-priority">Priority {row.priority}</div>
                      </td>
                      <td className="admin-td-wrap">
                        <div className="admin-campaign-name">{actionLabel(kind)}</div>
                        <div className="admin-campaign-sub">{actionDetail(row)}</div>
                      </td>
                      <td className="admin-td-wrap">{formatScheduleWindow(row.starts_at, row.ends_at)}</td>
                      <td className="admin-td-wrap">{audienceLabel(row.target_roles ?? [])}</td>
                      <td className="admin-td-actions">{renderCampaignActions(row)}</td>
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
