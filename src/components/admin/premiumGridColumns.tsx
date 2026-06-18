import type { GridColDef } from '@mui/x-data-grid';
import type { PremiumUserRow } from '../../lib/admin';
import AdminGridAction from './AdminGridAction';
import AdminGridActions from './AdminGridActions';
import { emailColumn, usernameColumn } from './gridColumnHelpers';
import { formatDaysRemaining, formatPremiumExpiry } from './premiumDateUtils';

const GRANT_TYPE_LABELS: Record<string, string> = {
  lifetime: 'Lifetime',
  past_due: 'Past due',
  timed: 'Timed',
};

type PremiumColumnOptions = {
  actingUserId: string | null;
  saving: boolean;
  onExtendYear: (row: PremiumUserRow) => void;
  onLifetime: (row: PremiumUserRow) => void;
  onRevoke: (row: PremiumUserRow) => void;
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
      width: 100,
      valueGetter: (_value, row) => GRANT_TYPE_LABELS[row.grant_type] ?? row.grant_type,
    },
    {
      field: 'premium_until',
      headerName: 'Expires',
      type: 'dateTime',
      flex: 1,
      minWidth: 120,
      valueGetter: (_value, row) => (row.premium_until ? new Date(row.premium_until) : null),
      valueFormatter: (value: Date | null) => formatPremiumExpiry(value ? value.toISOString() : null),
    },
    {
      field: 'days_remaining',
      headerName: 'Remaining',
      type: 'number',
      width: 110,
      valueGetter: (_value, row) => (
        row.grant_type === 'lifetime' ? null : row.days_remaining
      ),
      valueFormatter: (_value, row) => formatDaysRemaining(row.days_remaining, row.grant_type),
    },
    {
      field: 'actions',
      headerName: '',
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      width: 212,
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
