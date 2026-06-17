import { Navigate, Route, Routes } from 'react-router-dom';
import AppShell from './components/AppShell';
import Layout from './components/Layout';
import RequireAuth from './components/RequireAuth';
import SiteLayout from './components/SiteLayout';
import AppEntry from './pages/app/AppEntry';
import ChallengeDetail from './pages/app/ChallengeDetail';
import Challenges from './pages/app/Challenges';
import Compare from './pages/app/Compare';
import Feed from './pages/app/Feed';
import MyStats from './pages/app/MyStats';
import PostDetail from './pages/app/PostDetail';
import Profile from './pages/app/Profile';
import SocialClubs from './pages/app/SocialClubs';
import SocialFriends from './pages/app/SocialFriends';
import SocialLayout from './pages/app/SocialLayout';
import StatsLayout from './pages/app/StatsLayout';
import AdminLayout from './pages/admin/AdminLayout';
import AdminHomePage from './pages/admin/AdminHomePage';
import AdminAnalyticsPage from './pages/admin/AdminAnalyticsPage';
import AdminPremiumPage from './pages/admin/AdminPremiumPage';
import AdminNotifyPage from './pages/admin/AdminNotifyPage';
import AdminReportsPage from './pages/admin/AdminReportsPage';
import AdminRolesPage from './pages/admin/AdminRolesPage';
import AdminTagsPage from './pages/admin/AdminTagsPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import Home from './pages/Home';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import InviteLandingPage from './pages/InviteLandingPage';
import { withDeepLinkAuthGate } from './components/DeepLinkAuthGate';

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

export default function App() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route path="admin" element={<AdminLayout />}>
          <Route index element={<AdminHomePage />} />
          <Route path="analytics" element={<AdminAnalyticsPage />} />
          <Route path="reports" element={<AdminReportsPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="premium" element={<AdminPremiumPage />} />
          <Route path="notify" element={<AdminNotifyPage />} />
          <Route path="configure">
            <Route index element={<Navigate to="tags" replace />} />
            <Route path="tags" element={<AdminTagsPage />} />
            <Route path="roles" element={<AdminRolesPage />} />
          </Route>
        </Route>
        <Route index element={<AppEntry />} />
        {/* Shared deep-link paths: public landing when logged out, web app when signed in */}
        <Route path="post/:id" element={<GatedPostDetail />} />
        <Route path="profile/:userId" element={<GatedProfile />} />
        <Route path="challenge/:id" element={<GatedChallengeDetail />} />
        <Route path="challenges/:id" element={<GatedChallengeDetail />} />
        <Route element={<ProtectedAppShell />}>
          <Route path="feed" element={<Feed />} />
          <Route path="stats" element={<StatsLayout />}>
            <Route index element={<MyStats />} />
            <Route path="compare" element={<Compare />} />
          </Route>
          <Route path="social" element={<SocialLayout />}>
            <Route index element={<SocialFriends />} />
            <Route path="clubs" element={<SocialClubs />} />
          </Route>
          <Route path="compare" element={<Navigate to="/stats/compare" replace />} />
          <Route path="social/compare" element={<Navigate to="/stats/compare" replace />} />
          <Route path="profile" element={<Profile />} />
          <Route path="challenges" element={<Challenges />} />
        </Route>
        <Route element={<Layout />}>
          <Route path="home" element={<Home />} />
          <Route path="privacy" element={<Privacy />} />
          <Route path="terms" element={<Terms />} />
          <Route path="invite/:token" element={<InviteLandingPage />} />
          <Route path="challenge/join/:token" element={<InviteLandingPage />} />
          <Route path="club/:clubId/invite/:token" element={<InviteLandingPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
