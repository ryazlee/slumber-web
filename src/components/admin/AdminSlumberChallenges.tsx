import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import type { GridColDef } from '@mui/x-data-grid';
import type { AdminDrawingRosterRow, AdminSlumberChallengeRow } from '../../lib/admin';
import { slumberChallengeErrorMessage, uploadAdminCampaignImage } from '../../lib/admin';
import {
  DRAWING_ENTRY_KIND_CATALOG,
  defaultDrawingEntryConfig,
  drawingReferralCountsLine,
  parseDrawingEntryConfig,
  type DrawingEntryRule,
} from '../../lib/drawing';
import {
  useAdminDrawingRoster,
  useAdminSlumberChallenges,
  useCreateAdminSlumberChallenge,
  useEndAdminSlumberChallenge,
  useSetAdminDrawingParticipant,
  useStartAdminSlumberChallenge,
  useUpdateAdminSlumberChallenge,
} from '../../hooks/useAdmin';
import { usePaginatedFilters } from '../../hooks/usePaginatedFilters';
import AdminDataGrid from './AdminDataGrid';
import AdminDateField from './AdminDateField';
import { isoToLocalDateInput, localDateInputToIso } from './adminDateUtils';
import AdminFilterBar, { AdminFilterField } from './AdminFilterBar';
import AdminFormDialog from './AdminFormDialog';
import AdminGridAction from './AdminGridAction';
import AdminGridActions from './AdminGridActions';
import AdminListToolbar from './AdminListToolbar';
import { pluralCount } from './format';
import AdminSection from './AdminSection';
import { AdminStatusPill, gridActionsColumn } from './gridColumnHelpers';

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'active', label: 'Active' },
  { value: 'pending_completion', label: 'Catch-up' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const EDITABLE_STATUSES = new Set(['pending', 'active', 'pending_completion']);

function statusLabel(status: string): string {
  return STATUS_FILTERS.find((item) => item.value === status)?.label ?? status;
}

function goalHoursLabel(minutes: number): string {
  const hours = minutes / 60;
  return String(Number.isInteger(hours) ? hours : Math.round(hours * 10) / 10);
}

function formatGoal(minutes: number): string {
  return `${goalHoursLabel(minutes)}h`;
}

function windowLabel(row: AdminSlumberChallengeRow): string {
  if (row.no_expiration) return 'No end';
  if (!row.started_at) return `${row.expiration_days} days`;
  if (!row.expires_at) return 'No end';
  return new Date(row.expires_at).toLocaleDateString(undefined, { dateStyle: 'medium' });
}

type Draft = {
  title: string;
  description: string;
  goalHours: string;
  noExpiration: boolean;
  expirationDays: string;
  endsOn: string;
  maxParticipants: string;
  joinEnabled: boolean;
  isDrawing: boolean;
  drawingReferrals: boolean;
  entryRules: DrawingEntryRule[];
  prizeSponsorName: string;
  prizeName: string;
  prizeUrl: string;
  prizeExtraUrls: string;
  prizeLogoUrl: string;
  prizeImageUrl: string;
  officialRules: string;
  officialRulesUrl: string;
};

function draftFromRow(row: AdminSlumberChallengeRow): Draft {
  return {
    title: row.title ?? '',
    description: row.description ?? '',
    goalHours: goalHoursLabel(row.goal_minutes),
    noExpiration: row.no_expiration,
    expirationDays: String(row.expiration_days || 10),
    endsOn: isoToLocalDateInput(row.expires_at),
    maxParticipants: row.max_participants != null ? String(row.max_participants) : '',
    joinEnabled: row.join_enabled,
    isDrawing: Boolean(row.is_drawing),
    drawingReferrals: Boolean(row.is_drawing && row.drawing_referrals),
    entryRules: parseDrawingEntryConfig(
      row.drawing_entry_config,
      Boolean(row.is_drawing),
      Boolean(row.drawing_referrals),
    ),
    prizeSponsorName: row.prize_sponsor_name ?? '',
    prizeName: row.prize_name ?? '',
    prizeUrl: row.prize_url ?? '',
    prizeExtraUrls: (row.prize_extra_urls ?? []).join('\n'),
    prizeLogoUrl: row.prize_logo_url ?? '',
    prizeImageUrl: row.prize_image_url ?? '',
    officialRules: row.official_rules ?? '',
    officialRulesUrl: row.official_rules_url ?? '',
  };
}

const EMPTY_DRAFT: Draft = {
  title: '',
  description: '',
  goalHours: '40',
  noExpiration: false,
  expirationDays: '10',
  endsOn: '',
  maxParticipants: '',
  joinEnabled: true,
  isDrawing: false,
  drawingReferrals: false,
  entryRules: defaultDrawingEntryConfig(),
  prizeSponsorName: '',
  prizeName: '',
  prizeUrl: '',
  prizeExtraUrls: '',
  prizeLogoUrl: '',
  prizeImageUrl: '',
  officialRules: '',
  officialRulesUrl: '',
};

function parseExtraUrls(raw: string): string[] {
  return raw.split(/\s+/).map((u) => u.trim()).filter(Boolean);
}

function RaceForm({
  row,
  onClose,
}: {
  row: AdminSlumberChallengeRow | null;
  onClose: () => void;
}) {
  const createMutation = useCreateAdminSlumberChallenge();
  const updateMutation = useUpdateAdminSlumberChallenge();
  const [draft, setDraft] = useState<Draft>(row ? draftFromRow(row) : EMPTY_DRAFT);
  const [formError, setFormError] = useState<string | null>(null);
  const started = Boolean(row?.started_at);
  const locked = row != null && !EDITABLE_STATUSES.has(row.status);
  const saving = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const title = draft.title.trim();
    const goalHours = Number(draft.goalHours);
    const days = Number(draft.expirationDays);
    const maxRaw = draft.maxParticipants.trim();
    const maxParticipants = maxRaw ? Number(maxRaw) : null;
    if (!title || title.length > 80) {
      setFormError('Title must be 1–80 characters.');
      return;
    }
    const description = draft.description.trim();
    if (description.length > 280) {
      setFormError('Description must be 280 characters or fewer.');
      return;
    }
    if (!locked) {
      if (!Number.isFinite(goalHours) || goalHours < 10 || goalHours > 100) {
        setFormError('Goal must be between 10 and 100 hours.');
        return;
      }
      if (maxParticipants != null && (!Number.isInteger(maxParticipants) || maxParticipants < 2 || maxParticipants > 10000)) {
        setFormError('Max participants must be between 2 and 10,000, or left blank.');
        return;
      }
      if (!draft.noExpiration && !started && (!Number.isInteger(days) || days < 1 || days > 100)) {
        setFormError('Duration must be between 1 and 100 days.');
        return;
      }
      if (!draft.noExpiration && started && !draft.endsOn) {
        setFormError('Pick an end date, or leave the challenge without an end.');
        return;
      }
    }

    const goalMinutes = Math.round(goalHours * 60);
    try {
      if (!row) {
        const extraUrls = parseExtraUrls(draft.prizeExtraUrls);
        await createMutation.mutateAsync({
          title,
          description: description || null,
          goalMinutes,
          noExpiration: draft.isDrawing ? false : draft.noExpiration,
          expiresInDays: draft.noExpiration && !draft.isDrawing ? 10 : days,
          maxParticipants,
          isDrawing: draft.isDrawing,
          drawingReferrals: draft.isDrawing && Boolean(draft.entryRules.find((r) => r.kind === 'referral')?.enabled),
          drawingEntryConfig: draft.isDrawing ? draft.entryRules : [],
          prizeSponsorName: draft.prizeSponsorName,
          prizeName: draft.prizeName,
          prizeUrl: draft.prizeUrl,
          prizeExtraUrls: extraUrls,
          prizeLogoUrl: draft.prizeLogoUrl,
          prizeImageUrl: draft.prizeImageUrl,
          officialRules: draft.officialRules,
          officialRulesUrl: draft.officialRulesUrl,
        });
      } else {
        const extraUrls = parseExtraUrls(draft.prizeExtraUrls);
        await updateMutation.mutateAsync({
          challengeId: row.id,
          draft: {
            title,
            description: description || null,
            goalMinutes,
            noExpiration: draft.isDrawing ? false : draft.noExpiration,
            expirationDays: Number.isInteger(days) ? days : row.expiration_days,
            expiresAt: draft.noExpiration || !started ? null : localDateInputToIso(draft.endsOn, 'end'),
            maxParticipants,
            joinEnabled: draft.joinEnabled,
            isDrawing: draft.isDrawing,
            drawingReferrals: draft.isDrawing && Boolean(draft.entryRules.find((r) => r.kind === 'referral')?.enabled),
            drawingEntryConfig: draft.isDrawing ? draft.entryRules : [],
            prizeSponsorName: draft.prizeSponsorName,
            prizeName: draft.prizeName,
            prizeUrl: draft.prizeUrl,
            prizeExtraUrls: extraUrls,
            prizeLogoUrl: draft.prizeLogoUrl,
            prizeImageUrl: draft.prizeImageUrl,
            officialRules: draft.officialRules,
            officialRulesUrl: draft.officialRulesUrl,
          },
        });
      }
      onClose();
    } catch (err: unknown) {
      setFormError(slumberChallengeErrorMessage(err, 'Could not save the challenge.'));
    }
  };

  return (
    <AdminFormDialog
      open
      wide
      onClose={onClose}
      title={row ? `Edit ${row.title?.trim() || 'challenge'}` : 'New Slumber challenge'}
    >
      <p className="admin-panel-desc">
        {row
          ? locked
            ? 'This challenge has finished. The name can still be changed.'
            : started
              ? 'The start time stays put. A later end date keeps the challenge going. An end date that has already passed opens the catch-up window.'
              : 'Start the challenge from the table when it should go live. Duration is how many days it runs after that.'
          : 'This creates a pending challenge hosted by Slumber. Type is a field: leave Drawing off for a race, or turn it on for a prize challenge (entries at the goal; winner is drawn off-app). Start it from the table when it should go live. Link a campaign separately if you want a promo — you are not added as a participant.'}
      </p>
      <form className="admin-role-grant-form" onSubmit={(e) => { void handleSubmit(e); }}>
        <div className="admin-field">
          <label className="admin-label" htmlFor="slumber-race-title">Name</label>
          <input
            id="slumber-race-title"
            className="admin-input"
            maxLength={80}
            value={draft.title}
            onChange={(e) => setDraft((prev) => ({ ...prev, title: e.target.value }))}
          />
        </div>
        <div className="admin-field">
          <label className="admin-label" htmlFor="slumber-race-description">Description (optional)</label>
          <textarea
            id="slumber-race-description"
            className="admin-input"
            maxLength={280}
            rows={3}
            value={draft.description}
            onChange={(e) => setDraft((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="Shown on challenge details and join"
          />
          <p className="admin-panel-desc" style={{ marginTop: 4 }}>{draft.description.length}/280</p>
        </div>
        <label className="admin-checkbox-label">
          <input
            type="checkbox"
            checked={draft.isDrawing}
            disabled={locked || started}
            onChange={(e) => setDraft((prev) => ({
              ...prev,
              isDrawing: e.target.checked,
              drawingReferrals: e.target.checked ? prev.drawingReferrals : false,
              entryRules: e.target.checked ? prev.entryRules : defaultDrawingEntryConfig(),
              noExpiration: e.target.checked ? false : prev.noExpiration,
            }))}
          />
          <span>Drawing (no sleep winner; entries from the types below)</span>
        </label>
        {draft.isDrawing ? (
          <>
            <fieldset className="admin-field" disabled={locked}>
              <legend className="admin-label">Entry types</legend>
              <p className="admin-panel-desc">Each kind can award a different number of entries. Add more kinds in code later.</p>
              {DRAWING_ENTRY_KIND_CATALOG.map((kind) => {
                const rule = draft.entryRules.find((row) => row.kind === kind.kind)
                  ?? defaultDrawingEntryConfig().find((row) => row.kind === kind.kind)!;
                const lockedOn = kind.kind === 'goal';
                return (
                  <div key={kind.kind} className="admin-entry-kind">
                    <label className="admin-checkbox-label">
                      <input
                        type="checkbox"
                        checked={lockedOn || rule.enabled}
                        disabled={locked || lockedOn}
                        onChange={(e) => setDraft((prev) => ({
                          ...prev,
                          entryRules: prev.entryRules.map((row) => (
                            row.kind === kind.kind ? { ...row, enabled: e.target.checked } : row
                          )),
                        }))}
                      />
                      <span>{kind.label}</span>
                    </label>
                    <p className="admin-panel-desc">{kind.adminHint}</p>
                    <div className="admin-entry-kind-fields">
                      <label className="admin-label" htmlFor={`entry-${kind.kind}-n`}>
                        {kind.perEvent ? 'Entries each' : 'Entries'}
                      </label>
                      <input
                        id={`entry-${kind.kind}-n`}
                        className="admin-input"
                        type="number"
                        min={kind.kind === 'goal' ? 1 : 0}
                        max={20}
                        disabled={locked || (!lockedOn && !rule.enabled)}
                        value={rule.entries}
                        onChange={(e) => {
                          const entries = Number(e.target.value);
                          setDraft((prev) => ({
                            ...prev,
                            entryRules: prev.entryRules.map((row) => (
                              row.kind === kind.kind
                                ? {
                                  ...row,
                                  entries,
                                  max: kind.perEvent ? Math.max(row.max, entries || 0) : entries,
                                }
                                : row
                            )),
                          }));
                        }}
                      />
                      {kind.perEvent ? (
                        <>
                          <label className="admin-label" htmlFor={`entry-${kind.kind}-max`}>Max</label>
                          <input
                            id={`entry-${kind.kind}-max`}
                            className="admin-input"
                            type="number"
                            min={0}
                            max={100}
                            disabled={locked || !rule.enabled}
                            value={rule.max}
                            onChange={(e) => setDraft((prev) => ({
                              ...prev,
                              entryRules: prev.entryRules.map((row) => (
                                row.kind === kind.kind
                                  ? { ...row, max: Number(e.target.value) }
                                  : row
                              )),
                            }))}
                          />
                        </>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </fieldset>
            <div className="admin-field">
              <label className="admin-label" htmlFor="slumber-prize-sponsor">Sponsor name (optional)</label>
              <input
                id="slumber-prize-sponsor"
                className="admin-input"
                maxLength={80}
                value={draft.prizeSponsorName}
                onChange={(e) => setDraft((prev) => ({ ...prev, prizeSponsorName: e.target.value }))}
                placeholder="Sponsor"
              />
            </div>
            <div className="admin-field">
              <label className="admin-label" htmlFor="slumber-prize-name">Prize name (optional)</label>
              <input
                id="slumber-prize-name"
                className="admin-input"
                maxLength={120}
                value={draft.prizeName}
                onChange={(e) => setDraft((prev) => ({ ...prev, prizeName: e.target.value }))}
                placeholder="Prize"
              />
            </div>
            <div className="admin-field">
              <label className="admin-label" htmlFor="slumber-prize-url">Product URL (optional)</label>
              <input
                id="slumber-prize-url"
                className="admin-input"
                value={draft.prizeUrl}
                onChange={(e) => setDraft((prev) => ({ ...prev, prizeUrl: e.target.value }))}
                placeholder="https://"
              />
            </div>
            <div className="admin-field">
              <label className="admin-label" htmlFor="slumber-prize-logo">Logo URL (optional)</label>
              <input
                id="slumber-prize-logo"
                className="admin-input"
                value={draft.prizeLogoUrl}
                onChange={(e) => setDraft((prev) => ({ ...prev, prizeLogoUrl: e.target.value }))}
                placeholder="https://"
              />
              <input
                className="admin-input"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                style={{ marginTop: 8 }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  void uploadAdminCampaignImage(file)
                    .then((url) => setDraft((prev) => ({ ...prev, prizeLogoUrl: url })))
                    .catch((err: unknown) => setFormError(slumberChallengeErrorMessage(err, 'Could not upload the logo.')));
                }}
              />
            </div>
            <div className="admin-field">
              <label className="admin-label" htmlFor="slumber-prize-image">Prize image URL (optional)</label>
              <input
                id="slumber-prize-image"
                className="admin-input"
                value={draft.prizeImageUrl}
                onChange={(e) => setDraft((prev) => ({ ...prev, prizeImageUrl: e.target.value }))}
                placeholder="https://"
              />
              <input
                className="admin-input"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                style={{ marginTop: 8 }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  void uploadAdminCampaignImage(file)
                    .then((url) => setDraft((prev) => ({ ...prev, prizeImageUrl: url })))
                    .catch((err: unknown) => setFormError(slumberChallengeErrorMessage(err, 'Could not upload the prize image.')));
                }}
              />
            </div>
            <div className="admin-field">
              <label className="admin-label" htmlFor="slumber-prize-extra">More prize photos (optional, one URL per line)</label>
              <textarea
                id="slumber-prize-extra"
                className="admin-input"
                rows={2}
                value={draft.prizeExtraUrls}
                onChange={(e) => setDraft((prev) => ({ ...prev, prizeExtraUrls: e.target.value }))}
              />
            </div>
            <div className="admin-field">
              <label className="admin-label" htmlFor="slumber-rules">Official rules (optional)</label>
              <textarea
                id="slumber-rules"
                className="admin-input"
                rows={8}
                value={draft.officialRules}
                onChange={(e) => setDraft((prev) => ({ ...prev, officialRules: e.target.value }))}
                placeholder="Eligibility, window, 1 entry at goal, odds, prize, Apple is not a sponsor…"
              />
            </div>
            <div className="admin-field">
              <label className="admin-label" htmlFor="slumber-rules-url">Official rules URL (optional)</label>
              <input
                id="slumber-rules-url"
                className="admin-input"
                value={draft.officialRulesUrl}
                onChange={(e) => setDraft((prev) => ({ ...prev, officialRulesUrl: e.target.value }))}
                placeholder="https://useslumber.com/prize-drawing-rules"
              />
            </div>
          </>
        ) : null}
        <AdminFilterBar nested>
          <AdminFilterField label="Goal (hours)" htmlFor="slumber-race-goal">
            <input
              id="slumber-race-goal"
              className="admin-input"
              type="number"
              min={10}
              max={100}
              step="0.5"
              disabled={locked}
              value={draft.goalHours}
              onChange={(e) => setDraft((prev) => ({ ...prev, goalHours: e.target.value }))}
            />
          </AdminFilterField>
          <AdminFilterField label="Max participants" htmlFor="slumber-race-max">
            <input
              id="slumber-race-max"
              className="admin-input"
              type="number"
              min={2}
              disabled={locked}
              value={draft.maxParticipants}
              onChange={(e) => setDraft((prev) => ({ ...prev, maxParticipants: e.target.value }))}
              placeholder="No cap"
            />
          </AdminFilterField>
        </AdminFilterBar>
        <label className="admin-checkbox-label">
          <input
            type="checkbox"
            checked={draft.noExpiration}
            disabled={locked || draft.isDrawing}
            onChange={(e) => setDraft((prev) => ({ ...prev, noExpiration: e.target.checked }))}
          />
          <span>No end date</span>
        </label>
        {!draft.noExpiration && !started ? (
          <AdminFilterField label="Duration (days)" htmlFor="slumber-race-days">
            <input
              id="slumber-race-days"
              className="admin-input"
              type="number"
              min={1}
              max={100}
              disabled={locked}
              value={draft.expirationDays}
              onChange={(e) => setDraft((prev) => ({ ...prev, expirationDays: e.target.value }))}
            />
          </AdminFilterField>
        ) : null}
        {!draft.noExpiration && started && !locked ? (
          <AdminDateField
            id="slumber-race-end"
            label="Ends"
            value={draft.endsOn}
            min={isoToLocalDateInput(row?.started_at)}
            placeholder="End date"
            onChange={(endsOn) => setDraft((prev) => ({ ...prev, endsOn }))}
          />
        ) : null}
        {row ? (
          <label className="admin-checkbox-label">
            <input
              type="checkbox"
              checked={draft.joinEnabled}
              disabled={locked}
              onChange={(e) => setDraft((prev) => ({ ...prev, joinEnabled: e.target.checked }))}
            />
            <span>Join link open</span>
          </label>
        ) : null}
        {formError ? <p className="admin-error">{formError}</p> : null}
        <div className="admin-form-actions">
          <button className="admin-button" type="submit" disabled={saving}>
            {saving ? 'Saving…' : row ? 'Save challenge' : 'Create challenge'}
          </button>
          <button className="admin-button admin-button-ghost" type="button" onClick={onClose} disabled={saving}>
            Cancel
          </button>
        </div>
      </form>
    </AdminFormDialog>
  );
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function downloadDrawingCsv(
  filename: string,
  rows: AdminDrawingRosterRow[],
  qualifiedOnly: boolean,
  includeReferrals: boolean,
) {
  const list = qualifiedOnly ? rows.filter((row) => row.entries > 0) : rows;
  const header = includeReferrals
    ? ['username', 'user_id', 'email', 'hours', 'entries', 'amoe_entries', 'referred_by', 'referrals_joined', 'referrals_qualified']
    : ['username', 'user_id', 'email', 'hours', 'entries', 'amoe_entries'];
  const lines = [
    header.join(','),
    ...list.map((row) => {
      const base = [
        csvEscape(row.username ?? ''),
        row.user_id,
        csvEscape(row.email ?? ''),
        String(Math.round((row.accrued_minutes / 60) * 10) / 10),
        String(row.entries),
        String(row.drawing_alternate_entries ?? 0),
      ];
      if (!includeReferrals) return base.join(',');
      return [
        ...base,
        csvEscape(row.referred_by_username ?? ''),
        String(row.referrals_joined),
        String(row.referrals_qualified),
      ].join(',');
    }),
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
  const href = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(href);
}

function DrawingRosterDialog({
  row,
  onClose,
}: {
  row: AdminSlumberChallengeRow;
  onClose: () => void;
}) {
  const rosterQuery = useAdminDrawingRoster(row.id);
  const setParticipant = useSetAdminDrawingParticipant();
  const roster = rosterQuery.data;
  const people = roster?.rows ?? [];
  const includeReferrals = Boolean(row.drawing_referrals);
  const [amoeDrafts, setAmoeDrafts] = useState<Record<string, string>>({});
  const [amoeError, setAmoeError] = useState<string | null>(null);
  const goalEntryDefault = useMemo(() => {
    const rules = parseDrawingEntryConfig(row.drawing_entry_config, true, Boolean(row.drawing_referrals));
    const goal = rules.find((rule) => rule.kind === 'goal');
    return Math.max(1, goal?.entries ?? 1);
  }, [row.drawing_entry_config, row.drawing_referrals]);

  const amoeValue = (person: AdminDrawingRosterRow) => {
    if (person.user_id in amoeDrafts) return amoeDrafts[person.user_id];
    if ((person.drawing_alternate_entries ?? 0) > 0) return String(person.drawing_alternate_entries);
    return String(goalEntryDefault);
  };

  const grantAmoe = (person: AdminDrawingRosterRow) => {
    const count = Math.round(Number(amoeValue(person)));
    if (!Number.isFinite(count) || count < 1 || count > 100) {
      setAmoeError('AMOE entries must be between 1 and 100.');
      return;
    }
    setAmoeError(null);
    void setParticipant.mutateAsync({
      challengeId: row.id,
      userId: person.user_id,
      patch: { alternateEntries: count },
    });
  };

  return (
    <AdminFormDialog open wide onClose={onClose} title={`Entries · ${row.title?.trim() || 'drawing'}`}>
      {rosterQuery.isLoading ? <p className="admin-muted">Loading roster…</p> : null}
      {rosterQuery.error ? (
        <p className="admin-error">{slumberChallengeErrorMessage(rosterQuery.error, 'Could not load the roster.')}</p>
      ) : null}
      {roster ? (
        <p className="admin-muted">
          {roster.joined} joined · {roster.qualified} entered
          {includeReferrals ? ` · ${roster.referralJoins} referral signups` : ''}
          {' · '}
          AMOE is that person’s goal entries. If they also hit the sleep goal, they get the higher count.
        </p>
      ) : null}
      {amoeError ? <p className="admin-error">{amoeError}</p> : null}
      {setParticipant.error ? (
        <p className="admin-error">{slumberChallengeErrorMessage(setParticipant.error, 'Could not update that entry.')}</p>
      ) : null}
      <div className="admin-form-actions">
        <button
          className="admin-button"
          type="button"
          disabled={people.length === 0}
          onClick={() => downloadDrawingCsv(`${row.title || 'drawing'}-entries.csv`, people, true, includeReferrals)}
        >
          Export entries
        </button>
        <button
          className="admin-button admin-button-ghost"
          type="button"
          disabled={people.length === 0}
          onClick={() => downloadDrawingCsv(`${row.title || 'drawing'}-roster.csv`, people, false, includeReferrals)}
        >
          Export roster
        </button>
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Hours</th>
              <th>Entries</th>
              {includeReferrals ? <th>Referred by</th> : null}
              {includeReferrals ? <th>Referrals</th> : null}
              <th></th>
            </tr>
          </thead>
          <tbody>
            {people.map((person) => (
              <tr key={person.user_id}>
                <td>
                  <Link to={`/profile/${person.user_id}`} className="admin-inline-link">
                    @{person.username}
                  </Link>
                </td>
                <td>{person.email ?? '—'}</td>
                <td>{Math.round((person.accrued_minutes / 60) * 10) / 10}</td>
                <td>
                  {person.entries}
                  {person.drawing_ineligible_at ? ' (out)' : ''}
                  {(person.drawing_alternate_entries ?? 0) > 0 ? ` · AMOE ${person.drawing_alternate_entries}` : ''}
                </td>
                {includeReferrals ? (
                  <td>{person.referred_by_username ? `@${person.referred_by_username}` : '—'}</td>
                ) : null}
                {includeReferrals ? (
                  <td>{drawingReferralCountsLine(person.referrals_joined, person.referrals_qualified)}</td>
                ) : null}
                <td>
                  <AdminGridActions>
                    <AdminGridAction
                      onClick={() => {
                        void setParticipant.mutateAsync({
                          challengeId: row.id,
                          userId: person.user_id,
                          patch: { ineligible: !person.drawing_ineligible_at },
                        });
                      }}
                    >
                      {person.drawing_ineligible_at ? 'Restore' : 'Disqualify'}
                    </AdminGridAction>
                    <input
                      className="admin-input admin-amoe-count"
                      type="number"
                      min={1}
                      max={100}
                      aria-label={`AMOE entries for @${person.username}`}
                      value={amoeValue(person)}
                      onChange={(e) => {
                        setAmoeDrafts((prev) => ({ ...prev, [person.user_id]: e.target.value }));
                      }}
                    />
                    <AdminGridAction
                      disabled={setParticipant.isPending}
                      onClick={() => grantAmoe(person)}
                    >
                      {(person.drawing_alternate_entries ?? 0) > 0 ? 'Update' : 'Grant'}
                    </AdminGridAction>
                    {(person.drawing_alternate_entries ?? 0) > 0 ? (
                      <AdminGridAction
                        disabled={setParticipant.isPending}
                        onClick={() => {
                          void setParticipant.mutateAsync({
                            challengeId: row.id,
                            userId: person.user_id,
                            patch: { alternateEntries: 0 },
                          });
                        }}
                      >
                        Clear
                      </AdminGridAction>
                    ) : null}
                  </AdminGridActions>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="admin-form-actions">
        <button className="admin-button admin-button-ghost" type="button" onClick={onClose}>Close</button>
      </div>
    </AdminFormDialog>
  );
}

export default function AdminSlumberChallenges() {
  const [statusFilter, setStatusFilter] = useState('');
  const [editing, setEditing] = useState<AdminSlumberChallengeRow | null | undefined>(undefined);
  const [rosterRow, setRosterRow] = useState<AdminSlumberChallengeRow | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const filters = useMemo(() => ({ status: statusFilter || null }), [statusFilter]);
  const { paginationModel, setPaginationModel, filters: applied } = usePaginatedFilters(filters, [statusFilter]);
  const racesQuery = useAdminSlumberChallenges(applied);
  const startMutation = useStartAdminSlumberChallenge();
  const endMutation = useEndAdminSlumberChallenge();

  const races = racesQuery.data?.rows ?? [];
  const total = racesQuery.data?.total ?? 0;
  const error = racesQuery.error
    ? slumberChallengeErrorMessage(racesQuery.error, 'Could not load Slumber challenges.')
    : actionError;

  const runAction = async (id: string, action: () => Promise<unknown>, fallback: string) => {
    setActionError(null);
    setActingId(id);
    try {
      await action();
    } catch (err: unknown) {
      setActionError(slumberChallengeErrorMessage(err, fallback));
    } finally {
      setActingId(null);
    }
  };

  const columns = useMemo<GridColDef<AdminSlumberChallengeRow>[]>(() => [
    {
      field: 'title',
      headerName: 'Challenge',
      flex: 1.2,
      minWidth: 160,
      valueGetter: (_value, row) => row.title ?? 'Untitled',
      renderCell: ({ row }) => (
        <Link to={`/challenge/${row.id}`} className="admin-inline-link">
          {row.title?.trim() || 'Untitled'}
        </Link>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      flex: 0,
      valueGetter: (_value, row) => statusLabel(row.status),
      renderCell: ({ row }) => (
        <AdminStatusPill tone={row.status === 'active' ? 'on' : row.status === 'cancelled' ? 'off' : 'neutral'}>
          {statusLabel(row.status)}
        </AdminStatusPill>
      ),
    },
    {
      field: 'goal_minutes',
      headerName: 'Goal',
      width: 88,
      flex: 0,
      valueGetter: (_value, row) => row.goal_minutes,
      valueFormatter: (value) => formatGoal(Number(value)),
    },
    {
      field: 'expires_at',
      headerName: 'Window',
      width: 140,
      flex: 0,
      valueGetter: (_value, row) => windowLabel(row),
    },
    {
      field: 'participant_count',
      headerName: 'Joined',
      type: 'number',
      width: 88,
      flex: 0,
    },
    {
      field: 'is_drawing',
      headerName: 'Kind',
      width: 110,
      flex: 0,
      valueGetter: (_value, row) => (row.is_drawing ? 'Drawing' : 'Race'),
    },
    {
      field: 'join_enabled',
      headerName: 'Join',
      width: 96,
      flex: 0,
      valueGetter: (_value, row) => (row.join_enabled ? 'Open' : 'Closed'),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      ...gridActionsColumn,
      width: 360,
      minWidth: 360,
      renderCell: ({ row }) => (
        <AdminGridActions>
          <AdminGridAction
            onClick={(e) => {
              e.stopPropagation();
              setEditing(row);
            }}
          >
            Edit
          </AdminGridAction>
          {row.status === 'pending' ? (
            <AdminGridAction
              disabled={actingId === row.id}
              onClick={(e) => {
                e.stopPropagation();
                const name = row.title?.trim() || 'this challenge';
                if (!window.confirm(`Start “${name}” now? The challenge window opens immediately.`)) return;
                void runAction(row.id, () => startMutation.mutateAsync(row.id), 'Could not start the challenge.');
              }}
            >
              Start
            </AdminGridAction>
          ) : null}
          {row.is_drawing ? (
            <AdminGridAction
              onClick={(e) => {
                e.stopPropagation();
                setRosterRow(row);
              }}
            >
              Entries
            </AdminGridAction>
          ) : null}
          <AdminGridAction to={`/challenge/${row.id}`} onClick={(e) => e.stopPropagation()}>
            Open
          </AdminGridAction>
          {row.status === 'pending' || row.status === 'active' ? (
            <AdminGridAction
              variant="danger"
              disabled={actingId === row.id}
              onClick={(e) => {
                e.stopPropagation();
                const name = row.title?.trim() || 'this challenge';
                const pending = row.status === 'pending';
                const msg = pending
                  ? `Cancel “${name}”? It will not start, and the join link will close. Linked campaigns stay up until you end them.`
                  : `End “${name}” now? Participants get a catch-up window, then it finishes. The join link will close. Linked campaigns stay up until you end them.`;
                if (!window.confirm(msg)) return;
                void runAction(row.id, () => endMutation.mutateAsync(row.id), 'Could not end the challenge.');
              }}
            >
              {row.status === 'pending' ? 'Cancel' : 'End'}
            </AdminGridAction>
          ) : null}
        </AdminGridActions>
      ),
    },
  ], [actingId, endMutation, startMutation]);

  return (
    <AdminSection
      className="admin-slumber-races"
      error={error}
      lead="Official challenges hosted by Slumber (races and drawings). Create them here, Start when they should score, and link a campaign separately if you want a promo. Campaign dates do not have to match the challenge window. Drawings: entries at the goal; export the roster for an off-app drawing."
    >
      <AdminListToolbar
        actions={(
          <button className="admin-button" type="button" onClick={() => setEditing(null)}>
            + New challenge
          </button>
        )}
      >
        <p className="admin-muted">{pluralCount(total, 'challenge')}</p>
      </AdminListToolbar>
      <div className="admin-quick-chips" role="group" aria-label="Challenge status">
        {STATUS_FILTERS.map((status) => (
          <button
            key={status.value || 'all'}
            type="button"
            className={`admin-tab${statusFilter === status.value ? ' active' : ''}`}
            onClick={() => setStatusFilter(status.value)}
          >
            {status.label}
          </button>
        ))}
      </div>
      {editing !== undefined ? (
        <RaceForm
          key={editing?.id ?? 'new'}
          row={editing}
          onClose={() => setEditing(undefined)}
        />
      ) : null}
      {rosterRow ? (
        <DrawingRosterDialog
          key={rosterRow.id}
          row={rosterRow}
          onClose={() => setRosterRow(null)}
        />
      ) : null}
      <AdminDataGrid
        persistKey="admin-slumber-races-v1"
        rows={races}
        columns={columns}
        getRowId={(row) => row.id}
        loading={racesQuery.isFetching}
        label="Slumber challenges"
        serverPagination={{
          rowCount: total,
          paginationModel,
          onPaginationModelChange: setPaginationModel,
        }}
      />
      {!racesQuery.isLoading && total === 0 ? (
        <p className="admin-muted">No Slumber challenges yet.</p>
      ) : null}
    </AdminSection>
  );
}
