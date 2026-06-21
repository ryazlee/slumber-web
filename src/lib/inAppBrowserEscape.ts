export type InAppBrowser =
  | 'instagram'
  | 'facebook'
  | 'other';

/** Detect captive in-app browsers that break GitHub Pages SPAs and custom schemes. */
export function detectInAppBrowser(): InAppBrowser | null {
  if (typeof navigator === 'undefined') return null;
  const ua = navigator.userAgent || '';
  if (/Instagram|Threads/i.test(ua)) return 'instagram';
  if (/FBAN|FBAV|FB_IAB|Messenger/i.test(ua)) return 'facebook';
  return null;
}

export function isRestrictedInAppBrowser(): boolean {
  return detectInAppBrowser() !== null
    || /Line\/|Twitter|LinkedInApp|TikTok|Snapchat/i.test(
      typeof navigator !== 'undefined' ? navigator.userAgent || '' : '',
    );
}

/** Current page as an absolute https URL (path + query + hash). */
export function currentHttpsUrl(): string {
  const { protocol, host, pathname, search, hash } = window.location;
  return `${protocol}//${host}${pathname}${search}${hash}`;
}

/**
 * Ask the host app to open this page in the system browser.
 * Instagram: `instagram://extbrowser/?url=` (handled by the IG app, not the WebView).
 * Facebook: Apple's private `x-safari-https://` scheme.
 */
export function buildSystemBrowserOpenUrl(httpsUrl: string): string | null {
  const app = detectInAppBrowser();
  if (app === 'instagram') {
    return `instagram://extbrowser/?url=${encodeURIComponent(httpsUrl)}`;
  }
  if (app === 'facebook') {
    return `x-safari-${httpsUrl}`;
  }
  if (/Android/i.test(navigator.userAgent || '')) {
    try {
      const u = new URL(httpsUrl);
      return (
        `intent://${u.host}${u.pathname}${u.search}`
        + `#Intent;scheme=https;S.browser_fallback_url=${encodeURIComponent(httpsUrl)};end`
      );
    } catch {
      return null;
    }
  }
  return null;
}

/** Redirect out of a captive in-app browser when possible. */
export function escapeToSystemBrowser(httpsUrl = currentHttpsUrl()): boolean {
  const openUrl = buildSystemBrowserOpenUrl(httpsUrl);
  if (!openUrl) return false;
  window.location.replace(openUrl);
  return true;
}

/**
 * Build the target HTTPS URL from a rafgraph `/?/path` landing URL, or return the
 * current href when no redirect query is present.
 */
export function httpsUrlFromSpaRedirect(location: Location): string {
  if (location.search[1] === '/') {
    const decoded = location.search
      .slice(1)
      .split('&')
      .map((s) => s.replace(/~and~/g, '&'))
      .join('?');
    return `${location.protocol}//${location.host}${location.pathname.replace(/\/$/, '')}${decoded}${location.hash}`;
  }
  return `${location.protocol}//${location.host}${location.pathname}${location.search}${location.hash}`;
}
