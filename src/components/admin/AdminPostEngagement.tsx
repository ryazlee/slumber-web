import { Link } from 'react-router-dom';
import type { AdminPostEngagement as Engagement, AdminRawRow } from '../../lib/admin';
import { getOptionalQueryErrorMessage } from '../../lib/queryError';
import { useAdminPostEngagement } from '../../hooks/useAdmin';
import CollapsibleSection from '../CollapsibleSection';
import { AdminJsonBlock } from './AdminPostRawJson';
import { formatWhen } from './format';

type Props = {
  postId: string | null;
};

function rowString(row: AdminRawRow, key: string): string | null {
  const value = row[key];
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function usernameOf(userId: string | null, usernames: Record<string, string>): string {
  if (!userId) return 'unknown';
  return usernames[userId] || 'unknown';
}

function adminUserHref(username: string) {
  return `/admin/users?q=${encodeURIComponent(username)}`;
}

function UserLink({ username }: { username: string }) {
  if (username === 'unknown') return <span>@{username}</span>;
  return (
    <Link to={adminUserHref(username)} className="admin-report-link">
      @{username}
    </Link>
  );
}

function likesByComment(likes: AdminRawRow[]): Map<string, AdminRawRow[]> {
  const map = new Map<string, AdminRawRow[]>();
  for (const like of likes) {
    const commentId = rowString(like, 'comment_id');
    if (!commentId) continue;
    const list = map.get(commentId) ?? [];
    list.push(like);
    map.set(commentId, list);
  }
  return map;
}

export default function AdminPostEngagement({ postId }: Props) {
  const query = useAdminPostEngagement(postId);
  const data = query.data ?? null;
  const error = getOptionalQueryErrorMessage(query.error, 'Could not load comments and kudos.');

  if (!postId) return null;

  return (
    <>
      {error ? <p className="admin-error">{error}</p> : null}
      {query.isLoading && !data ? <p className="admin-muted">Loading comments and kudos…</p> : null}
      {data ? <EngagementBody data={data} /> : null}
    </>
  );
}

function EngagementBody({ data }: { data: Engagement }) {
  const likeMap = likesByComment(data.commentLikes);

  return (
    <>
      <section className="admin-report-content-block">
        <h4 className="admin-report-content-label">
          Comments
          {data.comments.length > 0 ? ` · ${data.comments.length}` : ''}
        </h4>
        {data.comments.length === 0 ? (
          <p className="admin-muted">No comments.</p>
        ) : (
          <ul className="admin-engagement-list">
            {data.comments.map((comment) => {
              const id = rowString(comment, 'id') ?? String(comment.id);
              const userId = rowString(comment, 'user_id');
              const username = usernameOf(userId, data.usernames);
              const text = rowString(comment, 'text') ?? '';
              const createdAt = rowString(comment, 'created_at');
              const likes = likeMap.get(id) ?? [];
              return (
                <li key={id} className="admin-engagement-item">
                  <p className="admin-engagement-meta">
                    <UserLink username={username} />
                    {createdAt ? ` · ${formatWhen(createdAt)}` : ''}
                  </p>
                  <blockquote className="admin-report-quote">{text || '—'}</blockquote>
                  {likes.length > 0 ? (
                    <p className="admin-engagement-meta">
                      Liked by{' '}
                      {likes.map((like, i) => {
                        const likeUserId = rowString(like, 'user_id');
                        const likeName = usernameOf(likeUserId, data.usernames);
                        const likeKey = rowString(like, 'id') ?? `${id}-like-${i}`;
                        return (
                          <span key={likeKey}>
                            {i > 0 ? ', ' : ''}
                            <UserLink username={likeName} />
                          </span>
                        );
                      })}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="admin-report-content-block">
        <h4 className="admin-report-content-label">
          Kudos
          {data.kudos.length > 0 ? ` · ${data.kudos.length}` : ''}
        </h4>
        {data.kudos.length === 0 ? (
          <p className="admin-muted">No kudos.</p>
        ) : (
          <ul className="admin-engagement-kudos">
            {data.kudos.map((row, i) => {
              const userId = rowString(row, 'user_id');
              const username = usernameOf(userId, data.usernames);
              const createdAt = rowString(row, 'created_at');
              const key = rowString(row, 'id') ?? `${userId ?? 'kudos'}-${i}`;
              return (
                <li key={key} className="admin-engagement-kudo">
                  <UserLink username={username} />
                  {createdAt ? (
                    <span className="admin-engagement-meta"> · {formatWhen(createdAt)}</span>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <CollapsibleSection title="Raw comments & kudos" count={data.comments.length + data.kudos.length} defaultOpen={false} compact>
        <AdminJsonBlock
          label="JSON"
          value={{
            comments: data.comments,
            kudos: data.kudos,
            comment_likes: data.commentLikes,
          }}
        />
      </CollapsibleSection>
    </>
  );
}
