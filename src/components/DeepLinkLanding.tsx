import { useEffect, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { APP_STORE_URL, buildSchemeUrl, tryOpenInApp } from '../lib/deepLinks';

type Props = {
  title: string;
  subtitle?: string;
  detail?: string;
  schemePath: string;
  loading?: boolean;
  error?: string | null;
  children?: ReactNode;
};

export default function DeepLinkLanding({
  title,
  subtitle,
  detail,
  schemePath,
  loading = false,
  error = null,
  children,
}: Props) {
  const schemeUrl = buildSchemeUrl(schemePath);

  useEffect(() => {
    if (loading || error) return;
    tryOpenInApp(schemeUrl);
  }, [loading, error, schemeUrl]);

  return (
    <div className="content-wrap deeplink-page">
      <div className="deeplink-card">
        <p className="eyebrow">Slumber</p>
        <h1>{title}</h1>
        {subtitle ? <p className="lead">{subtitle}</p> : null}
        {detail ? <p className="deeplink-detail">{detail}</p> : null}
        {loading ? <p className="app-muted">Loading…</p> : null}
        {error ? <p className="deeplink-error">{error}</p> : null}
        {children}
        <div className="deeplink-actions">
          <button
            type="button"
            className="deeplink-btn deeplink-btn--primary"
            onClick={() => tryOpenInApp(schemeUrl)}
          >
            Open in Slumber
          </button>
          <a
            href={APP_STORE_URL}
            className="deeplink-btn deeplink-btn--secondary"
            target="_blank"
            rel="noreferrer"
          >
            Get the app
          </a>
        </div>
        <p className="deeplink-hint">
          If the app doesn&apos;t open, tap <strong>Open in Slumber</strong> above.
          {' '}
          <Link to="/home">Learn more</Link>
        </p>
      </div>
    </div>
  );
}
