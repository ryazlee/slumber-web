import { useAdminPost } from '../../hooks/useAdmin';
import { stringifyAdminPost } from './AdminPostRawJson';

type Props = {
  postId: string;
  preview: string;
  open: boolean;
  onToggle: () => void;
};

export default function AdminPostRawCell({ postId, preview, open, onToggle }: Props) {
  const query = useAdminPost(open ? postId : null);
  const full = query.data ? stringifyAdminPost(query.data) : null;

  return (
    <button
      type="button"
      className={`admin-raw-cell${open ? ' admin-raw-cell--open' : ''}`}
      aria-expanded={open}
      title={open ? 'Collapse raw JSON' : 'Expand raw JSON'}
      onClick={(event) => {
        event.stopPropagation();
        onToggle();
      }}
    >
      {open ? (
        <span className="admin-raw-cell-body">
          {query.isLoading && !full ? 'Loading…' : (full ?? preview)}
        </span>
      ) : (
        <span className="admin-raw-cell-line">{preview}</span>
      )}
    </button>
  );
}
