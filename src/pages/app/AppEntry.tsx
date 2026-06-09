import { Navigate, useLocation } from 'react-router-dom';
import LoginForm from '../../components/LoginForm';
import { useAuth } from '../../context/AuthContext';

export default function AppEntry() {
  const { session, loading } = useAuth();
  const location = useLocation();
  const redirectTo = (location.state as { from?: string } | null)?.from ?? '/feed';

  if (loading) {
    return (
      <div className="login-page">
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
      <main className="login-page-main">
        <LoginForm
          description="Read-only view of your feed, profile, and challenges. Use the email tied to your Slumber account."
        />
      </main>
    </div>
  );
}
