/**
 * Cloudflare Worker — return HTTP 200 + OG shell for app deep-link paths on GitHub Pages.
 *
 * GitHub Pages serves 404.html for /invite/* but with status 404; iMessage and Messenger
 * often skip rich previews on non-200 responses. This worker re-fetches 404.html and
 * returns it with status 200 for known deep-link prefixes.
 *
 * Setup: Cloudflare dashboard → Workers → attach route `useslumber.com/*` (or zone worker).
 * Origin remains GitHub Pages; no app code changes required on the worker beyond deploy.
 */

const DEEP_LINK_PREFIXES = [
  '/invite/',
  '/post/',
  '/profile/',
  '/challenge/',
  '/challenges/',
  '/challenge/join/',
  '/club/',
  '/login-callback',
  '/health-callback',
];

function isDeepLinkPath(pathname) {
  if (pathname === '/login-callback' || pathname === '/health-callback') return true;
  return DEEP_LINK_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export default {
  async fetch(request) {
    const response = await fetch(request);

    if (response.status !== 404) {
      return response;
    }

    const { pathname } = new URL(request.url);
    if (!isDeepLinkPath(pathname)) {
      return response;
    }

    const shellUrl = new URL('/404.html', request.url);
    const shell = await fetch(shellUrl.toString(), {
      headers: { Accept: 'text/html' },
    });

    if (!shell.ok) {
      return response;
    }

    const headers = new Headers(shell.headers);
    headers.set('content-type', 'text/html; charset=utf-8');
    headers.set('cache-control', 'public, max-age=0, must-revalidate');

    return new Response(shell.body, { status: 200, headers });
  },
};
