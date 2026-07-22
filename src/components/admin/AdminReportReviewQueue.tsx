import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { CommentReportGroup, PostReportGroup } from '../../lib/groupReports';
import { formatRoleList } from '../../lib/userRoles';
import AdminCopyButton from './AdminCopyButton';
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

function adminUserHref(username: string) {
  return `/admin/users?q=${encodeURIComponent(username)}`;
}

function AuthorMeta({
  author,
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
          <Link to={adminUserHref(author)} className="admin-report-link">
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
  reporterEmail,
}: {
  reporter: string;
  reporterId: string;
  reporterEmail?: string | null;
}) {
  return (
    <div className="admin-report-reporter">
      <Link to={adminUserHref(reporter)} className="admin-report-link">
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
      <h4 className="admin-report-reasons-title">Why it was reported</h4>
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
            <p className="admin-report-reason-text">{report.reason?.trim() || 'No reason given'}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ContentBlock({
  label,
  children,
  empty,
}: {
  label: string;
  children?: string | null;
  empty?: string;
}) {
  const text = children?.trim();
  return (
    <section className="admin-report-content-block">
      <h4 className="admin-report-content-label">{label}</h4>
      {text ? (
        <blockquote className="admin-report-quote">{text}</blockquote>
      ) : (
        <p className="admin-muted admin-report-content-empty">{empty ?? 'None'}</p>
      )}
    </section>
  );
}

function PostContent({ group }: { group: PostReportGroup }) {
  const chips = [
    group.vibe ? `Vibe: ${group.vibe}` : null,
    group.dreamMood ? `Dream mood: ${group.dreamMood}` : null,
    ...(group.tags ?? []).map((tag) => `#${tag}`),
  ].filter(Boolean) as string[];

  const hasText = Boolean(group.dreamLog || group.morningNotes);

  return (
    <div className="admin-report-content">
      <h4 className="admin-report-content-heading">Reported content</h4>
      {chips.length > 0 ? (
        <div className="admin-report-chips">
          {chips.map((chip) => (
            <span key={chip} className="admin-report-chip">{chip}</span>
          ))}
        </div>
      ) : null}
      <ContentBlock label="Dream log" empty="No dream text">
        {group.dreamLog}
      </ContentBlock>
      <ContentBlock label="Morning notes" empty="No morning notes">
        {group.morningNotes}
      </ContentBlock>
      {!hasText && !chips.length ? (
        <p className="admin-muted">
          This sleep post has no dream text or notes — only the title and sleep date are available.
        </p>
      ) : null}
    </div>
  );
}

type ConfirmKind = 'dismiss' | 'remove' | null;

function ReportActions({
  acting,
  confirmLabel,
  removeLabel,
  removeDisabled,
  onDismiss,
  onRemove,
}: {
  acting: boolean;
  confirmLabel: string;
  removeLabel: string;
  removeDisabled?: boolean;
  onDismiss: () => void;
  onRemove: () => void;
}) {
  const [confirm, setConfirm] = useState<ConfirmKind>(null);

  if (confirm) {
    const isRemove = confirm === 'remove';
    return (
      <div className="admin-report-actions admin-report-actions--confirm">
        <p className="admin-report-confirm-text">
          {isRemove
            ? `${removeLabel}? This cannot be undone, and reports will be closed.`
            : `${confirmLabel}? Reports leave the queue; content stays up.`}
        </p>
        <div className="admin-report-actions-row">
          <button
            type="button"
            className="admin-button admin-button-ghost"
            disabled={acting}
            onClick={() => setConfirm(null)}
          >
            Cancel
          </button>
          <button
            type="button"
            className={isRemove ? 'admin-button admin-button-danger' : 'admin-button'}
            disabled={acting}
            onClick={() => {
              if (isRemove) onRemove();
              else onDismiss();
            }}
          >
            {acting ? 'Working…' : isRemove ? `Yes, ${removeLabel.toLowerCase()}` : 'Yes, close reports'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-report-actions">
      <button
        type="button"
        className="admin-button"
        disabled={acting}
        onClick={() => setConfirm('dismiss')}
      >
        Close reports
      </button>
      {!removeDisabled ? (
        <button
          type="button"
          className="admin-button admin-button-danger"
          disabled={acting}
          onClick={() => setConfirm('remove')}
        >
          {removeLabel}
        </button>
      ) : null}
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

      <PostContent group={group} />

      <AuthorMeta
        author={group.author}
        authorId={group.authorId}
        authorJoined={group.authorJoined}
        authorPostsCount={group.authorPostsCount}
        authorReportCount={group.authorReportCount}
        authorRoles={group.authorRoles}
      />

      <ReportReasons reports={group.reports} />

      <ReportActions
        acting={acting}
        confirmLabel="Close all reports on this post"
        removeLabel="Remove post"
        removeDisabled={group.postDeleted}
        onDismiss={onDismiss}
        onRemove={onRemove}
      />
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

      <div className="admin-report-content">
        <h4 className="admin-report-content-heading">Reported comment</h4>
        <blockquote className="admin-report-quote">
          {group.commentText?.trim() || 'Comment text unavailable'}
        </blockquote>
      </div>

      <AuthorMeta
        author={group.author}
        authorId={group.authorId}
        authorJoined={group.authorJoined}
        authorPostsCount={group.authorPostsCount}
        authorReportCount={group.authorReportCount}
        authorRoles={group.authorRoles}
      />

      <ReportReasons reports={group.reports} />

      <ReportActions
        acting={acting}
        confirmLabel="Close all reports on this comment"
        removeLabel="Remove comment"
        onDismiss={onDismiss}
        onRemove={onRemove}
      />
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
