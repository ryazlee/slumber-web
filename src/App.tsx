import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import AppShell from './components/AppShell';
import Layout from './components/Layout';
import RequireAuth from './components/RequireAuth';
import SiteLayout from './components/SiteLayout';
import { withDeepLinkAuthGate } from './components/DeepLinkAuthGate';
import { trackPageview } from './lib/analytics';
import AdminLayout from './pages/admin/AdminLayout';
import AdminActivityPage from './pages/admin/AdminActivityPage';
import AdminAnalyticsPage from './pages/admin/AdminAnalyticsPage';
import AdminDreamsPage from './pages/admin/AdminDreamsPage';
import AdminPostsPage from './pages/admin/AdminPostsPage';
import AdminTagUsagePage from './pages/admin/AdminTagUsagePage';
import AdminPremiumPage from './pages/admin/AdminPremiumPage';
import AdminNotifyPage from './pages/admin/AdminNotifyPage';
import AdminCampaignsPage from './pages/admin/AdminCampaignsPage';
import AdminReportsPage from './pages/admin/AdminReportsPage';
import AdminRolesPage from './pages/admin/AdminRolesPage';
import AdminTagsPage from './pages/admin/AdminTagsPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminCommunityPage from './pages/admin/AdminCommunityPage';
import AppEntry from './pages/app/AppEntry';
import ChallengeDetail from './pages/app/ChallengeDetail';
import Challenges from './pages/app/Challenges';
import Compare from './pages/app/Compare';
import Feed from './pages/app/Feed';
import IndexRoute, { HomeAliasRoute } from './pages/app/IndexRoute';
import MyStats from './pages/app/MyStats';
import PostDetail from './pages/app/PostDetail';
import Profile from './pages/app/Profile';
import SocialClubs from './pages/app/SocialClubs';
import SocialFriends from './pages/app/SocialFriends';
import SocialGlobal from './pages/app/SocialGlobal';
import SocialLayout from './pages/app/SocialLayout';
import StatsLayout from './pages/app/StatsLayout';
import Contact from './pages/Contact';
import DeleteAccount from './pages/DeleteAccount';
import DeleteData from './pages/DeleteData';
import Download from './pages/Download';
import HealthCallback from './pages/HealthCallback';
import InviteLandingPage from './pages/InviteLandingPage';
import LoginCallback from './pages/LoginCallback';
import NotFound from './pages/NotFound';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';

const GatedPostDetail = withDeepLinkAuthGate(PostDetail);
const GatedProfile = withDeepLinkAuthGate(Profile);
const GatedChallengeDetail = withDeepLinkAuthGate(ChallengeDetail);

function ProtectedAppShell() {
  return (
    <RequireAuth>
      <AppShell />
    </RequireAuth>
  );
}

function RouteAnalytics() {
  const location = useLocation();

  useEffect(() => {
    trackPageview();
  }, [location.pathname, location.search, location.hash]);

  return null;
}

export default function App() {
  return (
    <>
      <RouteAnalytics />
      <Routes>
      <Route element={<SiteLayout />}>
        <Route path="invite/:token" element={<InviteLandingPage />} />
        <Route path="challenge/join/:token" element={<InviteLandingPage />} />
        <Route path="club/:clubId/invite/:token" element={<InviteLandingPage />} />
        <Route path="post/:id" element={<GatedPostDetail />} />
        <Route path="profile/:userId" element={<GatedProfile />} />
        <Route path="challenge/:id" element={<GatedChallengeDetail />} />
        <Route path="challenges/:id" element={<GatedChallengeDetail />} />

        <Route path="admin" element={<AdminLayout />}>
          <Route index element={<AdminAnalyticsPage />} />
          <Route path="analytics" element={<AdminActivityPage />} />
          <Route path="tag-usage" element={<AdminTagUsagePage />} />
          <Route path="dreams" element={<AdminDreamsPage />} />
          <Route path="posts" element={<AdminPostsPage />} />
          <Route path="reports" element={<AdminReportsPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="community" element={<AdminCommunityPage />} />
          <Route path="premium" element={<AdminPremiumPage />} />
          <Route path="notify" element={<AdminNotifyPage />} />
          <Route path="campaigns" element={<AdminCampaignsPage />} />
          <Route path="configure">
            <Route index element={<Navigate to="tags" replace />} />
            <Route path="tags" element={<AdminTagsPage />} />
            <Route path="roles" element={<AdminRolesPage />} />
          </Route>
        </Route>
        <Route path="login-callback" element={<LoginCallback />} />
        <Route path="health-callback" element={<HealthCallback />} />
        <Route path="login" element={<AppEntry />} />
        <Route element={<ProtectedAppShell />}>
          <Route path="feed" element={<Feed />} />
          <Route path="stats" element={<StatsLayout />}>
            <Route index element={<MyStats />} />
            <Route path="compare" element={<Compare />} />
          </Route>
          <Route path="social" element={<SocialLayout />}>
            <Route index element={<Navigate to="/social/global" replace />} />
            <Route path="global" element={<SocialGlobal />} />
            <Route path="clubs" element={<SocialClubs />} />
            <Route path="friends" element={<SocialFriends />} />
          </Route>
          <Route path="compare" element={<Navigate to="/stats/compare" replace />} />
          <Route path="social/compare" element={<Navigate to="/stats/compare" replace />} />
          <Route path="profile" element={<Profile />} />
          <Route path="challenges" element={<Challenges />} />
        </Route>
        <Route element={<Layout />}>
          <Route index element={<IndexRoute />} />
          <Route path="home" element={<HomeAliasRoute />} />
          <Route path="download" element={<Download />} />
          <Route path="contact" element={<Contact />} />
          <Route path="privacy" element={<Privacy />} />
          <Route path="terms" element={<Terms />} />
          <Route path="delete-account" element={<DeleteAccount />} />
          <Route path="delete-data" element={<DeleteData />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Route>
      </Routes>
    </>
  );
}
