import { useState } from 'react';
import { getOptionalQueryErrorMessage } from '../../lib/queryError';
import { useAdminPost } from '../../hooks/useAdmin';
import AdminFormDialog from './AdminFormDialog';
import AdminGridAction from './AdminGridAction';
import AdminPostPreviewDialog from './AdminPostPreviewDialog';
import AdminPostRawJson from './AdminPostRawJson';

type Props = {
  postId: string;
  title?: string | null;
  username?: string | null;
  onClose: () => void;
};

export default function AdminPostRawPanel({ postId, title, username, onClose }: Props) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const query = useAdminPost(postId);
  const data = query.data ?? null;
  const error = getOptionalQueryErrorMessage(query.error, 'Could not load post.');
  const heading = title?.trim() || (typeof data?.title === 'string' && data.title ? data.title : 'Raw post');
  const meta = [
    username ? `@${username}` : null,
    postId,
  ].filter(Boolean).join(' · ');

  return (
    <AdminFormDialog open onClose={onClose} title={heading} wide>
      <p className="admin-panel-desc">
        Full sleep_posts row, including raw_samples and session_breakdown.
      </p>
      {meta ? <p className="admin-muted">{meta}</p> : null}
      <div className="admin-user-detail-actions">
        <AdminGridAction
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            setPreviewOpen(true);
          }}
        >
          Open post
        </AdminGridAction>
      </div>
      <AdminPostPreviewDialog
        postId={previewOpen ? postId : null}
        row={{
          title: title ?? undefined,
          username: username ?? undefined,
        }}
        onClose={() => setPreviewOpen(false)}
      />
      {error ? <p className="admin-error">{error}</p> : null}
      {query.isLoading && !data ? <p className="admin-muted">Loading raw post…</p> : null}
      {!query.isLoading && !error && !data ? (
        <p className="admin-muted">Post not found.</p>
      ) : null}
      {data ? <AdminPostRawJson data={data} /> : null}
    </AdminFormDialog>
  );
}
