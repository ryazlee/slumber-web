import { Route, Routes } from 'react-router-dom';
import AppShell from './components/AppShell';
import Layout from './components/Layout';
import RequireAuth from './components/RequireAuth';
import SiteLayout from './components/SiteLayout';
import AppEntry from './pages/app/AppEntry';
import ChallengeDetail from './pages/app/ChallengeDetail';
import Challenges from './pages/app/Challenges';
import Feed from './pages/app/Feed';
import Profile from './pages/app/Profile';
import Admin from './pages/Admin';
import Home from './pages/Home';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';

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
        <Route path="admin" element={<Admin />} />
        <Route index element={<AppEntry />} />
        <Route element={<ProtectedAppShell />}>
          <Route path="feed" element={<Feed />} />
          <Route path="profile" element={<Profile />} />
          <Route path="profile/:userId" element={<Profile />} />
          <Route path="challenges" element={<Challenges />} />
          <Route path="challenges/:id" element={<ChallengeDetail />} />
        </Route>
        <Route element={<Layout />}>
          <Route path="home" element={<Home />} />
          <Route path="privacy" element={<Privacy />} />
          <Route path="terms" element={<Terms />} />
        </Route>
      </Route>
    </Routes>
  );
}
