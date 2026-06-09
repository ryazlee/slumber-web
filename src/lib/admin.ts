import { supabase } from './supabase';

export type PostReportRow = {
  id: string;
  created_at: string;
  reason: string;
  reporter: string;
  author: string;
  title: string;
  post_id: string;
};

export type CommentReportRow = {
  id: string;
  created_at: string;
  reason: string;
  reporter: string;
  author: string;
  comment_text: string;
  comment_id: string;
  post_id: string;
};

export async function checkIsModerator(): Promise<boolean> {
  const { data, error } = await supabase.rpc('is_moderator');
  if (error) return false;
  return data === true;
}

export async function fetchPostReports(): Promise<PostReportRow[]> {
  const { data, error } = await supabase.rpc('admin_get_post_reports');
  if (error) throw error;
  return (data as PostReportRow[] | null) ?? [];
}

export async function fetchCommentReports(): Promise<CommentReportRow[]> {
  const { data, error } = await supabase.rpc('admin_get_comment_reports');
  if (error) throw error;
  return (data as CommentReportRow[] | null) ?? [];
}
