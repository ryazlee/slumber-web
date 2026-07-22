import type { CommentReportRow, PostReportRow } from './admin';

export type PostReportEntry = {
  id: string;
  created_at: string;
  reason: string;
  reporter: string;
  reporter_id: string;
  reporter_email?: string | null;
};

export type PostReportGroup = {
  postId: string;
  title: string;
  dreamLog: string | null;
  morningNotes: string | null;
  vibe: string | null;
  tags: string[] | null;
  dreamMood: string | null;
  postSleepDate: string;
  postCreatedAt: string;
  postDeleted: boolean;
  postReportCount: number;
  author: string;
  authorId: string;
  authorJoined: string;
  authorPostsCount: number;
  authorReportCount: number;
  authorRoles: string[] | null;
  authorIsPremium: boolean;
  reports: PostReportEntry[];
  latestAt: string;
};

export type CommentReportEntry = PostReportEntry;

export type CommentReportGroup = {
  commentId: string;
  commentText: string;
  commentCreatedAt: string;
  commentReportCount: number;
  postId: string;
  postTitle: string;
  author: string;
  authorId: string;
  authorJoined: string;
  authorPostsCount: number;
  authorReportCount: number;
  authorRoles: string[] | null;
  authorIsPremium: boolean;
  reports: CommentReportEntry[];
  latestAt: string;
};

function sortByLatest<T extends { latestAt: string }>(groups: T[]): T[] {
  return [...groups].sort(
    (a, b) => new Date(b.latestAt).getTime() - new Date(a.latestAt).getTime(),
  );
}

export function groupPostReports(rows: PostReportRow[]): PostReportGroup[] {
  const map = new Map<string, PostReportGroup>();

  for (const row of rows) {
    let group = map.get(row.post_id);
    if (!group) {
      group = {
        postId: row.post_id,
        title: row.title,
        dreamLog: row.dream_log?.trim() || null,
        morningNotes: row.morning_notes?.trim() || null,
        vibe: row.vibe?.trim() || null,
        tags: row.tags?.length ? row.tags : null,
        dreamMood: row.dream_mood?.trim() || null,
        postSleepDate: row.post_sleep_date,
        postCreatedAt: row.post_created_at,
        postDeleted: row.post_deleted,
        postReportCount: row.post_report_count,
        author: row.author,
        authorId: row.author_id,
        authorJoined: row.author_joined,
        authorPostsCount: row.author_posts_count,
        authorReportCount: row.author_report_count,
        authorRoles: row.author_roles,
        authorIsPremium: row.author_is_premium,
        reports: [],
        latestAt: row.created_at,
      };
      map.set(row.post_id, group);
    }

    group.reports.push({
      id: row.id,
      created_at: row.created_at,
      reason: row.reason,
      reporter: row.reporter,
      reporter_id: row.reporter_id,
      reporter_email: row.reporter_email,
    });

    if (new Date(row.created_at).getTime() > new Date(group.latestAt).getTime()) {
      group.latestAt = row.created_at;
    }
  }

  for (const group of map.values()) {
    group.reports.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  }

  return sortByLatest([...map.values()]);
}

export function groupCommentReports(rows: CommentReportRow[]): CommentReportGroup[] {
  const map = new Map<string, CommentReportGroup>();

  for (const row of rows) {
    let group = map.get(row.comment_id);
    if (!group) {
      group = {
        commentId: row.comment_id,
        commentText: row.comment_text,
        commentCreatedAt: row.comment_created_at,
        commentReportCount: row.comment_report_count,
        postId: row.post_id,
        postTitle: row.post_title,
        author: row.author,
        authorId: row.author_id,
        authorJoined: row.author_joined,
        authorPostsCount: row.author_posts_count,
        authorReportCount: row.author_report_count,
        authorRoles: row.author_roles,
        authorIsPremium: row.author_is_premium,
        reports: [],
        latestAt: row.created_at,
      };
      map.set(row.comment_id, group);
    }

    group.reports.push({
      id: row.id,
      created_at: row.created_at,
      reason: row.reason,
      reporter: row.reporter,
      reporter_id: row.reporter_id,
      reporter_email: row.reporter_email,
    });

    if (new Date(row.created_at).getTime() > new Date(group.latestAt).getTime()) {
      group.latestAt = row.created_at;
    }
  }

  for (const group of map.values()) {
    group.reports.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  }

  return sortByLatest([...map.values()]);
}
