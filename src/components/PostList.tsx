import { useMemo } from 'react';
import SleepPostCard from './SleepPostCard';
import FeedPostsSkeleton from './FeedPostsSkeleton';
import type { PostSocialPatch } from './PostSocial';
import type { SleepPost } from '../lib/types';
import { buildLatestPostIdsByUser, isLatestSleepPost } from '../lib/latestSleepPost';
import { useLocalMidnightInvalidation } from '../hooks/useLocalMidnightInvalidation';

type PostListProps = {
  posts: SleepPost[];
  showAuthor?: boolean;
  emptyMessage?: string;
  loading?: boolean;
  loadingMore?: boolean;
  error?: string | null;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onPatchPost?: (postId: string, patch: PostSocialPatch) => void;
};

export default function PostList({
  posts,
  showAuthor = true,
  emptyMessage = 'No posts yet.',
  loading = false,
  loadingMore = false,
  error = null,
  hasMore = false,
  onLoadMore,
  onPatchPost,
}: PostListProps) {
  const todayISO = useLocalMidnightInvalidation();
  const latestPostIds = useMemo(() => buildLatestPostIdsByUser(posts), [posts]);

  return (
    <>
      {loading && <FeedPostsSkeleton count={3} />}
      {error && <p className="admin-error">{error}</p>}

      {!loading && !error && posts.length === 0 && (
        <p className="app-muted">{emptyMessage}</p>
      )}

      <div className="post-list">
        {!loading && posts.map((post) => (
          <SleepPostCard
            key={post.id}
            post={post}
            showAuthor={showAuthor}
            isLatestPost={isLatestSleepPost(post, latestPostIds, todayISO)}
            onSocialPatch={onPatchPost}
          />
        ))}
      </div>

      {hasMore && onLoadMore && (
        <button
          className="admin-button admin-button-ghost app-load-more"
          type="button"
          onClick={onLoadMore}
          disabled={loadingMore}
        >
          {loadingMore ? 'Loading…' : 'Load more'}
        </button>
      )}
    </>
  );
}
