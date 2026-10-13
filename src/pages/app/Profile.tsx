import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import ProfileHeroSkeleton from '../../components/ProfileHeroSkeleton';
import SkeletonLoadingShell from '../../components/SkeletonLoadingShell';
import Avatar from '../../components/Avatar';
import FeedPostsSkeleton from '../../components/FeedPostsSkeleton';
import PostList from '../../components/PostList';
import { useAuth } from '../../context/AuthContext';
import { useProfile } from '../../hooks/useProfile';
import {
  useAcceptFriendRequest,
  useCancelFriendRequest,
  useDeclineFriendRequest,
  useSendFriendRequest,
} from '../../hooks/useSocial';
import { useUserPosts } from '../../hooks/useUserPosts';
import ProfileSleepCompatibility from '../../components/stats/ProfileSleepCompatibility';
import { formatChallengeRecord, formatMins } from '../../lib/format';
import { formatRoleList } from '../../lib/userRoles';

export default function Profile() {
  const { userId: routeUserId } = useParams<{ userId?: string }>();
  const { user: authUser } = useAuth();
  const profileUserId = routeUserId ?? authUser?.id ?? null;
  const isOwnProfile = Boolean(authUser?.id && profileUserId === authUser.id);

  const profileQuery = useProfile(profileUserId);
  const sendFriendMutation = useSendFriendRequest();
  const cancelFriendMutation = useCancelFriendRequest();
  const acceptFriendMutation = useAcceptFriendRequest();
  const declineFriendMutation = useDeclineFriendRequest();
  const friendActionBusy =
    sendFriendMutation.isPending
    || cancelFriendMutation.isPending
    || acceptFriendMutation.isPending
    || declineFriendMutation.isPending;
  const friendActionError =
    sendFriendMutation.error
    ?? cancelFriendMutation.error
    ?? acceptFriendMutation.error
    ?? declineFriendMutation.error;
  const friendActionErrorMessage = friendActionError instanceof Error
    ? friendActionError.message
    : friendActionError
      ? 'Could not update friend request.'
      : null;
  const canViewPosts = Boolean(
    profileQuery.data && (profileQuery.data.isOwnProfile || profileQuery.data.friendStatus === 'friends'),
  );
  const {
    posts,
    loading: postsLoading,
    loadingMore,
    error: postsError,
    hasMore,
    loadMore,
    patchPost,
  } = useUserPosts(profileUserId, { enabled: canViewPosts });

  const pageTitle = useMemo(() => {
    if (profileQuery.data) return `@${profileQuery.data.username}`;
    if (isOwnProfile) return 'Your profile';
    return 'Profile';
  }, [profileQuery.data, isOwnProfile]);

  if (!profileUserId) {
    return (
      <div className="app-page">
        <p className="app-muted">Sign in to view profiles.</p>
      </div>
    );
  }

  if (profileQuery.isLoading) {
    return (
      <div className="app-page">
        <SkeletonLoadingShell aria-label="Loading profile">
          <ProfileHeroSkeleton />
          <FeedPostsSkeleton count={2} withSpinner={false} />
        </SkeletonLoadingShell>
      </div>
    );
  }

  const profileError = profileQuery.error instanceof Error
    ? profileQuery.error.message
    : profileQuery.error
      ? 'Could not load profile.'
      : null;

  if (profileError || !profileQuery.data) {
    return (
      <div className="app-page">
        <p className="admin-error">{profileError ?? 'Profile not found.'}</p>
        <Link to="/feed" className="app-back-link">← Back to feed</Link>
      </div>
    );
  }

  const profile = profileQuery.data;

  return (
    <div className="app-page">
      {!isOwnProfile && (
        <Link to="/feed" className="app-back-link">← Feed</Link>
      )}

      <header className="profile-hero">
        <Avatar
          userId={profile.id}
          username={profile.username}
          avatarUrl={profile.avatarUrl}
          userRoles={profile.userRoles}
          isPremium={profile.isPremium}
          size="lg"
        />
        <div>
          <h1>{pageTitle}</h1>
          {profile.userRoles?.length ? (
            <p className="profile-role-label">{formatRoleList(profile.userRoles)}</p>
          ) : null}
          <p className="app-muted">
            {profile.friendsCount} friends
            {canViewPosts ? ` · ${profile.postsCount} nights` : ''}
          </p>
          {!isOwnProfile && profile.friendStatus === 'friends' ? (
            <ProfileSleepCompatibility friendId={profile.id} friendName={profile.username} />
          ) : null}
          {!isOwnProfile ? (
            <div className="profile-actions">
              {profile.friendStatus === 'none' ? (
                <button
                  type="button"
                  className="social-btn"
                  disabled={friendActionBusy}
                  onClick={() => sendFriendMutation.mutate(profile.id)}
                >
                  {sendFriendMutation.isPending ? 'Sending…' : 'Add friend'}
                </button>
              ) : null}
              {profile.friendStatus === 'request_sent' ? (
                <button
                  type="button"
                  className="social-btn social-btn--ghost"
                  disabled={friendActionBusy}
                  title="Cancel friend request"
                  onClick={() => cancelFriendMutation.mutate(profile.id)}
                >
                  {cancelFriendMutation.isPending ? 'Canceling…' : 'Pending'}
                </button>
              ) : null}
              {profile.friendStatus === 'request_received' ? (
                <>
                  <button
                    type="button"
                    className="social-btn social-btn--ghost"
                    disabled={friendActionBusy}
                    onClick={() => declineFriendMutation.mutate(profile.id)}
                  >
                    Decline
                  </button>
                  <button
                    type="button"
                    className="social-btn"
                    disabled={friendActionBusy}
                    onClick={() => acceptFriendMutation.mutate(profile.id)}
                  >
                    {acceptFriendMutation.isPending ? 'Accepting…' : 'Accept'}
                  </button>
                </>
              ) : null}
              {profile.friendStatus === 'friends' ? (
                <>
                  <button type="button" className="social-btn social-btn--ghost" disabled>
                    Friends
                  </button>
                  <Link
                    to={`/stats/compare?with=${profile.id}`}
                    className="social-btn social-btn--ghost"
                  >
                    Compare
                  </Link>
                </>
              ) : (
                <button
                  type="button"
                  className="social-btn social-btn--ghost"
                  disabled
                  title="Add as a friend to compare sleep stats"
                >
                  Compare
                </button>
              )}
            </div>
          ) : null}
          {friendActionErrorMessage ? (
            <p className="admin-error" style={{ marginTop: 8 }}>{friendActionErrorMessage}</p>
          ) : null}
        </div>
      </header>

      <div className="profile-stats">
        <div className="profile-stat">
          <span className="profile-stat-value">{profile.streak}</span>
          <span className="profile-stat-label">Streak</span>
        </div>
        <div className="profile-stat">
          <span className="profile-stat-value">
            {canViewPosts ? formatMins(profile.avgAsleepMinutes) : '—'}
          </span>
          <span className="profile-stat-label">Avg sleep</span>
        </div>
        <div className="profile-stat">
          <span className="profile-stat-value">
            {formatChallengeRecord(profile.challengeRecord.wins, profile.challengeRecord.losses, profile.challengeRecord.ties)}
          </span>
          <span className="profile-stat-label">Challenges</span>
        </div>
      </div>

      <section className="app-section">
        <h2>Posts</h2>
        <PostList
          posts={posts}
          showAuthor={false}
          loading={postsLoading}
          loadingMore={loadingMore}
          error={postsError}
          hasMore={hasMore}
          onLoadMore={loadMore}
          onPatchPost={patchPost}
          emptyMessage={
            canViewPosts
              ? 'No posts yet.'
              : 'Sleep posts are only visible to friends.'
          }
        />
      </section>
    </div>
  );
}
