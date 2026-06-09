import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import AdminOverview from '../components/admin/AdminOverview';
import AdminReports from '../components/admin/AdminReports';
import AdminRoles from '../components/admin/AdminRoles';
import AdminTags from '../components/admin/AdminTags';
import AdminUsers from '../components/admin/AdminUsers';
import {
  checkIsModerator,
  fetchAdminRoleDefinitions,
  fetchAdminTags,
  fetchCommentReports,
  fetchDashboardMetrics,
  fetchPostReports,
  fetchRecentUsers,
  type AdminRoleDefinitionRow,
  type AdminTagRow,
  type CommentReportRow,
  type DashboardMetrics,
  type PostReportRow,
  type RecentUserRow,
} from '../lib/admin';
import { supabase } from '../lib/supabase';

type AuthStep = 'email' | 'otp';
type MainTab = 'overview' | 'reports' | 'users' | 'roles' | 'tags';
type ReportTab = 'posts' | 'comments';

export default function Admin() {
  const [booting, setBooting] = useState(true);
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [isModerator, setIsModerator] = useState(false);

  const [authStep, setAuthStep] = useState<AuthStep>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  const [mainTab, setMainTab] = useState<MainTab>('overview');
  const [reportTab, setReportTab] = useState<ReportTab>('posts');
  const [refreshing, setRefreshing] = useState(false);

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentUsers, setRecentUsers] = useState<RecentUserRow[]>([]);
  const [overviewError, setOverviewError] = useState<string | null>(null);

  const [postReports, setPostReports] = useState<PostReportRow[]>([]);
  const [commentReports, setCommentReports] = useState<CommentReportRow[]>([]);
  const [reportsError, setReportsError] = useState<string | null>(null);

  const [tags, setTags] = useState<AdminTagRow[]>([]);
  const [tagsError, setTagsError] = useState<string | null>(null);

  const [roleDefinitions, setRoleDefinitions] = useState<AdminRoleDefinitionRow[]>([]);
  const [rolesError, setRolesError] = useState<string | null>(null);

  const [usersError, setUsersError] = useState<string | null>(null);
  const [usersRefreshToken, setUsersRefreshToken] = useState(0);

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

  const loadOverview = useCallback(async () => {
    setOverviewError(null);
    try {
      const [m, u] = await Promise.all([
        fetchDashboardMetrics(),
        fetchRecentUsers(25),
      ]);
      setMetrics(m);
      setRecentUsers(u);
    } catch (e: unknown) {
      setOverviewError(e instanceof Error ? e.message : 'Could not load metrics.');
    }
  }, []);

  const loadReports = useCallback(async () => {
    setReportsError(null);
    try {
      const [posts, comments] = await Promise.all([
        fetchPostReports(),
        fetchCommentReports(),
      ]);
      setPostReports(posts);
      setCommentReports(comments);
    } catch (e: unknown) {
      setReportsError(e instanceof Error ? e.message : 'Could not load reports.');
    }
  }, []);

  const loadTags = useCallback(async () => {
    setTagsError(null);
    try {
      setTags(await fetchAdminTags());
    } catch (e: unknown) {
      setTagsError(e instanceof Error ? e.message : 'Could not load tags.');
    }
  }, []);

  const loadRoles = useCallback(async () => {
    setRolesError(null);
    try {
      setRoleDefinitions(await fetchAdminRoleDefinitions());
    } catch (e: unknown) {
      setRolesError(e instanceof Error ? e.message : 'Could not load roles.');
    }
  }, []);

  const refreshCurrentTab = useCallback(async () => {
    if (!isModerator) return;
    setRefreshing(true);
    try {
      if (mainTab === 'overview') await loadOverview();
      else if (mainTab === 'reports') await loadReports();
      else if (mainTab === 'tags') await loadTags();
      else if (mainTab === 'roles') await loadRoles();
      else if (mainTab === 'users') setUsersRefreshToken((n) => n + 1);
    } finally {
      setRefreshing(false);
    }
  }, [isModerator, mainTab, loadOverview, loadReports, loadTags, loadRoles]);

  useEffect(() => {
    if (!sessionEmail || !isModerator) return;
    fetchDashboardMetrics()
      .then(setMetrics)
      .catch(() => { /* badge counts optional */ });
  }, [sessionEmail, isModerator]);

  useEffect(() => {
    if (!sessionEmail || !isModerator) return;
    if (mainTab === 'overview') loadOverview();
    else if (mainTab === 'reports') loadReports();
    else if (mainTab === 'roles') loadRoles();
    else if (mainTab === 'tags') loadTags();
  }, [sessionEmail, isModerator, mainTab, loadOverview, loadReports, loadRoles, loadTags]);

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
    setMetrics(null);
    setRecentUsers([]);
    setPostReports([]);
    setCommentReports([]);
    setTags([]);
    setRoleDefinitions([]);
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
      <div className="admin-page admin-page--centered">
        <div className="admin-card admin-card-narrow">
          <p className="eyebrow">Admin</p>
          <h1>Sign in</h1>
          <p className="lead admin-lead">
            Requires a role with <code>is_admin</code> in <code>role_definitions</code> (e.g. <code>developer</code>, <code>founder</code>) on your profile.
          </p>

          {authStep === 'email' ? (
            <form className="admin-form" onSubmit={handleSendOtp}>
              <label className="admin-label" htmlFor="admin-email">Email</label>
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
              <label className="admin-label" htmlFor="admin-otp">Verification code</label>
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
      <div className="admin-page admin-page--centered">
        <div className="admin-card admin-card-narrow">
          <h1>Access denied</h1>
          <p className="lead admin-lead">
            Signed in as {sessionEmail}. Assign an admin role (e.g. <code>developer</code>) in <code>profiles.user_roles</code>.
          </p>
          <button className="admin-button" type="button" onClick={handleSignOut}>Sign out</button>
        </div>
      </div>
    );
  }

  const pageTitle = {
    overview: 'Overview',
    reports: 'Reports',
    users: 'Users',
    roles: 'Roles',
    tags: 'Tags',
  }[mainTab];

  return (
    <div className="admin-page">
      <div className="admin-toolbar">
        <div>
          <p className="eyebrow">Slumber Admin</p>
          <h1 className="admin-title">{pageTitle}</h1>
          <p className="admin-muted">Signed in as {sessionEmail}</p>
        </div>
        <div className="admin-toolbar-actions">
          <button
            className="admin-button admin-button-ghost"
            type="button"
            onClick={refreshCurrentTab}
            disabled={refreshing}
          >
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
          <button className="admin-button admin-button-ghost" type="button" onClick={handleSignOut}>
            Sign out
          </button>
        </div>
      </div>

      <div className="admin-tabs" role="tablist" aria-label="Admin sections">
        <button
          type="button"
          role="tab"
          aria-selected={mainTab === 'overview'}
          className={mainTab === 'overview' ? 'admin-tab active' : 'admin-tab'}
          onClick={() => setMainTab('overview')}
        >
          Overview
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mainTab === 'reports'}
          className={mainTab === 'reports' ? 'admin-tab active' : 'admin-tab'}
          onClick={() => setMainTab('reports')}
        >
          Reports
          {(metrics?.pending_post_reports ?? 0) + (metrics?.pending_comment_reports ?? 0) > 0
            ? ` (${(metrics?.pending_post_reports ?? 0) + (metrics?.pending_comment_reports ?? 0)})`
            : ''}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mainTab === 'users'}
          className={mainTab === 'users' ? 'admin-tab active' : 'admin-tab'}
          onClick={() => setMainTab('users')}
        >
          Users
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mainTab === 'roles'}
          className={mainTab === 'roles' ? 'admin-tab active' : 'admin-tab'}
          onClick={() => setMainTab('roles')}
        >
          Roles
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mainTab === 'tags'}
          className={mainTab === 'tags' ? 'admin-tab active' : 'admin-tab'}
          onClick={() => setMainTab('tags')}
        >
          Tags
        </button>
      </div>

      {mainTab === 'overview' && (
        <AdminOverview
          metrics={metrics}
          users={recentUsers}
          loading={refreshing && !metrics}
          error={overviewError}
        />
      )}

      {mainTab === 'reports' && (
        <AdminReports
          tab={reportTab}
          onTabChange={setReportTab}
          postReports={postReports}
          commentReports={commentReports}
          loading={refreshing && postReports.length === 0 && commentReports.length === 0}
          error={reportsError}
        />
      )}

      {mainTab === 'users' && (
        <AdminUsers
          loading={refreshing}
          error={usersError}
          refreshToken={usersRefreshToken}
          onError={setUsersError}
          onReload={loadOverview}
        />
      )}

      {mainTab === 'roles' && (
        <AdminRoles
          roles={roleDefinitions}
          loading={refreshing && roleDefinitions.length === 0}
          error={rolesError}
          onChanged={loadRoles}
        />
      )}

      {mainTab === 'tags' && (
        <AdminTags
          tags={tags}
          loading={refreshing && tags.length === 0}
          error={tagsError}
          onChanged={loadTags}
        />
      )}
    </div>
  );
}
