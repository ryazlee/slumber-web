import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createSessionFromUrl, hasAuthCallbackParams } from '../lib/auth/createSessionFromUrl';

export default function LoginCallback() {
  const navigate = useNavigate();
  const { session, loading: authLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [exchanging, setExchanging] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!hasAuthCallbackParams(window.location.href)) {
        if (!cancelled) setExchanging(false);
        return;
      }

      const result = await createSessionFromUrl(window.location.href);
      if (cancelled) return;

      if (result.status === 'error') {
        setError(result.message);
      }
      setExchanging(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (authLoading || exchanging) return;

    if (session) {
      navigate('/feed', { replace: true });
      return;
    }

    if (!hasAuthCallbackParams(window.location.href)) {
      navigate('/', { replace: true });
      return;
    }

    if (!error) {
      setError('Sign-in link failed. Enter the 6-digit code from your email instead.');
    }
  }, [authLoading, exchanging, session, error, navigate]);

  if (error) {
    return (
      <div className="login-page">
        <main className="login-page-main">
          <div className="admin-card admin-card-narrow login-card">
            <h1>Sign in failed</h1>
            <p className="admin-error">{error}</p>
            <Link className="admin-button" to="/">Back to sign in</Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="login-page">
      <main className="login-page-main">
        <p className="app-muted">Signing you in…</p>
      </main>
    </div>
  );
}
