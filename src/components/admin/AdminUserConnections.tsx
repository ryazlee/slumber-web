import type { PostgrestError } from '@supabase/supabase-js';
import type {
  AdminConnectionUser,
  AdminUserChallengeRow,
  AdminUserClubRow,
  AdminUserConnections as Connections,
  AdminPendingFriendRow,
} from '../../lib/admin';
import { isMissingAdminRpc } from '../../lib/adminRpc';
import { formatChallengeStatus, goalHours, pluralCount } from '../../lib/format';
import { getOptionalQueryErrorMessage } from '../../lib/queryError';
import { useAdminUserConnections } from '../../hooks/useAdmin';
import AdminSubsection from './AdminSubsection';

type OpenUser = AdminConnectionUser;

type Props = {
  userId: string;
  onOpenUser: (user: OpenUser) => void;
};

function formatDay(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, { dateStyle: 'medium' });
}

function titleCase(value: string): string {
  if (!value) return value;
  return value.replace(/_/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase());
}

function challengeTitle(row: AdminUserChallengeRow): string {
  if (row.title?.trim()) return row.title.trim();
  if (row.club_name) {
    return `${row.club_emoji ? `${row.club_emoji} ` : ''}${row.club_name}`;
  }
  return row.is_group ? 'Group race' : '1v1 race';
}

function challengeMeta(row: AdminUserChallengeRow): string {
  const parts = [
    formatChallengeStatus(row.status),
    goalHours(row.goal_minutes),
    row.role === 'creator' ? 'Host' : titleCase(row.role),
  ];
  if (row.invite_status !== 'accepted') parts.push(titleCase(row.invite_status));
  if (row.is_group) parts.push(pluralCount(row.participant_count, 'player'));
  const when = formatDay(row.created_at);
  if (when) parts.push(when);
  return parts.join(' · ');
}

function clubTitle(row: AdminUserClubRow): string {
  return `${row.emoji ? `${row.emoji} ` : ''}${row.name}`;
}

function clubMeta(row: AdminUserClubRow): string {
  const parts = [titleCase(row.role), pluralCount(row.member_count, 'member')];
  if (row.invite_status !== 'accepted') parts.push(titleCase(row.invite_status));
  const when = formatDay(row.joined_at ?? row.created_at);
  if (when) parts.push(when);
  return parts.join(' · ');
}

function truncatedMeta(total: number, shown: number): string | undefined {
  if (total <= shown) return undefined;
  return `Showing ${shown} of ${total}`;
}

function isRpcMissing(error: unknown): boolean {
  return Boolean(
    error
    && typeof error === 'object'
    && isMissingAdminRpc(error as PostgrestError, 'admin_get_user_connections'),
  );
}

export default function AdminUserConnections({ userId, onOpenUser }: Props) {
  const query = useAdminUserConnections(userId);
  const data = query.data ?? null;
  const missing = isRpcMissing(query.error);
  const error = missing
    ? null
    : getOptionalQueryErrorMessage(query.error, 'Could not load friends, clubs, or challenges.');

  if (query.isLoading && !data) {
    return <p className="admin-muted">Loading friends, clubs, and challenges…</p>;
  }

  if (missing) {
    return (
      <p className="admin-muted">
        Apply migration 161 to see this user’s friends, clubs, and challenges.
      </p>
    );
  }

  if (error) return <p className="admin-error">{error}</p>;
  if (!data) return null;

  return (
    <div className="admin-user-rel-groups">
      <FriendsSection data={data} onOpenUser={onOpenUser} />
      <ClubsSection data={data} />
      <ChallengesSection data={data} onOpenUser={onOpenUser} />
    </div>
  );
}

function FriendsSection({
  data,
  onOpenUser,
}: {
  data: Connections;
  onOpenUser: (user: OpenUser) => void;
}) {
  const friends = data.friends.rows;
  const pending = data.pending_friends.rows;
  const total = data.friends.total;
  const pendingTotal = data.pending_friends.total;

  return (
    <AdminSubsection
      title="Friends"
      meta={
        pendingTotal > 0
          ? `${pluralCount(total, 'friend')} · ${pluralCount(pendingTotal, 'pending request')}`
          : pluralCount(total, 'friend')
      }
      footer={truncatedMeta(total, friends.length)}
    >
      {friends.length === 0 && pending.length === 0 ? (
        <p className="admin-muted">No friends.</p>
      ) : friends.length > 0 ? (
        <ul className="admin-user-rel-list">
          {friends.map((row) => (
            <li key={row.id}>
              <UserRelButton user={row} meta={formatDay(row.since)} onOpenUser={onOpenUser} />
            </li>
          ))}
        </ul>
      ) : null}
      {pending.length > 0 ? (
        <div className="admin-user-rel-pending">
          <h3 className="admin-user-rel-pending-title">Pending requests</h3>
          <ul className="admin-user-rel-list">
            {pending.map((row) => (
              <li key={`${row.direction}-${row.id}`}>
                <UserRelButton
                  user={row}
                  meta={`${pendingDirection(row)} · ${formatDay(row.created_at)}`}
                  onOpenUser={onOpenUser}
                />
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </AdminSubsection>
  );
}

function pendingDirection(row: AdminPendingFriendRow): string {
  return row.direction === 'incoming' ? 'Incoming' : 'Outgoing';
}

function ClubsSection({ data }: { data: Connections }) {
  const clubs = data.clubs.rows;
  return (
    <AdminSubsection
      title="Clubs"
      meta={pluralCount(data.clubs.total, 'club')}
      footer={truncatedMeta(data.clubs.total, clubs.length)}
    >
      {clubs.length === 0 ? (
        <p className="admin-muted">No clubs.</p>
      ) : (
        <ul className="admin-user-rel-list">
          {clubs.map((row) => (
            <li key={row.id}>
              <div className="admin-user-rel-row">
                <div className="admin-user-rel-main">
                  <span className="admin-user-rel-title">{clubTitle(row)}</span>
                  <span className="admin-user-rel-meta">{clubMeta(row)}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </AdminSubsection>
  );
}

function ChallengesSection({
  data,
  onOpenUser,
}: {
  data: Connections;
  onOpenUser: (user: OpenUser) => void;
}) {
  const challenges = data.challenges.rows;
  return (
    <AdminSubsection
      title="Challenges"
      meta={pluralCount(data.challenges.total, 'challenge')}
      footer={truncatedMeta(data.challenges.total, challenges.length)}
    >
      {challenges.length === 0 ? (
        <p className="admin-muted">No challenges.</p>
      ) : (
        <ul className="admin-user-rel-list">
          {challenges.map((row) => (
            <li key={row.id}>
              <div className="admin-user-rel-row">
                <div className="admin-user-rel-main">
                  <span className="admin-user-rel-title">{challengeTitle(row)}</span>
                  <span className="admin-user-rel-meta">{challengeMeta(row)}</span>
                  {row.others.length > 0 ? (
                    <span className="admin-user-rel-people">
                      {row.others.map((other, index) => (
                        <span key={other.id}>
                          {index > 0 ? ', ' : null}
                          <button
                            type="button"
                            className="admin-user-rel-user"
                            onClick={() => onOpenUser(other)}
                          >
                            @{other.username}
                          </button>
                        </span>
                      ))}
                    </span>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </AdminSubsection>
  );
}

function UserRelButton({
  user,
  meta,
  onOpenUser,
}: {
  user: OpenUser;
  meta?: string;
  onOpenUser: (user: OpenUser) => void;
}) {
  return (
    <button type="button" className="admin-user-rel-row admin-user-rel-row--button" onClick={() => onOpenUser(user)}>
      <span className="admin-user-rel-main">
        <span className="admin-user-rel-title">@{user.username}</span>
        {meta ? <span className="admin-user-rel-meta">{meta}</span> : null}
      </span>
      <span className="admin-user-rel-go">Open</span>
    </button>
  );
}
