import { Link, Navigate, useLocation } from 'react-router-dom';
import LoginForm from '../../components/LoginForm';
import { useAuth } from '../../context/AuthContext';

const base = import.meta.env.BASE_URL;

export default function AppEntry() {
  const { session, loading } = useAuth();
  const location = useLocation();
  const redirectTo = (location.state as { from?: string } | null)?.from ?? '/feed';

  if (loading) {
    return (
      <div className="login-page">
        <header className="login-page-header">
          <Link to="/home" className="brand">
            <img src={`${base}moon.png`} alt="" width={28} height={28} />
            Slumber
          </Link>
          <nav className="login-page-nav" aria-label="Public">
            <Link to="/home">Home</Link>
          </nav>
        </header>
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
      <header className="login-page-header">
        <Link to="/home" className="brand">
          <img src={`${base}moon.png`} alt="" width={28} height={28} />
          Slumber
        </Link>
        <nav className="login-page-nav" aria-label="Public">
          <Link to="/home">Home</Link>
        </nav>
      </header>
      <main className="login-page-main">
        <LoginForm
          description="Read-only view of your feed, profile, and challenges. Use the email tied to your Slumber account."
        />
      </main>
    </div>
  );
}
