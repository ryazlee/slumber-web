import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import type { GridColDef } from '@mui/x-data-grid';
import type { AdminSlumberChallengeRow } from '../../lib/admin';
import { slumberChallengeErrorMessage } from '../../lib/admin';
import {
  useAdminCancelChallenge,
  useAdminSlumberChallenges,
  useCreateAdminSlumberChallenge,
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
  goalHours: string;
  noExpiration: boolean;
  expirationDays: string;
  endsOn: string;
  maxParticipants: string;
  joinEnabled: boolean;
};

function draftFromRow(row: AdminSlumberChallengeRow): Draft {
  return {
    title: row.title ?? '',
    goalHours: goalHoursLabel(row.goal_minutes),
    noExpiration: row.no_expiration,
    expirationDays: String(row.expiration_days || 10),
    endsOn: isoToLocalDateInput(row.expires_at),
    maxParticipants: row.max_participants != null ? String(row.max_participants) : '',
    joinEnabled: row.join_enabled,
  };
}

const EMPTY_DRAFT: Draft = {
  title: '',
  goalHours: '40',
  noExpiration: false,
  expirationDays: '10',
  endsOn: '',
  maxParticipants: '',
  joinEnabled: true,
};

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
    if (!locked) {
      if (!Number.isFinite(goalHours) || goalHours < 10 || goalHours > 100) {
        setFormError('Goal must be between 10 and 100 hours.');
        return;
      }
      if (maxParticipants != null && (!Number.isInteger(maxParticipants) || maxParticipants < 2 || maxParticipants > 10000)) {
        setFormError('Max racers must be between 2 and 10,000, or left blank.');
        return;
      }
      if (!draft.noExpiration && !started && (!Number.isInteger(days) || days < 1 || days > 100)) {
        setFormError('Duration must be between 1 and 100 days.');
        return;
      }
      if (!draft.noExpiration && started && !draft.endsOn) {
        setFormError('Pick an end date, or leave the race without an end.');
        return;
      }
    }

    const goalMinutes = Math.round(goalHours * 60);
    try {
      if (!row) {
        await createMutation.mutateAsync({
          title,
          goalMinutes,
          noExpiration: draft.noExpiration,
          expiresInDays: draft.noExpiration ? 10 : days,
          maxParticipants,
        });
      } else {
        await updateMutation.mutateAsync({
          challengeId: row.id,
          draft: {
            title,
            goalMinutes,
            noExpiration: draft.noExpiration,
            expirationDays: Number.isInteger(days) ? days : row.expiration_days,
            expiresAt: draft.noExpiration || !started ? null : localDateInputToIso(draft.endsOn, 'end'),
            maxParticipants,
            joinEnabled: draft.joinEnabled,
          },
        });
      }
      onClose();
    } catch (err: unknown) {
      setFormError(slumberChallengeErrorMessage(err, 'Could not save the race.'));
    }
  };

  return (
    <AdminFormDialog
      open
      wide
      onClose={onClose}
      title={row ? `Edit ${row.title?.trim() || 'race'}` : 'New Slumber race'}
    >
      <p className="admin-panel-desc">
        {row
          ? locked
            ? 'This race has finished. The name can still be changed.'
            : started
              ? 'The start time stays put. A later end date keeps the race going. An end date that has already passed opens the catch-up window.'
              : 'Start the race from the table when it should go live. Duration is how many days it runs after that.'
          : 'This creates a pending race hosted by Slumber. You are not added as a racer.'}
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
          <AdminFilterField label="Max racers" htmlFor="slumber-race-max">
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
            disabled={locked}
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
            {saving ? 'Saving…' : row ? 'Save changes' : 'Create race'}
          </button>
          <button className="admin-button admin-button-ghost" type="button" onClick={onClose} disabled={saving}>
            Cancel
          </button>
        </div>
      </form>
    </AdminFormDialog>
  );
}

export default function AdminSlumberChallenges() {
  const [statusFilter, setStatusFilter] = useState('');
  const [editing, setEditing] = useState<AdminSlumberChallengeRow | null | undefined>(undefined);
  const [actingId, setActingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const filters = useMemo(() => ({ status: statusFilter || null }), [statusFilter]);
  const { paginationModel, setPaginationModel, filters: applied } = usePaginatedFilters(filters, [statusFilter]);
  const racesQuery = useAdminSlumberChallenges(applied);
  const startMutation = useStartAdminSlumberChallenge();
  const cancelMutation = useAdminCancelChallenge();

  const races = racesQuery.data?.rows ?? [];
  const total = racesQuery.data?.total ?? 0;
  const error = racesQuery.error
    ? slumberChallengeErrorMessage(racesQuery.error, 'Could not load Slumber races.')
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
      headerName: 'Race',
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
      headerName: 'Racers',
      type: 'number',
      width: 88,
      flex: 0,
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
      width: 300,
      minWidth: 300,
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
                const name = row.title?.trim() || 'this race';
                if (!window.confirm(`Start “${name}” now? The race window opens immediately.`)) return;
                void runAction(row.id, () => startMutation.mutateAsync(row.id), 'Could not start the race.');
              }}
            >
              Start
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
                const name = row.title?.trim() || 'this race';
                if (!window.confirm(`Cancel “${name}”?`)) return;
                void runAction(row.id, () => cancelMutation.mutateAsync(row.id), 'Could not cancel the race.');
              }}
            >
              Cancel
            </AdminGridAction>
          ) : null}
        </AdminGridActions>
      ),
    },
  ], [actingId, cancelMutation, startMutation]);

  return (
    <AdminSection
      className="admin-slumber-races"
      error={error}
      lead="Official races hosted by Slumber. Edit the name, goal, length, racer cap, and join link."
    >
      <AdminListToolbar
        actions={(
          <button className="admin-button" type="button" onClick={() => setEditing(null)}>
            + New race
          </button>
        )}
      >
        <p className="admin-muted">{pluralCount(total, 'race')}</p>
      </AdminListToolbar>
      <div className="admin-quick-chips" role="group" aria-label="Race status">
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
      <AdminDataGrid
        persistKey="admin-slumber-races-v1"
        rows={races}
        columns={columns}
        getRowId={(row) => row.id}
        loading={racesQuery.isFetching}
        label="Slumber races"
        serverPagination={{
          rowCount: total,
          paginationModel,
          onPaginationModelChange: setPaginationModel,
        }}
      />
      {!racesQuery.isLoading && total === 0 ? (
        <p className="admin-muted">No Slumber races yet.</p>
      ) : null}
    </AdminSection>
  );
}
