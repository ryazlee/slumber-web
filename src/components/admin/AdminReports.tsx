import type { CommentReportRow, PostReportRow } from '../../lib/admin';
import { formatWhen } from './format';

type Tab = 'posts' | 'comments';

type Props = {
  tab: Tab;
  onTabChange: (tab: Tab) => void;
  postReports: PostReportRow[];
  commentReports: CommentReportRow[];
  loading: boolean;
  error: string | null;
};

export default function AdminReports({
  tab, onTabChange, postReports, commentReports, loading, error,
}: Props) {
  const rows = tab === 'posts' ? postReports : commentReports;

  return (
    <>
      <div className="admin-tabs admin-tabs-sub" role="tablist" aria-label="Report type">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'posts'}
          className={tab === 'posts' ? 'admin-tab active' : 'admin-tab'}
          onClick={() => onTabChange('posts')}
        >
          Post reports ({postReports.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'comments'}
          className={tab === 'comments' ? 'admin-tab active' : 'admin-tab'}
          onClick={() => onTabChange('comments')}
        >
          Comment reports ({commentReports.length})
        </button>
      </div>

      {error && <p className="admin-error admin-error-banner">{error}</p>}
      {loading && <p className="admin-muted">Loading reports…</p>}

      {!loading && rows.length === 0 ? (
        <p className="admin-muted admin-empty">No {tab} reports yet.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table admin-table--cards">
            <thead>
              {tab === 'posts' ? (
                <tr>
                  <th>When</th>
                  <th>Reason</th>
                  <th>Reporter</th>
                  <th>Author</th>
                  <th>Post</th>
                </tr>
              ) : (
                <tr>
                  <th>When</th>
                  <th>Reason</th>
                  <th>Reporter</th>
                  <th>Author</th>
                  <th>Comment</th>
                </tr>
              )}
            </thead>
            <tbody>
              {tab === 'posts'
                ? postReports.map((row) => (
                  <tr key={row.id}>
                    <td data-label="When">{formatWhen(row.created_at)}</td>
                    <td data-label="Reason">{row.reason}</td>
                    <td data-label="Reporter">@{row.reporter}</td>
                    <td data-label="Author">@{row.author}</td>
                    <td data-label="Post" className="admin-td-stack">{row.title || '—'}</td>
                  </tr>
                ))
                : commentReports.map((row) => (
                  <tr key={row.id}>
                    <td data-label="When">{formatWhen(row.created_at)}</td>
                    <td data-label="Reason">{row.reason}</td>
                    <td data-label="Reporter">@{row.reporter}</td>
                    <td data-label="Author">@{row.author}</td>
                    <td data-label="Comment" className="admin-td-stack admin-comment-cell">{row.comment_text}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
