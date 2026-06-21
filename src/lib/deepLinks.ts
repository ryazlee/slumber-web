import { normalizeWebAppPath } from './siteUrl';

export const APP_STORE_URL = 'https://apps.apple.com/app/id6772449516';

export type InviteLinkTarget =
  | { kind: 'friend'; token: string; schemePath: string }
  | { kind: 'challenge'; token: string; schemePath: string }
  | { kind: 'club'; clubId: string; token: string; schemePath: string };

export type ContentLinkTarget =
  | { kind: 'post'; postId: string; schemePath: string }
  | { kind: 'profile'; userId: string; schemePath: string }
  | { kind: 'challenge'; challengeId: string; schemePath: string };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TOKEN_RE = /^[A-Za-z0-9_-]{8,64}$/;

function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

function pathSegments(pathname: string): string[] {
  return normalizeWebAppPath(pathname).split('/').filter(Boolean);
}

/** Parse post / profile / challenge content paths. */
export function parseContentLinkPath(pathname: string): ContentLinkTarget | null {
  const segments = pathSegments(pathname);

  if (segments[0] === 'post' && segments[1] && isUuid(segments[1])) {
    return {
      kind: 'post',
      postId: segments[1],
      schemePath: `post/${segments[1]}`,
    };
  }

  if (segments[0] === 'profile' && segments[1] && isUuid(segments[1])) {
    return {
      kind: 'profile',
      userId: segments[1],
      schemePath: `profile/${segments[1]}`,
    };
  }

  if (
    (segments[0] === 'challenge' || segments[0] === 'challenges')
    && segments[1]
    && segments[1] !== 'join'
    && isUuid(segments[1])
  ) {
    return {
      kind: 'challenge',
      challengeId: segments[1],
      schemePath: `challenge/${segments[1]}`,
    };
  }

  return null;
}

/** Parse invite/join paths (matches app deep-link URL shapes). */
export function parseInviteLinkPath(pathname: string): InviteLinkTarget | null {
  const segments = pathSegments(pathname);

  if (segments[0] === 'invite' && segments[1] && TOKEN_RE.test(segments[1])) {
    return {
      kind: 'friend',
      token: segments[1],
      schemePath: `invite/${segments[1]}`,
    };
  }

  if (
    segments[0] === 'challenge'
    && segments[1] === 'join'
    && segments[2]
    && TOKEN_RE.test(segments[2])
  ) {
    return {
      kind: 'challenge',
      token: segments[2],
      schemePath: `challenge/join/${segments[2]}`,
    };
  }

  if (
    segments[0] === 'club'
    && segments[1]
    && isUuid(segments[1])
    && segments[2] === 'invite'
    && segments[3]
    && TOKEN_RE.test(segments[3])
  ) {
    return {
      kind: 'club',
      clubId: segments[1],
      token: segments[3],
      schemePath: `club/${segments[1]}/invite/${segments[3]}`,
    };
  }

  return null;
}

/** Custom-scheme URL that opens the native app when installed. */
export function buildSchemeUrl(path: string): string {
  const normalized = path.replace(/^\//, '');
  // Triple slash keeps the route in pathname (slumber:///post/id), not the URL host.
  return `slumber:///${normalized}`;
}

/**
 * Instagram / Facebook / etc. in-app browsers load the landing page fine but treat
 * `slumber://` navigation as a failed page load — skip auto-open and location.replace.
 */
export function isRestrictedInAppBrowser(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return /Instagram|FBAN|FBAV|FB_IAB|Messenger|Line\/|Twitter|LinkedInApp|TikTok|Snapchat/i.test(ua);
}

function openWithHiddenAnchor(schemeUrl: string): void {
  const anchor = document.createElement('a');
  anchor.href = schemeUrl;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
}

/** Best-effort handoff to the native app (Safari often blocks silent redirects). */
export function tryOpenInApp(schemeUrl: string): void {
  openWithHiddenAnchor(schemeUrl);
  if (isRestrictedInAppBrowser()) return;
  window.setTimeout(() => {
    window.location.replace(schemeUrl);
  }, 50);
}

/** Retry a few times — helps when the landing page mounts before Safari allows navigation. */
export function scheduleAppOpen(schemeUrl: string): () => void {
  if (isRestrictedInAppBrowser()) return () => {};
  tryOpenInApp(schemeUrl);
  const retry1 = window.setTimeout(() => tryOpenInApp(schemeUrl), 400);
  const retry2 = window.setTimeout(() => tryOpenInApp(schemeUrl), 1200);
  return () => {
    window.clearTimeout(retry1);
    window.clearTimeout(retry2);
  };
}
