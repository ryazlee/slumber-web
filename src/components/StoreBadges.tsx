import { useState, type ReactNode } from 'react';
import { APP_STORE_URL, isAndroidUserAgent } from '../lib/deepLinks';
import AndroidBetaPopup from './AndroidBetaPopup';

type StoreKind = 'ios' | 'android';

type StoreBadgeProps = {
  store: StoreKind;
  /** Filled emphasis vs outline. Defaults to platform preference. */
  emphasis?: 'primary' | 'secondary';
  className?: string;
};

function AppleIcon() {
  return (
    <svg className="store-badge-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.22-1.98 1.08-3.13-1.05.04-2.31.7-3.06 1.58-.67.78-1.25 2.04-1.09 3.24 1.15.09 2.33-.59 3.07-1.69"
      />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg className="store-badge-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M3.61 1.81 13.79 12 3.61 22.19a1 1 0 0 1-.61-.92V2.73a1 1 0 0 1 .61-.92Zm10.89 10.89 2.3 2.3-10.94 6.34 8.64-8.64Zm3.2-3.2 2.81 1.63a1 1 0 0 1 0 1.73l-2.81 1.63L15.21 12l2.49-2.5ZM5.86 2.66 16.8 8.99l-2.3 2.3-8.64-8.63Z"
      />
    </svg>
  );
}

const COPY: Record<StoreKind, { eyebrow: string; title: string; label: string }> = {
  ios: {
    eyebrow: 'Download on the',
    title: 'App Store',
    label: 'Download on the App Store',
  },
  android: {
    eyebrow: 'Get it on',
    title: 'Google Play',
    label: 'Get it on Google Play',
  },
};

function StoreBadgeContent({ store }: { store: StoreKind }) {
  const copy = COPY[store];
  return (
    <>
      {store === 'ios' ? <AppleIcon /> : <PlayIcon />}
      <span className="store-badge-text">
        <span className="store-badge-eyebrow">{copy.eyebrow}</span>
        <span className="store-badge-title">{copy.title}</span>
      </span>
    </>
  );
}

export function StoreBadge({ store, emphasis, className = '' }: StoreBadgeProps) {
  const [androidBetaOpen, setAndroidBetaOpen] = useState(false);
  const copy = COPY[store];
  const preferPlay = isAndroidUserAgent();
  const resolvedEmphasis =
    emphasis ?? (store === (preferPlay ? 'android' : 'ios') ? 'primary' : 'secondary');
  const badgeClass = `store-badge store-badge--${resolvedEmphasis} ${className}`.trim();

  let control: ReactNode;
  if (store === 'android') {
    control = (
      <button
        type="button"
        className={badgeClass}
        aria-label={copy.label}
        onClick={() => setAndroidBetaOpen(true)}
      >
        <StoreBadgeContent store={store} />
      </button>
    );
  } else {
    control = (
      <a
        href={APP_STORE_URL}
        className={badgeClass}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={copy.label}
      >
        <StoreBadgeContent store={store} />
      </a>
    );
  }

  return (
    <>
      {control}
      {store === 'android' ? (
        <AndroidBetaPopup open={androidBetaOpen} onClose={() => setAndroidBetaOpen(false)} />
      ) : null}
    </>
  );
}

type StoreBadgePairProps = {
  /** When true, neither badge is filled (e.g. under an Open feed CTA). */
  muted?: boolean;
  className?: string;
};

/** Platform-ordered App Store + Google Play badges. */
export function StoreBadgePair({ muted = false, className = '' }: StoreBadgePairProps) {
  const preferPlay = isAndroidUserAgent();
  const first: StoreKind = preferPlay ? 'android' : 'ios';
  const second: StoreKind = preferPlay ? 'ios' : 'android';

  return (
    <div className={`store-badge-pair ${className}`.trim()}>
      <StoreBadge store={first} emphasis={muted ? 'secondary' : 'primary'} />
      <StoreBadge store={second} emphasis="secondary" />
    </div>
  );
}
