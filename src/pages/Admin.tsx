import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import {
  checkIsModerator,
  fetchCommentReports,
  fetchPostReports,
  type CommentReportRow,
  type PostReportRow,
} from '../lib/admin';

type AuthStep = 'email' | 'otp';
type Tab = 'posts' | 'comments';

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export default function Admin() {
  const [booting, setBooting] = useState(true);
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [isModerator, setIsModerator] = useState(false);

  const [authStep, setAuthStep] = useState<AuthStep>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  const [tab, setTab] = useState<Tab>('posts');
  const [postReports, setPostReports] = useState<PostReportRow[]>([]);
  const [commentReports, setCommentReports] = useState<CommentReportRow[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsError, setReportsError] = useState<string | null>(null);

  const loadSession = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const nextEmail = session?.user.email ?? null;
    setSessionEmail(nextEmail);
    if (nextEmail) {
      setIsModerator(await checkIsModerator());
    } else {
      setIsModerator(false);
    }
    setBooting(false);
  }, []);

  useEffect(() => {
    loadSession();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      loadSession();
    });
    return () => subscription.unsubscribe();
  }, [loadSession]);

  const loadReports = useCallback(async () => {
    setReportsLoading(true);
    setReportsError(null);
    try {
      const [posts, comments] = await Promise.all([
        fetchPostReports(),
        fetchCommentReports(),
      ]);
      setPostReports(posts);
      setCommentReports(comments);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Could not load reports.';
      setReportsError(message);
    } finally {
      setReportsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (sessionEmail && isModerator) {
      loadReports();
    }
  }, [sessionEmail, isModerator, loadReports]);

  const handleSendOtp = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { shouldCreateUser: false },
      });
      if (error) throw error;
      setAuthStep('otp');
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : 'Could not send code.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: otp.trim(),
        type: 'email',
      });
      if (error) throw error;
      await loadSession();
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : 'Invalid code.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setAuthStep('email');
    setOtp('');
    setPostReports([]);
    setCommentReports([]);
    await loadSession();
  };

  if (booting) {
    return (
      <div className="admin-page">
        <p className="admin-muted">Loading…</p>
      </div>
    );
  }

  if (!sessionEmail) {
    return (
      <div className="admin-page">
        <div className="admin-card admin-card-narrow">
          <p className="eyebrow">Moderation</p>
          <h1>Admin sign in</h1>
          <p className="lead admin-lead">
            Sign in with your Slumber account. Requires <code>developer</code> or <code>founder</code> in your <code>user_roles</code>.
          </p>

          {authStep === 'email' ? (
            <form className="admin-form" onSubmit={handleSendOtp}>
              <label className="admin-label" htmlFor="admin-email">
                Email
              </label>
              <input
                id="admin-email"
                className="admin-input"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(ev) => setEmail(ev.target.value)}
                required
              />
              {authError && <p className="admin-error">{authError}</p>}
              <button className="admin-button" type="submit" disabled={authLoading}>
                {authLoading ? 'Sending…' : 'Send code'}
              </button>
            </form>
          ) : (
            <form className="admin-form" onSubmit={handleVerifyOtp}>
              <p className="admin-muted">Code sent to {email}</p>
              <label className="admin-label" htmlFor="admin-otp">
                Verification code
              </label>
              <input
                id="admin-otp"
                className="admin-input"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={otp}
                onChange={(ev) => setOtp(ev.target.value)}
                required
              />
              {authError && <p className="admin-error">{authError}</p>}
              <button className="admin-button" type="submit" disabled={authLoading}>
                {authLoading ? 'Verifying…' : 'Sign in'}
              </button>
              <button
                className="admin-button admin-button-ghost"
                type="button"
                onClick={() => { setAuthStep('email'); setOtp(''); setAuthError(null); }}
              >
                Use a different email
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  if (!isModerator) {
    return (
      <div className="admin-page">
        <div className="admin-card admin-card-narrow">
          <h1>Access denied</h1>
          <p className="lead admin-lead">
            Signed in as {sessionEmail}, but this account cannot access moderation.
            Add <code>developer</code> or <code>founder</code> to <code>profiles.user_roles</code> in Supabase.
          </p>
          <button className="admin-button" type="button" onClick={handleSignOut}>
            Sign out
          </button>
        </div>
      </div>
    );
  }

  const rows = tab === 'posts' ? postReports : commentReports;

  return (
    <div className="admin-page">
      <div className="admin-toolbar">
        <div>
          <p className="eyebrow">Moderation</p>
          <h1 className="admin-title">Reports</h1>
          <p className="admin-muted">Signed in as {sessionEmail}</p>
        </div>
        <div className="admin-toolbar-actions">
          <button
            className="admin-button admin-button-ghost"
            type="button"
            onClick={loadReports}
            disabled={reportsLoading}
          >
            {reportsLoading ? 'Refreshing…' : 'Refresh'}
          </button>
          <button className="admin-button admin-button-ghost" type="button" onClick={handleSignOut}>
            Sign out
          </button>
        </div>
      </div>

      <div className="admin-tabs" role="tablist" aria-label="Report type">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'posts'}
          className={tab === 'posts' ? 'admin-tab active' : 'admin-tab'}
          onClick={() => setTab('posts')}
        >
          Post reports ({postReports.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'comments'}
          className={tab === 'comments' ? 'admin-tab active' : 'admin-tab'}
          onClick={() => setTab('comments')}
        >
          Comment reports ({commentReports.length})
        </button>
      </div>

      {reportsError && <p className="admin-error admin-error-banner">{reportsError}</p>}

      {rows.length === 0 && !reportsLoading ? (
        <p className="admin-muted admin-empty">No {tab} reports yet.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              {tab === 'posts' ? (
                <tr>
                  <th>When</th>
                  <th>Reason</th>
                  <th>Reporter</th>
                  <th>Author</th>
                  <th>Post</th>
                  <th>Post ID</th>
                </tr>
              ) : (
                <tr>
                  <th>When</th>
                  <th>Reason</th>
                  <th>Reporter</th>
                  <th>Author</th>
                  <th>Comment</th>
                  <th>IDs</th>
                </tr>
              )}
            </thead>
            <tbody>
              {tab === 'posts'
                ? postReports.map((row) => (
                  <tr key={row.id}>
                    <td>{formatWhen(row.created_at)}</td>
                    <td>{row.reason}</td>
                    <td>@{row.reporter}</td>
                    <td>@{row.author}</td>
                    <td>{row.title || '—'}</td>
                    <td>
                      <code className="admin-code">{row.post_id}</code>
                    </td>
                  </tr>
                ))
                : commentReports.map((row) => (
                  <tr key={row.id}>
                    <td>{formatWhen(row.created_at)}</td>
                    <td>{row.reason}</td>
                    <td>@{row.reporter}</td>
                    <td>@{row.author}</td>
                    <td className="admin-comment-cell">{row.comment_text}</td>
                    <td>
                      <div className="admin-id-stack">
                        <code className="admin-code" title="comment id">{row.comment_id}</code>
                        <code className="admin-code" title="post id">{row.post_id}</code>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
