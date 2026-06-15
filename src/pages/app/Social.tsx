import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Avatar from '../../components/Avatar';
import {
  useAcceptFriendRequest,
  useClubMembers,
  useClubs,
  useDeclineFriendRequest,
  useFriendRequests,
  useFriends,
  useRespondToClubInvite,
} from '../../hooks/useSocial';
import type { WebClub, WebClubMember, WebFriend, WebFriendRequest } from '../../lib/types';

type Tab = 'friends' | 'clubs';

function formatSince(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function roleLabel(role: string): string {
  if (role === 'owner') return 'Owner';
  if (role === 'admin') return 'Admin';
  return 'Member';
}

function FriendRow({ friend }: { friend: WebFriend }) {
  return (
    <Link to={`/profile/${friend.id}`} className="social-row social-row--link">
      <Avatar
        userId={friend.id}
        username={friend.username}
        avatarUrl={friend.avatarUrl}
        userRoles={friend.userRoles}
      />
      <span className="social-row-main">
        <span className="social-row-title">@{friend.username}</span>
        {friend.friendsSince ? (
          <span className="social-row-meta">Friends since {formatSince(friend.friendsSince)}</span>
        ) : null}
      </span>
    </Link>
  );
}

function FriendRequestRow({
  request,
  busy,
  onAccept,
  onDecline,
}: {
  request: WebFriendRequest;
  busy: boolean;
  onAccept: () => void;
  onDecline: () => void;
}) {
  return (
    <div className="social-row social-row--request">
      <Link to={`/profile/${request.requesterId}`} className="social-row-link">
        <Avatar
          userId={request.requesterId}
          username={request.username}
          avatarUrl={request.avatarUrl}
          userRoles={request.userRoles}
        />
        <span className="social-row-main">
          <span className="social-row-title">@{request.username}</span>
          <span className="social-row-meta">Wants to be friends</span>
        </span>
      </Link>
      <div className="social-row-actions">
        <button
          type="button"
          className="social-btn social-btn--ghost"
          disabled={busy}
          onClick={onDecline}
        >
          Decline
        </button>
        <button
          type="button"
          className="social-btn"
          disabled={busy}
          onClick={onAccept}
        >
          Accept
        </button>
      </div>
    </div>
  );
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
            <p className="app-muted">Loading members…</p>
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
        Create clubs, invite people, and filter your feed in the Slumber iOS app.
      </p>
    </section>
  );
}

export default function Social() {
  const [tab, setTab] = useState<Tab>('friends');
  const [selectedClubId, setSelectedClubId] = useState<string | null>(null);

  const friendsQuery = useFriends();
  const requestsQuery = useFriendRequests();
  const clubsQuery = useClubs();
  const acceptMutation = useAcceptFriendRequest();
  const declineMutation = useDeclineFriendRequest();

  const friends = friendsQuery.data ?? [];
  const requests = requestsQuery.data ?? [];
  const clubs = clubsQuery.data ?? [];

  const selectedClub = useMemo(
    () => clubs.find((club) => club.id === selectedClubId) ?? null,
    [clubs, selectedClubId],
  );

  const loading = tab === 'friends'
    ? friendsQuery.isLoading || requestsQuery.isLoading
    : clubsQuery.isLoading;

  const error = tab === 'friends'
    ? friendsQuery.error ?? requestsQuery.error
    : clubsQuery.error;

  const errorMessage = error instanceof Error
    ? error.message
    : error
      ? 'Could not load social data.'
      : null;

  const requestBusyId = acceptMutation.isPending
    ? acceptMutation.variables
    : declineMutation.isPending
      ? declineMutation.variables
      : null;

  return (
    <div className="app-page social-page">
      <header className="app-page-header">
        <h1>Social</h1>
        <p className="app-muted">Your friends and sleep clubs.</p>
      </header>

      <div className="app-subtabs" role="tablist" aria-label="Social sections">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'friends'}
          className={`app-subtab${tab === 'friends' ? ' active' : ''}`}
          onClick={() => setTab('friends')}
        >
          Friends{friends.length > 0 ? ` (${friends.length})` : ''}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'clubs'}
          className={`app-subtab${tab === 'clubs' ? ' active' : ''}`}
          onClick={() => setTab('clubs')}
        >
          Clubs{clubs.length > 0 ? ` (${clubs.length})` : ''}
        </button>
      </div>

      {loading ? <p className="app-muted">Loading…</p> : null}
      {errorMessage ? <p className="admin-error">{errorMessage}</p> : null}

      {!loading && !errorMessage && tab === 'friends' ? (
        <>
          {requests.length > 0 ? (
            <section className="app-section social-section">
              <h2>Requests</h2>
              <div className="social-list">
                {requests.map((request) => (
                  <FriendRequestRow
                    key={request.requesterId}
                    request={request}
                    busy={requestBusyId === request.requesterId}
                    onAccept={() => acceptMutation.mutate(request.requesterId)}
                    onDecline={() => declineMutation.mutate(request.requesterId)}
                  />
                ))}
              </div>
            </section>
          ) : null}

          <section className="app-section social-section">
            <h2>Friends</h2>
            {friends.length === 0 ? (
              <p className="app-muted">No friends yet. Add people from the iOS app.</p>
            ) : (
              <div className="social-list">
                {friends.map((friend) => (
                  <FriendRow key={friend.id} friend={friend} />
                ))}
              </div>
            )}
          </section>
        </>
      ) : null}

      {!loading && !errorMessage && tab === 'clubs' ? (
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
      ) : null}
    </div>
  );
}
