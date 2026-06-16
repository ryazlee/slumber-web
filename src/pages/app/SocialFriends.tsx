import { Link } from 'react-router-dom';
import Avatar from '../../components/Avatar';
import {
  useAcceptFriendRequest,
  useDeclineFriendRequest,
  useFriendRequests,
  useFriends,
} from '../../hooks/useSocial';
import type { WebFriend, WebFriendRequest } from '../../lib/types';

function formatSince(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
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

export default function SocialFriends() {
  const friendsQuery = useFriends();
  const requestsQuery = useFriendRequests();
  const acceptMutation = useAcceptFriendRequest();
  const declineMutation = useDeclineFriendRequest();

  const friends = friendsQuery.data ?? [];
  const requests = requestsQuery.data ?? [];

  const loading = friendsQuery.isLoading || requestsQuery.isLoading;
  const error = friendsQuery.error ?? requestsQuery.error;
  const errorMessage = error instanceof Error
    ? error.message
    : error
      ? 'Could not load friends.'
      : null;

  const requestBusyId = acceptMutation.isPending
    ? acceptMutation.variables
    : declineMutation.isPending
      ? declineMutation.variables
      : null;

  if (loading) return <p className="app-muted">Loading…</p>;
  if (errorMessage) return <p className="admin-error">{errorMessage}</p>;

  return (
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
  );
}
