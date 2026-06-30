import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import ProfileHeroSkeleton from '../../components/ProfileHeroSkeleton';
import Avatar from '../../components/Avatar';
import FeedPostsSkeleton from '../../components/FeedPostsSkeleton';
import PostList from '../../components/PostList';
import { useAuth } from '../../context/AuthContext';
import { useProfile } from '../../hooks/useProfile';
import { useUserPosts } from '../../hooks/useUserPosts';
import { formatChallengeRecord, formatMins } from '../../lib/format';
import { formatRoleList } from '../../lib/userRoles';

export default function Profile() {
  const { userId: routeUserId } = useParams<{ userId?: string }>();
  const { user: authUser } = useAuth();
  const profileUserId = routeUserId ?? authUser?.id ?? null;
  const isOwnProfile = Boolean(authUser?.id && profileUserId === authUser.id);

  const profileQuery = useProfile(profileUserId);
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
        <ProfileHeroSkeleton />
        <FeedPostsSkeleton count={2} />
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
          size="lg"
        />
        <div>
          <h1>{pageTitle}</h1>
          {profile.userRoles?.length ? (
            <p className="profile-role-label">{formatRoleList(profile.userRoles)}</p>
          ) : null}
          <p className="app-muted">
            {profile.friendsCount} friends
            {canViewPosts ? ` · ${profile.postsCount} posts` : ''}
          </p>
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
