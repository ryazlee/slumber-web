import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Avatar from '../../components/Avatar';
import UserListRowsSkeleton from '../../components/UserListRowsSkeleton';
import { useClubMembers, useClubs, useRespondToClubInvite } from '../../hooks/useSocial';
import type { WebClub, WebClubMember } from '../../lib/types';

function roleLabel(role: string): string {
  if (role === 'owner') return 'Owner';
  if (role === 'admin') return 'Admin';
  return 'Member';
}

function ClubRow({
  club,
  selected,
  onSelect,
}: {
  club: WebClub;
  selected: boolean;
  onSelect: () => void;
}) {
  const isPending = club.myInviteStatus === 'pending';
  return (
    <button
      type="button"
      className={`social-row social-row--club${selected ? ' social-row--selected' : ''}`}
      onClick={onSelect}
      aria-pressed={selected}
    >
      <span className="social-club-emoji" aria-hidden>{club.emoji ?? '🏠'}</span>
      <span className="social-row-main">
        <span className="social-row-title-row">
          <span className="social-row-title">{club.name}</span>
          {isPending ? <span className="social-pill">Invite</span> : null}
        </span>
        <span className="social-row-meta">
          {isPending
            ? 'Tap to accept or decline'
            : `${club.memberCount} member${club.memberCount === 1 ? '' : 's'} · ${roleLabel(club.myRole)}`}
        </span>
      </span>
    </button>
  );
}

function ClubMemberRow({ member }: { member: WebClubMember }) {
  return (
    <Link to={`/profile/${member.userId}`} className="social-row social-row--link social-row--compact">
      <Avatar userId={member.userId} username={member.username} avatarUrl={member.avatarUrl} />
      <span className="social-row-main">
        <span className="social-row-title">@{member.username}</span>
        <span className="social-row-meta">{roleLabel(member.role)}</span>
      </span>
    </Link>
  );
}

function ClubDetail({
  club,
  onClose,
}: {
  club: WebClub;
  onClose: () => void;
}) {
  const isPending = club.myInviteStatus === 'pending';
  const isAccepted = club.myInviteStatus === 'accepted';
  const membersQuery = useClubMembers(club.id, isAccepted);
  const respondMutation = useRespondToClubInvite();
  const busy = respondMutation.isPending;

  const handleRespond = async (accept: boolean) => {
    try {
      await respondMutation.mutateAsync({ clubId: club.id, accept });
      if (!accept) onClose();
    } catch {
      // mutation error surfaces via parent refresh
    }
  };

  return (
    <section className="social-club-detail">
      <div className="social-club-detail-header">
        <span className="social-club-detail-emoji" aria-hidden>{club.emoji ?? '🏠'}</span>
        <div className="social-club-detail-titles">
          <h2>{club.name}</h2>
          <p className="app-muted">
            {isPending ? 'Club invite' : `${club.memberCount} members · ${roleLabel(club.myRole)}`}
          </p>
        </div>
        <button type="button" className="social-btn social-btn--ghost" onClick={onClose}>
          Close
        </button>
      </div>

      {club.description ? (
        <p className="social-club-description">{club.description}</p>
      ) : null}

      {isPending ? (
        <div className="social-invite-banner">
          <p>You&apos;ve been invited to join this sleep club.</p>
          <div className="social-row-actions">
            <button
              type="button"
              className="social-btn social-btn--ghost"
              disabled={busy}
              onClick={() => handleRespond(false)}
            >
              Decline
            </button>
            <button
              type="button"
              className="social-btn"
              disabled={busy}
              onClick={() => handleRespond(true)}
            >
              {busy ? 'Saving…' : 'Accept'}
            </button>
          </div>
        </div>
      ) : null}

      {isAccepted ? (
        <div className="social-club-members">
          <h3>Members</h3>
          {membersQuery.isLoading ? (
            <UserListRowsSkeleton rows={4} />
          ) : membersQuery.error ? (
            <p className="admin-error">Could not load members.</p>
          ) : membersQuery.data?.length ? (
            <div className="social-list">
              {membersQuery.data.map((member) => (
                <ClubMemberRow key={member.userId} member={member} />
              ))}
            </div>
          ) : (
            <p className="app-muted">No members yet.</p>
          )}
        </div>
      ) : null}

      <p className="social-footnote app-muted">
        Create clubs, invite people, and browse as a club (feed, races, compare) in the Slumber iOS app.
      </p>
    </section>
  );
}

export default function SocialClubs() {
  const [selectedClubId, setSelectedClubId] = useState<string | null>(null);
  const clubsQuery = useClubs();
  const clubs = clubsQuery.data ?? [];

  const selectedClub = useMemo(
    () => clubs.find((club) => club.id === selectedClubId) ?? null,
    [clubs, selectedClubId],
  );

  const loading = clubsQuery.isLoading;
  const error = clubsQuery.error;
  const errorMessage = error instanceof Error
    ? error.message
    : error
      ? 'Could not load clubs.'
      : null;

  if (loading) return <UserListRowsSkeleton rows={4} />;
  if (errorMessage) return <p className="admin-error">{errorMessage}</p>;

  return (
    <>
      {clubs.length === 0 ? (
        <p className="app-muted social-empty">
          No clubs yet. Create a club for your household or crew in the iOS app.
        </p>
      ) : (
        <div className="social-list social-list--clubs">
          {clubs.map((club) => (
            <ClubRow
              key={club.id}
              club={club}
              selected={selectedClubId === club.id}
              onSelect={() => setSelectedClubId((current) => (current === club.id ? null : club.id))}
            />
          ))}
        </div>
      )}

      {selectedClub ? (
        <ClubDetail
          club={selectedClub}
          onClose={() => setSelectedClubId(null)}
        />
      ) : null}
    </>
  );
}
