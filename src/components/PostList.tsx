import SleepPostCard from './SleepPostCard';
import type { PostSocialPatch } from './PostSocial';
import type { SleepPost } from '../lib/types';

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
  return (
    <>
      {loading && <p className="app-muted">Loading posts…</p>}
      {error && <p className="admin-error">{error}</p>}

      {!loading && !error && posts.length === 0 && (
        <p className="app-muted">{emptyMessage}</p>
      )}

      <div className="post-list">
        {posts.map((post) => (
          <SleepPostCard
            key={post.id}
            post={post}
            showAuthor={showAuthor}
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
