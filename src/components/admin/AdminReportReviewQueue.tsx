import { Link } from 'react-router-dom';
import type { CommentReportGroup, PostReportGroup } from '../../lib/groupReports';
import { formatRoleList } from '../../lib/userRoles';
import AdminCopyButton from './AdminCopyButton';
import AdminGridAction from './AdminGridAction';
import { formatWhen } from './format';

type Tab = 'posts' | 'comments';

type Props = {
  tab: Tab;
  postGroups: PostReportGroup[];
  commentGroups: CommentReportGroup[];
  actingKey: string | null;
  actionError: string | null;
  onDismissPost: (postId: string) => void;
  onDismissComment: (commentId: string) => void;
  onRemovePost: (postId: string) => void;
  onRemoveComment: (commentId: string) => void;
};

function sleepDateLabel(value: string) {
  if (!value) return '—';
  const d = new Date(`${value}T12:00:00`);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function AuthorMeta({
  author,
  authorId,
  authorJoined,
  authorPostsCount,
  authorReportCount,
  authorRoles,
}: {
  author: string;
  authorId: string;
  authorJoined: string;
  authorPostsCount: number;
  authorReportCount: number;
  authorRoles: string[] | null;
}) {
  return (
    <dl className="admin-report-meta">
      <div>
        <dt>Author</dt>
        <dd>
          <Link to={`/profile/${authorId}`} className="admin-report-link">
            @{author}
          </Link>
        </dd>
      </div>
      <div>
        <dt>Joined</dt>
        <dd>{formatWhen(authorJoined)}</dd>
      </div>
      <div>
        <dt>Posts</dt>
        <dd>{authorPostsCount}</dd>
      </div>
      <div>
        <dt>Prior reports</dt>
        <dd>{authorReportCount}</dd>
      </div>
      <div>
        <dt>Roles</dt>
        <dd>{formatRoleList(authorRoles)}</dd>
      </div>
    </dl>
  );
}

function ReporterContact({
  reporter,
  reporterId,
  reporterEmail,
}: {
  reporter: string;
  reporterId: string;
  reporterEmail?: string | null;
}) {
  return (
    <div className="admin-report-reporter">
      <Link to={`/profile/${reporterId}`} className="admin-report-link">
        @{reporter}
      </Link>
      {reporterEmail ? (
        <span className="admin-report-reporter-email">
          <a href={`mailto:${reporterEmail}`} className="admin-report-link">
            {reporterEmail}
          </a>
          <AdminCopyButton value={reporterEmail} label="Copy email" />
        </span>
      ) : (
        <span className="admin-report-reporter-email admin-muted">No email on file</span>
      )}
    </div>
  );
}

function ReportReasons({
  reports,
}: {
  reports: {
    id: string;
    created_at: string;
    reason: string;
    reporter: string;
    reporter_id: string;
    reporter_email?: string | null;
  }[];
}) {
  return (
    <div className="admin-report-reasons-wrap">
      <h4 className="admin-report-reasons-title">Reports</h4>
      <ul className="admin-report-reasons">
        {reports.map((report) => (
          <li key={report.id}>
            <div className="admin-report-reason-head">
              <ReporterContact
                reporter={report.reporter}
                reporterId={report.reporter_id}
                reporterEmail={report.reporter_email}
              />
              <time dateTime={report.created_at}>{formatWhen(report.created_at)}</time>
            </div>
            <p className="admin-report-reason-text">{report.reason}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PostReportCard({
  group,
  acting,
  onDismiss,
  onRemove,
}: {
  group: PostReportGroup;
  acting: boolean;
  onDismiss: () => void;
  onRemove: () => void;
}) {
  return (
    <article className="admin-report-card">
      <header className="admin-report-card-header">
        <div>
          <p className="admin-report-card-eyebrow">
            {group.reports.length} report{group.reports.length === 1 ? '' : 's'}
            {' · '}
            Latest {formatWhen(group.latestAt)}
          </p>
          <h3 className="admin-report-card-title">
            {group.title?.trim() || 'Untitled sleep post'}
          </h3>
          <p className="admin-report-card-sub">
            Sleep {sleepDateLabel(group.postSleepDate)}
            {' · '}
            Logged {formatWhen(group.postCreatedAt)}
            {group.postDeleted ? (
              <span className="admin-report-badge admin-report-badge--muted">Post removed</span>
            ) : null}
          </p>
        </div>
        <div className="admin-report-id">
          <code className="admin-code">{group.postId}</code>
          <AdminCopyButton value={group.postId} />
        </div>
      </header>

      <AuthorMeta
        author={group.author}
        authorId={group.authorId}
        authorJoined={group.authorJoined}
        authorPostsCount={group.authorPostsCount}
        authorReportCount={group.authorReportCount}
        authorRoles={group.authorRoles}
      />

      <ReportReasons reports={group.reports} />

      <div className="admin-report-actions">
        <Link to={`/post/${group.postId}`} className="admin-action-btn admin-action-btn--ghost">
          View post
        </Link>
        <AdminGridAction variant="ghost" onClick={onDismiss} disabled={acting}>
          Close reports
        </AdminGridAction>
        {!group.postDeleted ? (
          <AdminGridAction variant="danger" onClick={onRemove} disabled={acting}>
            Remove post
          </AdminGridAction>
        ) : null}
      </div>
    </article>
  );
}

function CommentReportCard({
  group,
  acting,
  onDismiss,
  onRemove,
}: {
  group: CommentReportGroup;
  acting: boolean;
  onDismiss: () => void;
  onRemove: () => void;
}) {
  return (
    <article className="admin-report-card">
      <header className="admin-report-card-header">
        <div>
          <p className="admin-report-card-eyebrow">
            {group.reports.length} report{group.reports.length === 1 ? '' : 's'}
            {' · '}
            Latest {formatWhen(group.latestAt)}
          </p>
          <h3 className="admin-report-card-title">Comment on {group.postTitle || 'sleep post'}</h3>
          <p className="admin-report-card-sub">
            Posted {formatWhen(group.commentCreatedAt)}
          </p>
        </div>
        <div className="admin-report-id">
          <code className="admin-code">{group.commentId}</code>
          <AdminCopyButton value={group.commentId} />
        </div>
      </header>

      <blockquote className="admin-report-quote">{group.commentText}</blockquote>

      <AuthorMeta
        author={group.author}
        authorId={group.authorId}
        authorJoined={group.authorJoined}
        authorPostsCount={group.authorPostsCount}
        authorReportCount={group.authorReportCount}
        authorRoles={group.authorRoles}
      />

      <ReportReasons reports={group.reports} />

      <div className="admin-report-actions">
        <Link to={`/post/${group.postId}`} className="admin-action-btn admin-action-btn--ghost">
          View post
        </Link>
        <AdminGridAction variant="ghost" onClick={onDismiss} disabled={acting}>
          Close reports
        </AdminGridAction>
        <AdminGridAction variant="danger" onClick={onRemove} disabled={acting}>
          Remove comment
        </AdminGridAction>
      </div>
    </article>
  );
}

export default function AdminReportReviewQueue({
  tab,
  postGroups,
  commentGroups,
  actingKey,
  actionError,
  onDismissPost,
  onDismissComment,
  onRemovePost,
  onRemoveComment,
}: Props) {
  const groups = tab === 'posts' ? postGroups : commentGroups;

  if (groups.length === 0) {
    return <p className="admin-muted admin-empty">No {tab} reports to review.</p>;
  }

  return (
    <div className="admin-report-queue">
      {actionError ? <p className="admin-error admin-error-banner">{actionError}</p> : null}
      {tab === 'posts'
        ? postGroups.map((group) => (
            <PostReportCard
              key={group.postId}
              group={group}
              acting={actingKey === `post:${group.postId}`}
              onDismiss={() => onDismissPost(group.postId)}
              onRemove={() => onRemovePost(group.postId)}
            />
          ))
        : commentGroups.map((group) => (
            <CommentReportCard
              key={group.commentId}
              group={group}
              acting={actingKey === `comment:${group.commentId}`}
              onDismiss={() => onDismissComment(group.commentId)}
              onRemove={() => onRemoveComment(group.commentId)}
            />
          ))}
    </div>
  );
}
