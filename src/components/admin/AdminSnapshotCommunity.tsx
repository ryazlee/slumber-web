import { useMemo } from 'react';
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

function challengeMeta(row: AdminChallengeRow): string {
  const parts = [
    formatChallengeStatus(row.status),
    `${Math.round(row.goal_minutes / 60)}h`,
    pluralCount(row.participant_count, 'player'),
  ];
  if (row.club_name && row.title?.trim()) {
    parts.push(`${row.club_emoji ? `${row.club_emoji} ` : ''}${row.club_name}`);
  }
  return parts.join(' · ');
}

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
      {shownChallenges.length > 0 ? (
        <ul className="admin-user-rel-list admin-live-list">
          {shownChallenges.map((row) => (
            <li key={row.id}>
              <div className="admin-user-rel-row">
                <div className="admin-user-rel-main">
                  <Link to={`/challenge/${row.id}`} className="admin-user-rel-title admin-inline-link">
                    {formatAdminChallengeTitle(row)}
                  </Link>
                  <span className="admin-user-rel-meta">{challengeMeta(row)}</span>
                  <ChallengePeople row={row} />
                </div>
                <Link to={`/challenge/${row.id}`} className="admin-user-rel-go">Open</Link>
              </div>
            </li>
          ))}
        </ul>
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
