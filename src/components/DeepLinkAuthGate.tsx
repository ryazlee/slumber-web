import type { ComponentType } from 'react';
import { useAuth } from '../context/AuthContext';
import AppShell from './AppShell';
import ContentLandingPage from '../pages/ContentLandingPage';

/** Logged-out visitors see the public app-handoff page; signed-in users get the web app view. */
export function withDeepLinkAuthGate(AppPage: ComponentType) {
  return function DeepLinkAuthGate() {
    const { session, loading } = useAuth();

    if (loading) {
      return (
        <main className="deeplink-page">
          <p className="deeplink-loading-text">Loading…</p>
        </main>
      );
    }

    if (!session) {
      return <ContentLandingPage />;
    }

    return (
      <AppShell>
        <AppPage />
      </AppShell>
    );
  };
}
