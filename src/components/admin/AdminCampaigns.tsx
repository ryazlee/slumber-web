import { useState } from 'react';
import type { FormEvent } from 'react';
import type { AdminCampaignActionKind, AdminCampaignDraft, AdminCampaignRow } from '../../lib/admin';
import { adminErrorMessage, defaultAdminCampaignCta, uploadAdminCampaignImage } from '../../lib/admin';
import {
  useAdminCampaigns,
  useDeleteAdminCampaign,
  useEndAdminSlumberChallenge,
  useSetAdminCampaignEnabled,
  useUpsertAdminCampaign,
  useUpsertAdminSlumberChallenge,
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

const EMPTY_SLUMBER = {
  title: '',
  goalHours: '40',
  maxParticipants: '',
  joinEnabled: true,
};

function goalHoursLabel(minutes: number | null | undefined): string {
  if (!minutes) return '40';
  const hours = minutes / 60;
  return String(Number.isInteger(hours) ? hours : Math.round(hours * 10) / 10);
}

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
  const slumberMutation = useUpsertAdminSlumberChallenge();
  const endSlumberMutation = useEndAdminSlumberChallenge();
  const enabledMutation = useSetAdminCampaignEnabled();
  const deleteMutation = useDeleteAdminCampaign();
  const rolesQuery = useAssignableRoles();
  const roleOptions = rolesQuery.data ?? getCachedRoleOptions();

  const [composerOpen, setComposerOpen] = useState(false);
  const [draft, setDraft] = useState<AdminCampaignDraft>(EMPTY_DRAFT);
  const [slumber, setSlumber] = useState(EMPTY_SLUMBER);
  const [raceHost, setRaceHost] = useState<'slumber' | 'user'>('slumber');
  const [raceStatus, setRaceStatus] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const campaigns = campaignsQuery.data ?? [];
  const error = campaignsQuery.error
    ? adminErrorMessage(campaignsQuery.error, 'Could not load campaigns.')
    : null;
  const editing = Boolean(draft.id);
  const slumberForm = draft.action_kind === 'challenge' && raceHost !== 'user';
  const raceFieldsLocked = slumberForm && !!raceStatus && !['pending', 'active'].includes(raceStatus);

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
      const next = {
        ...prev,
        action_kind,
        cta_label: wasDefaultCta ? defaultAdminCampaignCta(action_kind) : prev.cta_label,
        emoji: wasDefaultEmoji ? DEFAULT_EMOJI[action_kind] : prev.emoji,
      };
      if (action_kind === 'challenge' && raceHost !== 'user' && !next.starts_at) {
        next.starts_at = localDateInputToIso(toLocalDateISO(), 'start');
      }
      return next;
    });
  };

  const handleEdit = (row: AdminCampaignRow) => {
    const action_kind = parseActionKind(row.action_kind);
    const isSlumber = action_kind === 'challenge' && row.hosted_by !== 'user';
    setRaceHost(isSlumber ? 'slumber' : 'user');
    setRaceStatus(row.challenge_status);
    setSlumber({
      title: row.challenge_title ?? '',
      goalHours: goalHoursLabel(row.goal_minutes),
      maxParticipants: row.max_participants != null ? String(row.max_participants) : '',
      joinEnabled: row.open_link_enabled !== false,
    });
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
      starts_at: isSlumber ? (row.challenge_started_at ?? row.starts_at) : row.starts_at,
      ends_at: isSlumber
        ? (row.no_expiration ? null : (row.challenge_expires_at ?? row.ends_at))
        : row.ends_at,
      enabled: row.enabled,
      priority: row.priority,
    });
    setFormError(null);
    setComposerOpen(true);
  };

  const clearDraft = () => {
    setDraft({
      ...EMPTY_DRAFT,
      starts_at: localDateInputToIso(toLocalDateISO(), 'start'),
    });
    setSlumber(EMPTY_SLUMBER);
    setRaceHost('slumber');
    setRaceStatus(null);
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

  const handleEndSlumber = async (row: AdminCampaignRow) => {
    if (!row.challenge_id) return;
    const pending = row.challenge_status === 'pending';
    const name = row.challenge_title?.trim() || row.title;
    const msg = pending
      ? `Cancel “${name}”? It will not start, and the join link will close.`
      : `End “${name}” now? Racers get a catch-up window, then it finishes. The join link will close.`;
    if (!window.confirm(msg)) return;
    setListError(null);
    try {
      await endSlumberMutation.mutateAsync(row.challenge_id);
    } catch (err: unknown) {
      const message = adminErrorMessage(err, 'Could not end the race.');
      if (message.includes('challenge_not_endable')) {
        setListError('That race has already finished.');
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
    if (draft.action_kind === 'challenge' && raceHost === 'user' && !draft.challenge_id.trim()) {
      setFormError('Paste the open-link challenge id.');
      return;
    }
    if (slumberForm && !draft.starts_at) {
      setFormError('Pick a start date for the race.');
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
      if (slumberForm) {
        const goalHours = Number(slumber.goalHours);
        const maxRaw = slumber.maxParticipants.trim();
        const maxParticipants = maxRaw ? Number(maxRaw) : null;
        const raceTitle = slumber.title.trim() || draft.title.trim();
        if (!raceTitle) {
          setFormError('Add a title for the race.');
          return;
        }
        if (!Number.isFinite(goalHours) || goalHours < 10 || goalHours > 100) {
          setFormError('Goal must be between 10 and 100 hours.');
          return;
        }
        if (maxParticipants != null && (!Number.isInteger(maxParticipants) || maxParticipants < 2 || maxParticipants > 10000)) {
          setFormError('Max racers must be between 2 and 10,000, or left blank.');
          return;
        }
        await slumberMutation.mutateAsync({
          challengeId: draft.challenge_id.trim() || null,
          campaignId: draft.id ?? null,
          title: raceTitle,
          goalMinutes: Math.round(goalHours * 60),
          startsAt: draft.starts_at as string,
          endsAt: draft.ends_at,
          noEnd: !draft.ends_at,
          maxParticipants,
          joinEnabled: slumber.joinEnabled,
          campaignTitle: draft.title.trim(),
          campaignBody: draft.body.trim(),
          emoji: draft.emoji.trim(),
          ctaLabel: draft.cta_label.trim() || defaultAdminCampaignCta('challenge'),
          imageUrl: draft.image_url.trim(),
          targetRoles: draft.target_roles,
          enabled: draft.enabled,
          priority: draft.priority,
        });
      } else {
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
      }
      closeComposer();
    } catch (err: unknown) {
      const message = adminErrorMessage(err, 'Could not save campaign.');
      if (message.includes('challenge_not_open_link')) {
        setFormError('That challenge needs an active invite link.');
      } else if (message.includes('challenge_not_found')) {
        setFormError('Challenge not found.');
      } else if (message.includes('cta_url_required')) {
        setFormError('Use an http(s), slumber://, / path, or mailto:useslumber@gmail.com.');
      } else if (message.includes('image_url_invalid')) {
        setFormError('Promo image must be an https URL.');
      } else if (message.includes('invalid_goal')) {
        setFormError('Goal must be between 10 and 100 hours.');
      } else if (message.includes('invalid_window') || message.includes('start_required') || message.includes('starts_at_required')) {
        setFormError('Pick a start date. The end date has to be after it, or leave the end blank.');
      } else if (message.includes('invalid_max_participants')) {
        setFormError('Max racers must be between 2 and 10,000.');
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
      {row.hosted_by === 'slumber' && row.challenge_id
        && (row.challenge_status === 'pending' || row.challenge_status === 'active') ? (
        <AdminGridAction
          variant="danger"
          disabled={endSlumberMutation.isPending}
          onClick={() => { void handleEndSlumber(row); }}
        >
          End race
        </AdminGridAction>
      ) : null}
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
      lead="The header shows every enabled campaign whose audience includes you. Leave the dates blank to keep it up until you turn it off. The Feed banner only stays up while there is still something to do."
      error={error}
    >
      <div className="admin-form-actions">
        <button type="button" className="admin-button" onClick={openComposer}>
          New campaign
        </button>
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
            disabled={editing && raceHost === 'slumber'}
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

          {slumberForm ? (
            <AdminFieldGroup title="Slumber race">
              <p className="admin-muted">
                Saving publishes the race and this campaign together. You are not added as a racer.
                A start date that has already arrived makes the race live. Leave the end date blank for no end.
                Nights already posted in that window count for people who join later.
              </p>
              {raceFieldsLocked ? (
                <p className="admin-muted">This race has finished. You can still edit the announcement.</p>
              ) : null}
              <label className="admin-label" htmlFor="slumber-title">Race title</label>
              <input
                id="slumber-title"
                className="admin-input"
                maxLength={80}
                disabled={raceFieldsLocked}
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
                    step="0.5"
                    disabled={raceFieldsLocked}
                    value={slumber.goalHours}
                    onChange={(e) => setSlumber((prev) => ({ ...prev, goalHours: e.target.value }))}
                  />
                </AdminFilterField>
                <AdminFilterField label="Max racers" htmlFor="slumber-max">
                  <input
                    id="slumber-max"
                    className="admin-input"
                    type="number"
                    min={2}
                    disabled={raceFieldsLocked}
                    value={slumber.maxParticipants}
                    onChange={(e) => setSlumber((prev) => ({ ...prev, maxParticipants: e.target.value }))}
                    placeholder="No cap"
                  />
                </AdminFilterField>
              </AdminFilterBar>
              <label className="admin-checkbox-label">
                <input
                  type="checkbox"
                  checked={slumber.joinEnabled}
                  onChange={(e) => setSlumber((prev) => ({ ...prev, joinEnabled: e.target.checked }))}
                />
                <span>Join link open</span>
              </label>
            </AdminFieldGroup>
          ) : null}

          {draft.action_kind === 'challenge' && raceHost === 'user' ? (
            <>
              <label className="admin-label" htmlFor="campaign-challenge">Challenge id</label>
              <input
                id="campaign-challenge"
                className="admin-input"
                value={draft.challenge_id}
                onChange={(e) => setDraft((prev) => ({ ...prev, challenge_id: e.target.value }))}
                placeholder="Open-link challenge id"
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

          <AdminFieldGroup title="Schedule">
            <p className="admin-muted">
              {slumberForm
                ? 'The start date is when the race begins scoring. Leave the end blank to run until someone hits the goal.'
                : 'Optional. Leave both blank for an indefinite announcement, or set only a start or only an end.'}
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
                    starts_at: slumberForm ? localDateInputToIso(toLocalDateISO(), 'start') : null,
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
            <button className="admin-button" type="submit" disabled={upsertMutation.isPending || slumberMutation.isPending}>
              {(upsertMutation.isPending || slumberMutation.isPending) ? 'Saving…' : editing ? 'Save campaign' : 'Create campaign'}
            </button>
            {editing ? (
              <button
                type="button"
                className="admin-button admin-button-ghost"
                onClick={clearDraft}
                disabled={upsertMutation.isPending || slumberMutation.isPending}
              >
                Start over
              </button>
            ) : null}
            <button
              type="button"
              className="admin-button admin-button-ghost"
              onClick={closeComposer}
              disabled={upsertMutation.isPending || slumberMutation.isPending}
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
                      <td className="admin-td-wrap">{formatScheduleWindow(
                        row.hosted_by === 'slumber' ? (row.challenge_started_at ?? row.starts_at) : row.starts_at,
                        row.hosted_by === 'slumber' && row.no_expiration
                          ? null
                          : (row.hosted_by === 'slumber' ? (row.challenge_expires_at ?? row.ends_at) : row.ends_at),
                      )}</td>
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
