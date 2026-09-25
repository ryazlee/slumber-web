import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { AdminChallengeRow, AdminClubRow } from '../../lib/admin';
import { formatAdminChallengeTitle, formatChallengeStatus, pluralCount } from '../../lib/format';
import { getOptionalQueryErrorMessage } from '../../lib/queryError';
import { useAdminChallenges, useAdminClubs } from '../../hooks/useAdmin';
import AdminSubsection from './AdminSubsection';

const DEFAULT_LIST_CAP = 12;

const STATUS_RANK: Record<string, number> = {
  active: 0,
  pending_completion: 1,
  pending: 2,
};

function clubMeta(row: AdminClubRow): string {
  const parts = [pluralCount(row.member_count, 'member'), `@${row.owner_username}`];
  if (typeof row.active_members_7d === 'number') {
    parts.push(`${row.active_members_7d} posted in 7d`);
  }
  if (row.pending_invites > 0) parts.push(`${row.pending_invites} pending`);
  return parts.join(' · ');
}

type ListProps = {
  /** Max rows to show. Omit or pass a large number for a full page list. */
  limit?: number;
  /** When true, hide the “all …” footer link (page is already the home). */
  hideFooterLink?: boolean;
};

export function AdminCurrentChallenges({
  limit = DEFAULT_LIST_CAP,
  hideFooterLink = false,
}: ListProps) {
  const currentQuery = useAdminChallenges({ status: 'current', page: 0, pageSize: Math.max(limit, 30) });
  const currentTotal = currentQuery.data?.total ?? 0;
  const useFallback = currentQuery.isSuccess && currentTotal === 0;
  const activeQuery = useAdminChallenges({ status: 'active', page: 0, pageSize: 20 }, useFallback);
  const pendingQuery = useAdminChallenges({ status: 'pending', page: 0, pageSize: 20 }, useFallback);
  const finalizingQuery = useAdminChallenges(
    { status: 'pending_completion', page: 0, pageSize: 10 },
    useFallback,
  );

  const challenges = useMemo(() => {
    const rows = currentTotal > 0
      ? (currentQuery.data?.rows ?? [])
      : [
        ...(activeQuery.data?.rows ?? []),
        ...(finalizingQuery.data?.rows ?? []),
        ...(pendingQuery.data?.rows ?? []),
      ];
    return [...rows].sort((a, b) => {
      const rank = (STATUS_RANK[a.status] ?? 9) - (STATUS_RANK[b.status] ?? 9);
      if (rank !== 0) return rank;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [
    currentTotal,
    currentQuery.data?.rows,
    activeQuery.data?.rows,
    finalizingQuery.data?.rows,
    pendingQuery.data?.rows,
  ]);

  const challengeTotal = currentTotal > 0
    ? currentTotal
    : (activeQuery.data?.total ?? 0)
      + (pendingQuery.data?.total ?? 0)
      + (finalizingQuery.data?.total ?? 0);

  const challengesLoading = currentQuery.isLoading
    || (useFallback && (activeQuery.isLoading || pendingQuery.isLoading));
  const challengeError = getOptionalQueryErrorMessage(currentQuery.error, 'Could not load challenges.')
    ?? getOptionalQueryErrorMessage(activeQuery.error, 'Could not load challenges.');

  const shownChallenges = challenges.slice(0, limit);
  const [sortKey, setSortKey] = useState<'title' | 'status' | 'goal' | 'players' | 'created'>('created');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const tableRows = useMemo(() => {
    const copy = [...shownChallenges];
    const dir = sortDir === 'asc' ? 1 : -1;
    copy.sort((a, b) => {
      const cmp = (() => {
        if (sortKey === 'title') return formatAdminChallengeTitle(a).localeCompare(formatAdminChallengeTitle(b));
        if (sortKey === 'status') return a.status.localeCompare(b.status);
        if (sortKey === 'goal') return a.goal_minutes - b.goal_minutes;
        if (sortKey === 'players') return a.participant_count - b.participant_count;
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      })();
      return cmp * dir;
    });
    return copy;
  }, [shownChallenges, sortKey, sortDir]);

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortDir((dir) => (dir === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir(key === 'title' || key === 'status' ? 'asc' : 'desc');
    }
  };

  const sortMark = (key: typeof sortKey) => (sortKey === key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '');

  return (
    <AdminSubsection
      title="Current challenges"
      meta={challengeTotal > 0 ? String(challengeTotal) : undefined}
      footer={!hideFooterLink && challengeTotal > shownChallenges.length ? (
        <Link to="/admin/challenges">All challenges</Link>
      ) : undefined}
    >
      {challengesLoading && shownChallenges.length === 0 ? (
        <p className="admin-muted">Loading challenges…</p>
      ) : null}
      {challengeError ? <p className="admin-error">{challengeError}</p> : null}
      {!challengesLoading && !challengeError && shownChallenges.length === 0 ? (
        <p className="admin-muted">No active or pending challenges.</p>
      ) : null}
      {tableRows.length > 0 ? (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th><button type="button" className="admin-sort-btn" onClick={() => toggleSort('title')}>Challenge{sortMark('title')}</button></th>
                <th><button type="button" className="admin-sort-btn" onClick={() => toggleSort('status')}>Status{sortMark('status')}</button></th>
                <th><button type="button" className="admin-sort-btn" onClick={() => toggleSort('goal')}>Goal{sortMark('goal')}</button></th>
                <th><button type="button" className="admin-sort-btn" onClick={() => toggleSort('players')}>Players{sortMark('players')}</button></th>
                <th>People</th>
                <th><button type="button" className="admin-sort-btn" onClick={() => toggleSort('created')}>Created{sortMark('created')}</button></th>
                <th />
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <Link to={`/challenge/${row.id}`} className="admin-inline-link">
                      {formatAdminChallengeTitle(row)}
                    </Link>
                  </td>
                  <td>{formatChallengeStatus(row.status)}</td>
                  <td>{Math.round(row.goal_minutes / 60)}h</td>
                  <td>{row.participant_count}</td>
                  <td className="admin-td-wrap"><ChallengePeople row={row} /></td>
                  <td>{new Date(row.created_at).toLocaleDateString()}</td>
                  <td>
                    <Link to={`/challenge/${row.id}`} className="admin-inline-link">Open</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </AdminSubsection>
  );
}

export function AdminCurrentClubs({
  limit = DEFAULT_LIST_CAP,
  hideFooterLink = false,
}: ListProps) {
  const clubsQuery = useAdminClubs({ page: 0, pageSize: Math.max(limit, 100) });

  const clubs = useMemo(() => {
    const rows = clubsQuery.data?.rows ?? [];
    return [...rows].sort((a, b) => {
      const active = (b.active_members_7d ?? 0) - (a.active_members_7d ?? 0);
      if (active !== 0) return active;
      if (b.member_count !== a.member_count) return b.member_count - a.member_count;
      return a.name.localeCompare(b.name);
    });
  }, [clubsQuery.data?.rows]);

  const clubsTotal = clubsQuery.data?.total ?? clubs.length;
  const clubError = getOptionalQueryErrorMessage(clubsQuery.error, 'Could not load clubs.');
  const shownClubs = clubs.slice(0, limit);

  return (
    <AdminSubsection
      title="Current clubs"
      meta={clubsTotal > 0 ? String(clubsTotal) : undefined}
      footer={!hideFooterLink && clubsTotal > shownClubs.length ? (
        <Link to="/admin/community">All clubs</Link>
      ) : undefined}
    >
      {clubsQuery.isLoading && shownClubs.length === 0 ? (
        <p className="admin-muted">Loading clubs…</p>
      ) : null}
      {clubError ? <p className="admin-error">{clubError}</p> : null}
      {!clubsQuery.isLoading && !clubError && shownClubs.length === 0 ? (
        <p className="admin-muted">No clubs yet.</p>
      ) : null}
      {shownClubs.length > 0 ? (
        <ul className="admin-user-rel-list admin-live-list">
          {shownClubs.map((row) => (
            <li key={row.id}>
              <Link to={`/admin/community?club=${row.id}`} className="admin-user-rel-row">
                <span className="admin-user-rel-main">
                  <span className="admin-user-rel-title">
                    {row.emoji ? `${row.emoji} ` : ''}{row.name}
                  </span>
                  <span className="admin-user-rel-meta">{clubMeta(row)}</span>
                </span>
                <span className="admin-user-rel-go">Members</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </AdminSubsection>
  );
}

function ChallengePeople({ row }: { row: AdminChallengeRow }) {
  const people = row.participants ?? [];
  if (people.length === 0) {
    return (
      <span className="admin-user-rel-people">
        <Link to={`/profile/${row.creator_id}`} className="admin-inline-link">@{row.creator_username}</Link>
      </span>
    );
  }
  const extra = Math.max(0, row.participant_count - people.length);
  return (
    <span className="admin-user-rel-people">
      {people.map((person, index) => (
        <span key={person.id}>
          {index > 0 ? ', ' : null}
          <Link to={`/profile/${person.id}`} className="admin-inline-link">@{person.username}</Link>
        </span>
      ))}
      {extra > 0 ? ` +${extra}` : null}
    </span>
  );
}
