import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import type { RecentUserRow } from '../../lib/admin';
import { getOptionalQueryErrorMessage } from '../../lib/queryError';
import {
  useAdminUserDetail,
  useAdminUserPosts,
  useResetUserStreak,
  useSetUserSuspended,
  useUpdateUserRoles,
} from '../../hooks/useAdmin';
import { useAssignableRoles } from '../../hooks/useCatalog';
import { getCachedRoleOptions } from '../../lib/userRoles';
import AdminCopyButton from './AdminCopyButton';
import AdminGridAction from './AdminGridAction';
import AdminPanel from './AdminPanel';
import AdminUserRoleEditor from './AdminUserRoleEditor';
import { formatWhen } from './format';
import { ADMIN_CATALOG_FORM_ID } from './adminScroll';

type Props = {
  user: RecentUserRow;
  onClose: () => void;
};

export default function AdminUserDetailPanel({ user, onClose }: Props) {
  const detailQuery = useAdminUserDetail(user.id);
  const postsQuery = useAdminUserPosts(
    { userId: user.id, page: 0, pageSize: 10 },
    Boolean(user.id),
  );
  const rolesQuery = useAssignableRoles();
  const roleOptions = rolesQuery.data ?? getCachedRoleOptions();
  const updateRolesMutation = useUpdateUserRoles();
  const resetStreakMutation = useResetUserStreak();
  const suspendMutation = useSetUserSuspended();

  const detail = detailQuery.data ?? null;
  const posts = postsQuery.data?.rows ?? [];

  const [editingRoles, setEditingRoles] = useState(false);
  const [draftRoles, setDraftRoles] = useState<string[]>([]);
  const [roleError, setRoleError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const knownRoleKeys = useMemo(
    () => new Set(roleOptions.map((opt) => opt.key)),
    [roleOptions],
  );

  useEffect(() => {
    setEditingRoles(false);
    setRoleError(null);
    setActionMessage(null);
    const known = (user.user_roles ?? []).filter((r) => knownRoleKeys.has(r));
    setDraftRoles(known);
  }, [user.id, user.user_roles, knownRoleKeys]);

  const startRoleEdit = () => {
    const known = (user.user_roles ?? []).filter((r) => knownRoleKeys.has(r));
    setDraftRoles(known);
    setEditingRoles(true);
    setRoleError(null);
  };

  const saveRoles = async () => {
    setRoleError(null);
    try {
      await updateRolesMutation.mutateAsync({ userId: user.id, roles: draftRoles });
      setEditingRoles(false);
      setActionMessage('Roles saved.');
    } catch (e: unknown) {
      setRoleError(e instanceof Error ? e.message : 'Could not save roles.');
    }
  };

  const resetStreak = async () => {
    if (!window.confirm(`Reset @${user.username}'s current streak to 0?`)) return;
    setActionMessage(null);
    try {
      const result = await resetStreakMutation.mutateAsync(user.id);
      setActionMessage(
        result.changed
          ? `Streak reset (${String(result.before.current_streak)} → 0).`
          : 'Streak already 0.',
      );
    } catch (e: unknown) {
      setActionMessage(e instanceof Error ? e.message : 'Could not reset streak.');
    }
  };

  const toggleSuspend = async () => {
    const suspended = detail?.is_suspended ?? user.is_suspended ?? false;
    const next = !suspended;
    const verb = next ? 'Suspend' : 'Unsuspend';
    if (!window.confirm(`${verb} @${user.username}?${next ? ' They will not be able to post or comment.' : ''}`)) return;
    setActionMessage(null);
    try {
      await suspendMutation.mutateAsync({ userId: user.id, suspended: next });
      setActionMessage(next ? 'User suspended.' : 'User unsuspended.');
    } catch (e: unknown) {
      setActionMessage(e instanceof Error ? e.message : 'Could not update suspend status.');
    }
  };

  const error = getOptionalQueryErrorMessage(detailQuery.error, 'Could not load user detail.');
  const isSuspended = detail?.is_suspended ?? user.is_suspended ?? false;
  const acting = resetStreakMutation.isPending || suspendMutation.isPending;

  const editorUser = useMemo<RecentUserRow>(() => ({
    ...user,
    user_roles: detail?.user_roles ?? user.user_roles,
    is_premium: detail?.is_premium ?? user.is_premium,
    email: detail?.email ?? user.email,
  }), [user, detail]);

  return (
    <AdminPanel
      id={ADMIN_CATALOG_FORM_ID}
      title={`@${user.username}`}
      meta={[
        detail?.email ?? user.email,
        isSuspended ? 'Suspended' : null,
        detail?.last_app_version ? `v${detail.last_app_version}` : null,
      ].filter(Boolean).join(' · ') || undefined}
      highlighted
      headerAction={(
        <button type="button" className="admin-button admin-button-ghost" onClick={onClose}>
          Close
        </button>
      )}
    >
      {error ? <p className="admin-error">{error}</p> : null}

      {detail ? (
        <dl className="admin-user-detail-grid">
          <div><dt>Joined</dt><dd>{formatWhen(detail.created_at)}</dd></div>
          <div><dt>Posts</dt><dd>{detail.posts_count}</dd></div>
          <div><dt>Friends</dt><dd>{detail.friends_count}</dd></div>
          <div><dt>Streak</dt><dd>{detail.current_streak} (best {detail.longest_streak})</dd></div>
          <div><dt>Last post</dt><dd>{detail.last_post_at ? formatWhen(detail.last_post_at) : '—'}</dd></div>
          <div><dt>Premium</dt><dd>{detail.is_premium ? 'Yes' : 'No'}</dd></div>
          <div><dt>Push tokens</dt><dd>{detail.device_tokens}</dd></div>
          <div>
            <dt>User ID</dt>
            <dd className="admin-id-cell">
              <code className="admin-code">{detail.id}</code>
              <AdminCopyButton value={detail.id} />
            </dd>
          </div>
        </dl>
      ) : (
        <p className="admin-muted">Loading profile…</p>
      )}

      <div className="admin-user-detail-actions">
        <Link
          to={`/admin/notify?user=${user.id}`}
          className="admin-action-btn admin-action-btn--ghost"
        >
          Notify
        </Link>
        <Link to="/admin/premium" className="admin-action-btn admin-action-btn--ghost">
          Premium
        </Link>
        <Link to={`/profile/${user.id}`} className="admin-action-btn admin-action-btn--ghost">
          Open profile
        </Link>
        <AdminGridAction variant="ghost" onClick={() => void resetStreak()} disabled={acting}>
          Reset streak
        </AdminGridAction>
        <AdminGridAction
          variant={isSuspended ? 'accent' : 'danger'}
          onClick={() => void toggleSuspend()}
          disabled={acting}
        >
          {isSuspended ? 'Unsuspend' : 'Suspend'}
        </AdminGridAction>
        {!editingRoles ? (
          <AdminGridAction onClick={startRoleEdit}>Edit roles</AdminGridAction>
        ) : null}
      </div>

      {actionMessage ? <p className="admin-muted">{actionMessage}</p> : null}

      {editingRoles ? (
        <AdminUserRoleEditor
          user={editorUser}
          roleOptions={roleOptions}
          draftRoles={draftRoles}
          saving={updateRolesMutation.isPending}
          error={roleError}
          onChange={setDraftRoles}
          onSave={saveRoles}
          onCancel={() => setEditingRoles(false)}
          embedded
        />
      ) : null}

      <div className="admin-user-detail-posts">
        <h3 className="admin-subsection-title">Recent posts</h3>
        {posts.length === 0 ? (
          <p className="admin-muted">No sleep posts.</p>
        ) : (
          <ul className="admin-user-post-list">
            {posts.map((post) => (
              <li key={post.id}>
                <Link to={`/post/${post.id}`} className="admin-user-post-link">
                  <span className="admin-user-post-title">{post.title || 'Untitled'}</span>
                  <span className="admin-user-post-meta">
                    {post.sleep_date} · {formatWhen(post.created_at)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        {detail && detail.posts_count > posts.length ? (
          <Link to={`/admin/posts?user=${user.id}`} className="admin-muted">
            View all in Posts →
          </Link>
        ) : null}
      </div>
    </AdminPanel>
  );
}
