import { useEffect, useState } from 'react';

/**
 * Google Health OAuth lands here (HTTPS redirect). Bounce to the app scheme so
 * Slumber can finish the connection. This is not Slumber account sign-in.
 */
export default function HealthCallback() {
  const [showManualHelp, setShowManualHelp] = useState(false);

  useEffect(() => {
    const { search } = window.location;
    const hasOAuthParams =
      search.includes('code=') || search.includes('error=') || search.includes('error_description=');

    if (!hasOAuthParams) {
      setShowManualHelp(true);
      return;
    }

    window.location.replace(`slumber://health-callback${search}`);

    const timer = window.setTimeout(() => {
      setShowManualHelp(true);
    }, 2500);

    return () => window.clearTimeout(timer);
  }, []);

  if (!showManualHelp) {
    return (
      <main style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif', maxWidth: 480, margin: '0 auto' }}>
        <p style={{ lineHeight: 1.5, color: '#444' }}>Opening Slumber…</p>
      </main>
    );
  }

  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif', maxWidth: 480, margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>Google Health</h1>
      <p style={{ lineHeight: 1.5, color: '#444', marginBottom: '0.75rem' }}>
        This page finishes <strong>Google Health sleep sync</strong> — not Slumber account sign-in.
      </p>
      <p style={{ lineHeight: 1.5, color: '#444' }}>
        Open the Slumber app, sign in with email or &quot;Continue with Google&quot;, then go to
        Settings → Sleep data source → Google Health → Connect.
      </p>
    </main>
  );
}
