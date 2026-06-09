import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoginForm from '../../components/LoginForm';

export default function AppEntry() {
  const { session, loading } = useAuth();
  const location = useLocation();
  const redirectTo = (location.state as { from?: string } | null)?.from ?? '/feed';

  if (loading) {
    return (
      <div className="app-page app-page--centered">
        <p className="app-muted">Loading…</p>
      </div>
    );
  }

  if (session) {
    return <Navigate to={redirectTo} replace />;
  }

  return (
    <LoginForm
      description="Read-only view of your feed, profile, and challenges. Use the email tied to your Slumber account."
    />
  );
}
