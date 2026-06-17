import type { ComponentType } from 'react';
import { useAuth } from '../context/AuthContext';
import ContentLandingPage from '../pages/ContentLandingPage';

/** Logged-out visitors see the public app-handoff page; signed-in users get the web app view. */
export function withDeepLinkAuthGate(AppPage: ComponentType) {
  return function DeepLinkAuthGate() {
    const { session, loading } = useAuth();

    if (loading) {
      return (
        <div className="content-wrap deeplink-page">
          <p className="app-muted">Loading…</p>
        </div>
      );
    }

    if (!session) {
      return <ContentLandingPage />;
    }

    return <AppPage />;
  };
}
