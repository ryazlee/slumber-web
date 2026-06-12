import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Avatar from '../../components/Avatar';
import PostList from '../../components/PostList';
import { useAuth } from '../../context/AuthContext';
import { usePaginatedPosts } from '../../hooks/usePaginatedPosts';
import { fetchUserPosts } from '../../lib/feed';
import { formatChallengeRecord, formatMins } from '../../lib/format';
import { formatRoleList } from '../../lib/userRoles';
import { fetchProfileSummary } from '../../lib/profile';
import type { WebProfile } from '../../lib/types';

export default function Profile() {
  const { userId: routeUserId } = useParams<{ userId?: string }>();
  const { user: authUser } = useAuth();
  const profileUserId = routeUserId ?? authUser?.id ?? null;
  const isOwnProfile = Boolean(authUser?.id && profileUserId === authUser.id);

  const [profile, setProfile] = useState<WebProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  const fetchPage = useCallback(
    (cursor?: string) => {
      if (!profileUserId) return Promise.resolve([]);
      return fetchUserPosts(profileUserId, cursor);
    },
    [profileUserId],
  );

  const {
    posts,
    loading: postsLoading,
    loadingMore,
    error: postsError,
    hasMore,
    loadMore,
    patchPost,
  } = usePaginatedPosts(fetchPage, profileUserId ?? undefined);

  useEffect(() => {
    if (!profileUserId) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }

    let cancelled = false;
    setProfileLoading(true);
    setProfileError(null);
    fetchProfileSummary(profileUserId)
      .then((data) => {
        if (!cancelled) setProfile(data);
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setProfileError(e instanceof Error ? e.message : 'Could not load profile.');
        }
      })
      .finally(() => {
        if (!cancelled) setProfileLoading(false);
      });

    return () => { cancelled = true; };
  }, [profileUserId]);

  const pageTitle = useMemo(() => {
    if (profile) return `@${profile.username}`;
    if (isOwnProfile) return 'Your profile';
    return 'Profile';
  }, [profile, isOwnProfile]);

  if (!profileUserId) {
    return (
      <div className="app-page">
        <p className="app-muted">Sign in to view profiles.</p>
      </div>
    );
  }

  if (profileLoading) {
    return (
      <div className="app-page">
        <p className="app-muted">Loading profile…</p>
      </div>
    );
  }

  if (profileError || !profile) {
    return (
      <div className="app-page">
        <p className="admin-error">{profileError ?? 'Profile not found.'}</p>
        <Link to="/feed" className="app-back-link">← Back to feed</Link>
      </div>
    );
  }

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
            {profile.friendsCount} friends · {profile.postsCount} posts
          </p>
        </div>
      </header>

      <div className="profile-stats">
        <div className="profile-stat">
          <span className="profile-stat-value">{profile.streak}</span>
          <span className="profile-stat-label">Streak</span>
        </div>
        <div className="profile-stat">
          <span className="profile-stat-value">{formatMins(profile.avgAsleepMinutes)}</span>
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
          emptyMessage="No posts yet."
        />
      </section>
    </div>
  );
}
