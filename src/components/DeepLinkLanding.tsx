import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  APP_STORE_URL,
  buildSchemeUrl,
  isRestrictedInAppBrowser,
  scheduleAppOpen,
  tryOpenInApp,
} from '../lib/deepLinks';
import { detectInAppBrowser } from '../lib/inAppBrowserEscape';

export type DeepLinkIntent =
  | 'friend-invite'
  | 'challenge-join'
  | 'club-invite'
  | 'profile'
  | 'post'
  | 'challenge';

const INTENT_LABEL: Record<DeepLinkIntent, string> = {
  'friend-invite': 'Friend invite',
  'challenge-join': 'Join challenge',
  'club-invite': 'Club invite',
  profile: 'Profile',
  post: 'Sleep post',
  challenge: 'Challenge',
};

const INTENT_ICON: Record<DeepLinkIntent, string> = {
  'friend-invite': '👋',
  'challenge-join': '🏁',
  'club-invite': '💤',
  profile: '👤',
  post: '🌙',
  challenge: '🏁',
};

type Props = {
  intent: DeepLinkIntent;
  title: string;
  subtitle?: string;
  meta?: string;
  schemePath: string;
  loading?: boolean;
  error?: string | null;
  /** Shown in preview row (e.g. club emoji). */
  previewEmoji?: string | null;
};

const base = import.meta.env.BASE_URL;

export default function DeepLinkLanding({
  intent,
  title,
  subtitle,
  meta,
  schemePath,
  loading = false,
  error = null,
  previewEmoji = null,
}: Props) {
  const schemeUrl = buildSchemeUrl(schemePath);
  const previewIcon = previewEmoji?.trim() || INTENT_ICON[intent];

  useEffect(() => {
    return scheduleAppOpen(schemeUrl);
  }, [schemeUrl]);

  useEffect(() => {
    if (loading || isRestrictedInAppBrowser()) return;
    tryOpenInApp(schemeUrl);
  }, [loading, schemeUrl]);

  const inAppBrowser = isRestrictedInAppBrowser();
  const captiveApp = detectInAppBrowser();

  return (
    <main className="deeplink-page">
      <header className="deeplink-brand">
        <img
          className="deeplink-app-icon"
          src={`${base}moon.png`}
          alt=""
          width={64}
          height={64}
        />
        <span className="deeplink-app-name">Slumber</span>
      </header>

      <section className="deeplink-preview" aria-busy={loading}>
        <div className="deeplink-preview-icon" aria-hidden>
          {loading ? <span className="deeplink-preview-skeleton deeplink-preview-skeleton--icon" /> : previewIcon}
        </div>

        <p className="deeplink-preview-kind">{INTENT_LABEL[intent]}</p>

        {loading ? (
          <div className="deeplink-preview-loading" aria-label="Loading preview">
            <span className="deeplink-preview-skeleton deeplink-preview-skeleton--title" />
            <span className="deeplink-preview-skeleton deeplink-preview-skeleton--line" />
            <span className="deeplink-preview-skeleton deeplink-preview-skeleton--line deeplink-preview-skeleton--short" />
          </div>
        ) : (
          <>
            <h1 className="deeplink-preview-title">{title}</h1>
            {subtitle ? <p className="deeplink-preview-subtitle">{subtitle}</p> : null}
            {meta ? <p className="deeplink-preview-meta">{meta}</p> : null}
          </>
        )}

        {error ? (
          <p className="deeplink-preview-notice" role="status">{error}</p>
        ) : null}
      </section>

      <div className="deeplink-cta">
        <button
          type="button"
          className="deeplink-cta-primary"
          onClick={() => tryOpenInApp(schemeUrl)}
        >
          {captiveApp ? 'Continue in Safari' : 'Open in Slumber'}
        </button>
        <a
          href={APP_STORE_URL}
          className="deeplink-cta-store"
          target="_blank"
          rel="noreferrer"
        >
          Get Slumber on the App Store
        </a>
        <p className="deeplink-cta-hint">
          {captiveApp === 'instagram' ? (
            <>Opening in Safari… If nothing happens, tap <strong>Continue in Safari</strong>.</>
          ) : inAppBrowser ? (
            <>Tap <strong>Continue in Safari</strong> to view this link in your browser.</>
          ) : (
            <>If nothing happens, tap <strong>Open in Slumber</strong>.</>
          )}
        </p>
      </div>

      <footer className="deeplink-footer">
        <Link to="/home">About Slumber</Link>
        <span aria-hidden>·</span>
        <Link to="/privacy">Privacy</Link>
      </footer>
    </main>
  );
}

export function DeepLinkNotFound({ message }: { message: string }) {
  return (
    <main className="deeplink-page">
      <header className="deeplink-brand">
        <img className="deeplink-app-icon" src={`${base}moon.png`} alt="" width={64} height={64} />
        <span className="deeplink-app-name">Slumber</span>
      </header>
      <section className="deeplink-preview">
        <div className="deeplink-preview-icon" aria-hidden>🔗</div>
        <p className="deeplink-preview-kind">Link</p>
        <h1 className="deeplink-preview-title">Link not found</h1>
        <p className="deeplink-preview-subtitle">{message}</p>
      </section>
      <div className="deeplink-cta">
        <a href={APP_STORE_URL} className="deeplink-cta-primary deeplink-cta-primary--link" rel="noreferrer" target="_blank">
          Get Slumber on the App Store
        </a>
      </div>
      <footer className="deeplink-footer">
        <Link to="/home">About Slumber</Link>
      </footer>
    </main>
  );
}
