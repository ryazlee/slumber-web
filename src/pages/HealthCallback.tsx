/** Minimal landing for Google Health OAuth redirect on web / universal links. */
export default function HealthCallback() {
  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif', maxWidth: 480, margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>Google Health</h1>
      <p style={{ lineHeight: 1.5, color: '#444' }}>
        Return to the Slumber app to finish connecting Google Health. If the app did not open automatically,
        switch back to Slumber and try connecting again from Settings.
      </p>
    </main>
  );
}
