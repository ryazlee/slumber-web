import type { GridColDef } from '@mui/x-data-grid';
import type { PremiumUserRow } from '../../lib/admin';
import AdminGridAction from './AdminGridAction';
import AdminGridActions from './AdminGridActions';
import {
  AdminStatusPill,
  emailColumn,
  usernameColumn,
  type AdminMobileSummary,
} from './gridColumnHelpers';
import { formatDaysRemaining, formatPremiumExpiry } from './premiumDateUtils';

const GRANT_TYPE_LABELS: Record<string, string> = {
  lifetime: 'Lifetime',
  past_due: 'Past due',
  timed: 'Timed',
};

function grantLabel(row: PremiumUserRow): string {
  return GRANT_TYPE_LABELS[row.grant_type] ?? row.grant_type;
}

type PremiumColumnOptions = {
  actingUserId: string | null;
  saving: boolean;
  onExtendYear: (row: PremiumUserRow) => void;
  onLifetime: (row: PremiumUserRow) => void;
  onRevoke: (row: PremiumUserRow) => void;
};

export const premiumMobileSummary: AdminMobileSummary = {
  title: (row: PremiumUserRow) => `@${row.username}`,
  searchText: (row: PremiumUserRow) => [row.username, row.email, grantLabel(row)].filter(Boolean).join(' '),
  status: (row: PremiumUserRow) => (
    <AdminStatusPill tone={row.grant_type === 'past_due' ? 'off' : 'on'}>
      {grantLabel(row)}
    </AdminStatusPill>
  ),
  facts: [
    { label: 'Email', value: (row: PremiumUserRow) => row.email?.trim() || '—' },
    {
      label: 'Expires',
      value: (row: PremiumUserRow) => formatPremiumExpiry(row.premium_until),
    },
    {
      label: 'Remaining',
      value: (row: PremiumUserRow) => formatDaysRemaining(row.days_remaining, row.grant_type),
    },
  ],
};

export function buildPremiumSubscriberColumns({
  actingUserId,
  saving,
  onExtendYear,
  onLifetime,
  onRevoke,
}: PremiumColumnOptions): GridColDef<PremiumUserRow>[] {
  return [
    usernameColumn<PremiumUserRow>('User', { minWidth: 130 }),
    emailColumn<PremiumUserRow>(),
    {
      field: 'grant_type',
      headerName: 'Type',
      width: 110,
      flex: 0,
      valueGetter: (_value, row) => grantLabel(row),
      renderCell: ({ row }) => (
        <AdminStatusPill tone={row.grant_type === 'past_due' ? 'off' : 'on'}>
          {grantLabel(row)}
        </AdminStatusPill>
      ),
    },
    {
      field: 'days_remaining',
      headerName: 'Remaining',
      width: 110,
      flex: 0,
      valueGetter: (_value, row) => (
        row.grant_type === 'lifetime' ? null : row.days_remaining
      ),
      valueFormatter: (_value, row) => formatDaysRemaining(row.days_remaining, row.grant_type),
    },
    {
      field: 'premium_until',
      headerName: 'Expires',
      width: 152,
      flex: 0,
      valueGetter: (_value, row) => (row.premium_until ? new Date(row.premium_until) : null),
      valueFormatter: (value: Date | null) => formatPremiumExpiry(value ? value.toISOString() : null),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      flex: 0,
      width: 248,
      renderCell: ({ row }) => {
        const busy = actingUserId === row.id && saving;
        return (
          <AdminGridActions>
            <AdminGridAction
              disabled={busy}
              title="Extend premium by one year"
              onClick={(e) => {
                e.stopPropagation();
                onExtendYear(row);
              }}
            >
              +1 yr
            </AdminGridAction>
            <AdminGridAction
              disabled={busy}
              title="Grant lifetime premium"
              onClick={(e) => {
                e.stopPropagation();
                onLifetime(row);
              }}
            >
              Lifetime
            </AdminGridAction>
            <AdminGridAction
              variant="danger"
              disabled={busy}
              title="Revoke premium"
              onClick={(e) => {
                e.stopPropagation();
                onRevoke(row);
              }}
            >
              Revoke
            </AdminGridAction>
          </AdminGridActions>
        );
      },
    },
  ];
}
