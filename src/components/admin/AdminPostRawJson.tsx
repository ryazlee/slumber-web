import AdminCopyButton from './AdminCopyButton';
import type { AdminPostRaw } from '../../lib/admin';

export function stringifyAdminPost(data: AdminPostRaw): string {
  return JSON.stringify(data, null, 2);
}

function stringField(data: AdminPostRaw, key: string): string | null {
  const value = data[key];
  return typeof value === 'string' && value ? value : null;
}

export function AdminJsonBlock({ value, label = 'JSON' }: { value: unknown; label?: string }) {
  const json = JSON.stringify(value, null, 2);
  return (
    <div className="admin-json-block">
      <div className="admin-post-raw-toolbar">
        <span className="admin-post-raw-toolbar-label">{label}</span>
        <AdminCopyButton
          value={json}
          label="Copy JSON"
          title="Copy JSON"
          className="admin-button admin-button-sm"
        />
      </div>
      <pre className="admin-json-pre">{json}</pre>
    </div>
  );
}

type Props = {
  data: AdminPostRaw;
};

export default function AdminPostRawJson({ data }: Props) {
  const postId = stringField(data, 'id');
  const userId = stringField(data, 'user_id');
  const deletedAt = stringField(data, 'deleted_at');

  return (
    <div className="admin-post-raw">
      {deletedAt ? (
        <p className="admin-error">Soft-deleted {deletedAt}</p>
      ) : null}
      <dl className="admin-user-detail-grid">
        {postId ? (
          <div>
            <dt>Post ID</dt>
            <dd className="admin-id-cell">
              <code className="admin-code">{postId}</code>
              <AdminCopyButton value={postId} />
            </dd>
          </div>
        ) : null}
        {userId ? (
          <div>
            <dt>User ID</dt>
            <dd className="admin-id-cell">
              <code className="admin-code">{userId}</code>
              <AdminCopyButton value={userId} />
            </dd>
          </div>
        ) : null}
        <div>
          <dt>Sleep date</dt>
          <dd>{stringField(data, 'sleep_date') ?? '—'}</dd>
        </div>
        <div>
          <dt>Source</dt>
          <dd>{stringField(data, 'source_device') ?? '—'}</dd>
        </div>
        <div>
          <dt>Kind</dt>
          <dd>{stringField(data, 'session_kind') ?? '—'}</dd>
        </div>
      </dl>
      <AdminJsonBlock value={data} />
    </div>
  );
}
