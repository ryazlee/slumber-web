import { Link, Navigate, useLocation } from 'react-router-dom';
import AccentBubbles from '../../components/AccentBubbles';
import LoginForm from '../../components/LoginForm';
import { useAuth } from '../../context/AuthContext';

export default function AppEntry() {
  const { session, loading } = useAuth();
  const location = useLocation();
  const redirectTo = (location.state as { from?: string } | null)?.from ?? '/feed';

  if (loading) {
    return (
      <div className="login-page">
        <AccentBubbles />
        <main className="login-page-main">
          <p className="app-muted">Loading…</p>
        </main>
      </div>
    );
  }

  if (session) {
    return <Navigate to={redirectTo} replace />;
  }

  return (
    <div className="login-page">
      <AccentBubbles />
      <main className="login-page-main">
        <LoginForm
          description="Browse your feed, social, stats, and challenges and leave kudos and comments. Log sleep, accept invites, and manage friends in the mobile app. Use the email tied to your Slumber account."
        />
        <p className="login-page-foot">
          <Link to="/">← Back to Slumber</Link>
        </p>
      </main>
    </div>
  );
}
