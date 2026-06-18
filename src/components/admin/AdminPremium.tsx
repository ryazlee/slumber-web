import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { GridColDef } from '@mui/x-data-grid';
import type { PremiumUserRow, RecentUserRow } from '../../lib/admin';
import { getOptionalQueryErrorMessage } from '../../lib/queryError';
import { useAdminDebouncedSearch } from '../../hooks/useAdminDebouncedSearch';
import { useAdminUserPickerSearch } from '../../hooks/useAdminUserPickerSearch';
import { usePaginatedFilters } from '../../hooks/usePaginatedFilters';
import {
  usePremiumMetrics,
  usePremiumUsers,
  useUpdateUserPremium,
} from '../../hooks/useAdmin';
import AdminDataGrid from './AdminDataGrid';
import AdminFilterBar, { AdminFilterField } from './AdminFilterBar';
import AdminGridClientFilterHint from './AdminGridClientFilterHint';
import AdminListToolbar from './AdminListToolbar';
import AdminMetricCard from './AdminMetricCard';
import AdminPanel from './AdminPanel';
import AdminSection, { AdminTableSummary } from './AdminSection';
import { AdminUserPickerList, AdminUserPickerSearchField } from './AdminUserPicker';
import { pluralCount, formatNumber } from './format';
import { buildPremiumSubscriberColumns } from './premiumGridColumns';
import {
  defaultPremiumUntilDate,
  extendPremiumUntilOneYear,
  lifetimePremiumUntilDate,
  premiumUntilFromDateInput,
  toDateInputValue,
} from './premiumDateUtils';

export default function AdminPremium() {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [draftUntil, setDraftUntil] = useState(defaultPremiumUntilDate());
  const [grantError, setGrantError] = useState<string | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);
  const [actingUserId, setActingUserId] = useState<string | null>(null);
  const grantSearchRef = useRef<HTMLInputElement>(null);

  const {
    query: grantQuery,
    setQuery: setGrantQuery,
    trimmedDebounced: debouncedGrantQuery,
    isActive: grantSearchActive,
  } = useAdminDebouncedSearch();

  const {
    query: subscriberQuery,
    setQuery: setSubscriberQuery,
    trimmedDebounced: debouncedSubscriberQuery,
  } = useAdminDebouncedSearch();

  const subscriberBase = useMemo(() => ({
    query: debouncedSubscriberQuery || undefined,
  }), [debouncedSubscriberQuery]);

  const { paginationModel, setPaginationModel, filters: subscriberFilters } = usePaginatedFilters(
    subscriberBase,
    [debouncedSubscriberQuery],
  );

  const metricsQuery = usePremiumMetrics();
  const subscribersQuery = usePremiumUsers(subscriberFilters);
  const grantUsersQuery = useAdminUserPickerSearch(
    debouncedGrantQuery,
    grantSearchActive,
    {
      activeLimit: 25,
      inactive: { limit: 15, premiumOnly: false },
    },
  );
  const updatePremiumMutation = useUpdateUserPremium();

  const metrics = metricsQuery.data ?? null;
  const subscribers = subscribersQuery.data?.rows ?? [];
  const subscribersTotal = subscribersQuery.data?.total ?? 0;
  const grantUsers = grantUsersQuery.data?.rows ?? [];
  const selectedUser = grantUsers.find((u) => u.id === selectedUserId) ?? null;

  const loading = metricsQuery.isLoading;
  const error = getOptionalQueryErrorMessage(metricsQuery.error, 'Could not load Premium metrics.')
    ?? getOptionalQueryErrorMessage(subscribersQuery.error, 'Could not load subscribers.');

  useEffect(() => {
    grantSearchRef.current?.focus();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      setDraftUntil(
        selectedUser.is_premium
          ? toDateInputValue(selectedUser.premium_until) || defaultPremiumUntilDate()
          : defaultPremiumUntilDate(),
      );
    }
  }, [selectedUser]);

  const grantPremium = useCallback(async (
    user: Pick<RecentUserRow, 'id' | 'username' | 'is_premium' | 'premium_until'>,
    opts: { until: string; revoke?: boolean },
  ) => {
    setGrantError(null);
    setRowError(null);
    setActingUserId(user.id);
    try {
      await updatePremiumMutation.mutateAsync({
        userId: user.id,
        isPremium: !opts.revoke,
        premiumUntil: opts.revoke ? null : opts.until,
      });
      if (user.id === selectedUserId && opts.revoke) {
        setSelectedUserId(null);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not update Premium.';
      if (user.id === selectedUserId) {
        setGrantError(message);
      } else {
        setRowError(message);
      }
    } finally {
      setActingUserId(null);
    }
  }, [selectedUserId, updatePremiumMutation]);

  const saveGrant = async () => {
    if (!selectedUser) {
      setGrantError('Choose a user first.');
      return;
    }
    await grantPremium(selectedUser, {
      until: premiumUntilFromDateInput(draftUntil),
    });
  };

  const columns = useMemo(
    () => buildPremiumSubscriberColumns({
      actingUserId,
      saving: updatePremiumMutation.isPending,
      onExtendYear: (row) => {
        void grantPremium(
          { id: row.id, username: row.username, is_premium: true, premium_until: row.premium_until },
          { until: extendPremiumUntilOneYear(row.premium_until) },
        );
      },
      onLifetime: (row) => {
        void grantPremium(
          { id: row.id, username: row.username, is_premium: true, premium_until: row.premium_until },
          { until: premiumUntilFromDateInput(lifetimePremiumUntilDate()) },
        );
      },
      onRevoke: (row) => {
        void grantPremium(
          { id: row.id, username: row.username, is_premium: true, premium_until: row.premium_until },
          { revoke: true, until: '' },
        );
      },
    }),
    [actingUserId, grantPremium, updatePremiumMutation.isPending],
  );

  const savingGrant = updatePremiumMutation.isPending && actingUserId === selectedUserId;

  return (
    <AdminSection className="admin-premium" error={error}>
      {loading && !metrics ? (
        <p className="admin-muted">Loading Premium metrics…</p>
      ) : metrics ? (
        <div className="admin-metric-grid">
          <AdminMetricCard
            label="Active Premium"
            value={metrics.premium_active}
            sub={`${metrics.premium_pct}% of ${formatNumber(metrics.total_users)} users`}
          />
          <AdminMetricCard
            label="Expiring ≤7 days"
            value={metrics.expiring_7d}
            sub="Timed grants"
          />
          <AdminMetricCard
            label="Expiring ≤30 days"
            value={metrics.expiring_30d}
            sub="Timed grants"
          />
          <AdminMetricCard
            label="Lifetime / comp"
            value={metrics.lifetime_grants}
            sub="No practical expiry"
          />
          {metrics.past_due > 0 ? (
            <AdminMetricCard
              label="Past due"
              value={metrics.past_due}
              sub="Flagged premium but expired"
            />
          ) : null}
        </div>
      ) : null}

      <div className="admin-split">
        <AdminPanel
          step={1}
          title="Grant Premium"
          description="Search any user, pick a duration, and save. Comps set is_premium — separate from the cosmetic premium avatar role."
        >
          <AdminUserPickerSearchField
            inputId="premium-grant-search"
            label="Search user"
            placeholder="Username or email…"
            query={grantQuery}
            searchRef={grantSearchRef}
            onQueryChange={(value) => {
              setGrantQuery(value);
              setSelectedUserId(null);
              setGrantError(null);
            }}
          />

          <AdminUserPickerList
            users={grantUsers}
            selectedUserId={selectedUserId}
            onSelectUser={(userId) => {
              setSelectedUserId(userId);
              setGrantError(null);
            }}
            searching={grantUsersQuery.isFetching}
            isActive={grantSearchActive}
            trimmedQuery={debouncedGrantQuery}
            metaMode="premium"
            formatJoined={() => ''}
          />

          {selectedUser ? (
            <div className="admin-premium-grant-form">
              <p className="admin-muted">
                Granting <strong>@{selectedUser.username}</strong>
                {selectedUser.is_premium ? ' · already Premium — save to update expiry' : ''}
              </p>
              <div className="admin-form-actions">
                <input
                  className="admin-input"
                  type="date"
                  value={draftUntil}
                  onChange={(e) => setDraftUntil(e.target.value)}
                  disabled={savingGrant}
                />
                <button
                  type="button"
                  className="admin-button admin-button-ghost"
                  onClick={() => setDraftUntil(defaultPremiumUntilDate())}
                  disabled={savingGrant}
                >
                  +1 year
                </button>
                <button
                  type="button"
                  className="admin-button admin-button-ghost"
                  onClick={() => setDraftUntil(lifetimePremiumUntilDate())}
                  disabled={savingGrant}
                >
                  Lifetime
                </button>
              </div>
              <div className="admin-form-actions">
                <button
                  className="admin-button"
                  type="button"
                  onClick={() => void saveGrant()}
                  disabled={savingGrant}
                >
                  {savingGrant ? 'Saving…' : selectedUser.is_premium ? 'Update Premium' : 'Grant Premium'}
                </button>
                {selectedUser.is_premium ? (
                  <button
                    className="admin-button admin-button-ghost"
                    type="button"
                    disabled={savingGrant}
                    onClick={() => void grantPremium(selectedUser, { revoke: true, until: '' })}
                  >
                    Revoke
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}

          {grantError ? <p className="admin-error">{grantError}</p> : null}
        </AdminPanel>
      </div>

      <AdminSubscribersSection
        subscribers={subscribers}
        subscribersTotal={subscribersTotal}
        subscriberQuery={subscriberQuery}
        onSubscriberQueryChange={setSubscriberQuery}
        columns={columns}
        loading={subscribersQuery.isFetching}
        rowError={rowError}
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
      />
    </AdminSection>
  );
}

function AdminSubscribersSection({
  subscribers,
  subscribersTotal,
  subscriberQuery,
  onSubscriberQueryChange,
  columns,
  loading,
  rowError,
  paginationModel,
  onPaginationModelChange,
}: {
  subscribers: PremiumUserRow[];
  subscribersTotal: number;
  subscriberQuery: string;
  onSubscriberQueryChange: (value: string) => void;
  columns: GridColDef<PremiumUserRow>[];
  loading: boolean;
  rowError: string | null;
  paginationModel: { page: number; pageSize: number };
  onPaginationModelChange: (model: { page: number; pageSize: number }) => void;
}) {
  return (
    <>
      <AdminListToolbar>
        <AdminTableSummary>
          {pluralCount(subscribersTotal, 'active Premium subscriber', 'active Premium subscribers')}
          {' · '}
          <AdminGridClientFilterHint />
        </AdminTableSummary>
      </AdminListToolbar>

      <AdminFilterBar nested>
        <AdminFilterField label="Filter subscribers" htmlFor="premium-subscriber-search" className="admin-filter-field--wide">
          <input
            id="premium-subscriber-search"
            className="admin-input"
            type="search"
            placeholder="Filter by username or email…"
            value={subscriberQuery}
            onChange={(e) => onSubscriberQueryChange(e.target.value)}
            autoComplete="off"
          />
        </AdminFilterField>
      </AdminFilterBar>

      {rowError ? <p className="admin-error">{rowError}</p> : null}

      <AdminDataGrid
        persistKey="admin-premium-subscribers"
        rows={subscribers}
        columns={columns}
        getRowId={(row) => row.id}
        loading={loading}
        label="Premium subscribers"
        serverPagination={{
          rowCount: subscribersTotal,
          paginationModel,
          onPaginationModelChange,
        }}
        initialState={{
          sorting: { sortModel: [{ field: 'premium_until', sort: 'asc' }] },
        }}
      />
    </>
  );
}
