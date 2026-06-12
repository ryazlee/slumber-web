import PostList from '../../components/PostList';
import { useFeed } from '../../hooks/useFeed';

export default function Feed() {
  const {
    posts,
    loading,
    loadingMore,
    error,
    hasMore,
    loadMore,
    patchPost,
  } = useFeed();

  return (
    <div className="app-page">
      <header className="app-page-header">
        <h1>Feed</h1>
      </header>

      <PostList
        posts={posts}
        loading={loading}
        loadingMore={loadingMore}
        error={error}
        hasMore={hasMore}
        onLoadMore={loadMore}
        onPatchPost={patchPost}
        emptyMessage="No posts yet. Log sleep in the iOS app to see it here."
      />
    </div>
  );
}
