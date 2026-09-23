import type { PostgrestError } from '@supabase/supabase-js';
import { Link } from 'react-router-dom';
import type { AdminClubRosterMember } from '../../lib/admin';
import { isMissingAdminRpc } from '../../lib/adminRpc';
import { pluralCount } from '../../lib/format';
import { getOptionalQueryErrorMessage } from '../../lib/queryError';
import { useAdminClubRoster } from '../../hooks/useAdmin';

type Props = {
  clubId: string;
  onClose: () => void;
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

function memberMeta(member: AdminClubRosterMember): string {
  const parts = [titleCase(member.role)];
  if (member.invite_status !== 'accepted') {
    parts.push(titleCase(member.invite_status));
  } else if (member.posts_7d > 0) {
    parts.push(`${member.posts_7d} posts in 7d`);
  } else {
    parts.push('No posts in 7d');
  }
  const when = formatDay(member.joined_at);
  if (when) parts.push(when);
  return parts.join(' · ');
}

export default function AdminClubRoster({ clubId, onClose }: Props) {
  const query = useAdminClubRoster(clubId);
  const roster = query.data ?? null;
  const missing = Boolean(
    query.error
    && typeof query.error === 'object'
    && isMissingAdminRpc(query.error as PostgrestError, 'admin_get_club_roster'),
  );
  const error = missing
    ? null
    : getOptionalQueryErrorMessage(query.error, 'Could not load this club.');

  return (
    <section className="admin-club-roster" aria-label="Club members">
      <div className="admin-club-roster-head">
        <h2 className="admin-subsection-title">
          {roster ? `${roster.emoji ? `${roster.emoji} ` : ''}${roster.name}` : 'Club'}
        </h2>
        <button type="button" className="admin-button admin-button-sm admin-button-ghost" onClick={onClose}>
          Close
        </button>
      </div>

      {query.isLoading && !roster ? <p className="admin-muted">Loading members…</p> : null}
      {missing ? (
        <p className="admin-muted">Apply migration 166 to open a club’s members.</p>
      ) : null}
      {error ? <p className="admin-error">{error}</p> : null}

      {roster ? (
        <>
          <p className="admin-muted admin-club-roster-meta">
            {pluralCount(roster.member_count, 'member')}
            {' · '}
            {pluralCount(roster.active_members_7d, 'posted this week')}
            {roster.pending_invites > 0 ? ` · ${pluralCount(roster.pending_invites, 'pending invite')}` : ''}
            {' · '}
            @{roster.owner_username}
          </p>
          {roster.description ? <p className="admin-club-roster-description">{roster.description}</p> : null}
          {roster.members.length === 0 ? (
            <p className="admin-muted">No members.</p>
          ) : (
            <ul className="admin-user-rel-list admin-live-list">
              {roster.members.map((member) => (
                <li key={member.id}>
                  <Link to={`/profile/${member.id}`} className="admin-user-rel-row">
                    <span className="admin-user-rel-main">
                      <span className="admin-user-rel-title">@{member.username}</span>
                      <span className="admin-user-rel-meta">{memberMeta(member)}</span>
                    </span>
                    <span className="admin-user-rel-go">Profile</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : null}
    </section>
  );
}
