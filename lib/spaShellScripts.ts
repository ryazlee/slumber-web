/**
 * Inline scripts injected into built index.html / 404.html for GitHub Pages SPA routing.
 * Kept in one module so vite.config.ts and the runtime escape helpers stay aligned.
 *
 * Social crawlers (iMessage, Messenger, etc.) fetch deep-link URLs directly. On GitHub
 * Pages those paths return 404.html — so OG/Twitter meta must live here too, not only index.html.
 */

export type SocialMetaVariant = 'site' | 'deeplink';

const SITE_TITLE = 'Slumber';
const SITE_DESCRIPTION =
  'Social sleep tracking for iOS and Android. Log from Apple Health, Health Connect, or Google Health, share with friends, and join sleep challenges.';

const DEEPLINK_TITLE = 'Join on Slumber';
const DEEPLINK_DESCRIPTION =
  "You're invited on Slumber — social sleep tracking for iOS and Android. Log with friends, compare stats, and join sleep challenges.";

const OG_IMAGE_WIDTH = 1200;
const OG_IMAGE_HEIGHT = 630;

function assetUrl(siteUrl: string, path: string): string {
  const base = siteUrl.replace(/\/$/, '');
  const asset = path.startsWith('/') ? path : `/${path}`;
  return `${base}${asset}`;
}

/** Static Open Graph + Twitter Card tags (crawlers do not run React). */
export function buildSocialMetaHead(
  siteUrl: string,
  variant: SocialMetaVariant = 'site',
): string {
  const title = variant === 'deeplink' ? DEEPLINK_TITLE : SITE_TITLE;
  const description = variant === 'deeplink' ? DEEPLINK_DESCRIPTION : SITE_DESCRIPTION;
  const imageUrl = assetUrl(siteUrl, '/og-image.png');
  const touchIconUrl = assetUrl(siteUrl, '/apple-touch-icon.png');
  const icon512Url = assetUrl(siteUrl, '/icon-512.png');
  const faviconUrl = assetUrl(siteUrl, '/favicon-32.png');

  return `<!-- SOCIAL_META_BEGIN -->
    <meta name="description" content="${description}" />
    <title>${title}</title>

    <link rel="icon" type="image/png" sizes="32x32" href="${faviconUrl}" />
    <link rel="icon" type="image/png" href="${assetUrl(siteUrl, '/moon.png')}" />
    <link rel="apple-touch-icon" sizes="180x180" href="${touchIconUrl}" />
    <link rel="apple-touch-icon" href="${touchIconUrl}" />

    <meta name="apple-mobile-web-app-title" content="Slumber" />
    <meta name="application-name" content="Slumber" />
    <meta name="theme-color" content="#0f0f14" />

    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Slumber" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:url" content="${siteUrl.replace(/\/$/, '')}/" />
    <meta property="og:locale" content="en_US" />
    <meta property="og:image" content="${imageUrl}" />
    <meta property="og:image:secure_url" content="${imageUrl}" />
    <meta property="og:image:type" content="image/png" />
    <meta property="og:image:width" content="${OG_IMAGE_WIDTH}" />
    <meta property="og:image:height" content="${OG_IMAGE_HEIGHT}" />
    <meta property="og:image:alt" content="Slumber, social sleep tracking for iOS and Android" />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${imageUrl}" />

    <link rel="image_src" href="${imageUrl}" />
    <meta itemprop="image" content="${imageUrl}" />
    <link rel="manifest" href="${assetUrl(siteUrl, '/manifest.webmanifest')}" />
    <!-- SOCIAL_META_END -->`;
}

/** Swap the build-time social meta block (e.g. site → deeplink for /open/). */
export function replaceSocialMetaHead(
  html: string,
  siteUrl: string,
  variant: SocialMetaVariant,
): string {
  const next = buildSocialMetaHead(siteUrl, variant);
  if (html.includes('<!-- SOCIAL_META_BEGIN -->') && html.includes('<!-- SOCIAL_META_END -->')) {
    return html.replace(
      /<!-- SOCIAL_META_BEGIN -->[\s\S]*?<!-- SOCIAL_META_END -->/,
      next.trim(),
    );
  }
  return html.replace('<!-- SOCIAL_META -->', next);
}

function escapeToSystemBrowserSnippet(): string {
  return `
    var __ua = navigator.userAgent || '';
    var __ig = /Instagram|Threads/i.test(__ua);
    var __fb = /FBAN|FBAV|FB_IAB|Messenger/i.test(__ua);
    function __openInSystemBrowser(httpsUrl) {
      if (__ig) {
        window.location.replace('instagram://extbrowser/?url=' + encodeURIComponent(httpsUrl));
        return true;
      }
      if (__fb) {
        window.location.replace('x-safari-' + httpsUrl);
        return true;
      }
      if (/Android/i.test(__ua)) {
        try {
          var u = new URL(httpsUrl);
          window.location.replace(
            'intent://' + u.host + u.pathname + u.search
            + '#Intent;scheme=https;S.browser_fallback_url=' + encodeURIComponent(httpsUrl) + ';end'
          );
          return true;
        } catch (e) {}
      }
      return false;
    }`;
}

/** Runs in index.html before the React bundle — restore hash / legacy rafgraph paths. */
export function buildIndexRestoreScript(): string {
  return `${escapeToSystemBrowserSnippet()}
    (function(l) {
      if (l.hash.length > 2 && l.hash.charAt(1) === '/') {
        var hashPath = l.hash.slice(1);
        window.history.replaceState(null, null,
          l.pathname.replace(/\\/$/, '') + hashPath + l.search
        );
        return;
      }
      if (l.search[1] === '/') {
        var pathDecoded = l.search.slice(1).split('&').map(function(s) {
          return s.replace(/~and~/g, '&');
        }).join('?');
        window.history.replaceState(null, null,
          l.pathname.slice(0, -1) + pathDecoded + l.hash
        );
      }
    }(window.location));`;
}

/**
 * Runs in 404.html — hash-redirect to index (HTTP 200 on project root).
 * Instagram's WebView rejects 404 responses; the hash is never sent to GitHub Pages.
 */
export function build404RedirectScript(pathSegmentsToKeep: number): string {
  return `
    var pathSegmentsToKeep = ${pathSegmentsToKeep};
    var l = window.location;
    var base = l.pathname.split('/').slice(0, 1 + pathSegmentsToKeep).join('/');
    var routePath = l.pathname.slice(1).split('/').slice(pathSegmentsToKeep).join('/');
    if (routePath) {
      l.replace(l.protocol + '//' + l.host + base + '/#/' + routePath.replace(/&/g, '~and~') + l.search + l.hash);
    } else {
      l.replace(l.protocol + '//' + l.host + base + '/' + l.search + l.hash);
    }`;
}

export function build404Html(pathSegmentsToKeep: number, siteUrl: string): string {
  const base = siteUrl.replace(/\/$/, '');
  const iconUrl = `${base}/icon-512.png`;
  const homeUrl = `${base}/`;
  const downloadUrl = `${base}/download`;

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    ${buildSocialMetaHead(siteUrl, 'deeplink')}
    <style>
      :root {
        color-scheme: dark;
      }
      * { box-sizing: border-box; }
      html, body {
        margin: 0;
        min-height: 100%;
        background: #0c0c0e;
        color: #f4f4f5;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        -webkit-font-smoothing: antialiased;
      }
      body {
        min-height: 100dvh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 32px 20px;
        background:
          radial-gradient(ellipse 70% 55% at 12% 18%, rgba(94, 156, 245, 0.18), transparent 58%),
          radial-gradient(ellipse 50% 45% at 88% 12%, rgba(236, 72, 153, 0.12), transparent 52%),
          radial-gradient(ellipse 60% 50% at 70% 90%, rgba(139, 92, 246, 0.16), transparent 55%),
          #0c0c0e;
      }
      .shell {
        width: 100%;
        max-width: 24rem;
        text-align: center;
      }
      .icon {
        width: 64px;
        height: 64px;
        border-radius: 16px;
        margin: 0 auto 14px;
        box-shadow:
          0 4px 18px rgba(0, 0, 0, 0.4),
          0 0 0 1px rgba(255, 255, 255, 0.08);
        display: block;
      }
      .brand {
        margin: 0 0 18px;
        font-size: 1.35rem;
        font-weight: 800;
        letter-spacing: -0.03em;
      }
      .title {
        margin: 0 0 8px;
        font-size: 1.15rem;
        font-weight: 650;
        letter-spacing: -0.02em;
      }
      .lead {
        margin: 0;
        font-size: 0.95rem;
        line-height: 1.45;
        color: #a1a1aa;
      }
      .actions {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 10px;
        margin-top: 22px;
      }
      .btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 44px;
        min-width: 9.5rem;
        padding: 11px 18px;
        border-radius: 999px;
        font-weight: 600;
        font-size: 15px;
        text-decoration: none;
        color: #f4f4f5;
        border: 1px solid rgba(255, 255, 255, 0.14);
        background: rgba(255, 255, 255, 0.04);
      }
      .btn--primary {
        background: #f4f4f5;
        color: #0c0c0e;
        border-color: transparent;
      }
      noscript .lead { color: #a1a1aa; }
    </style>
    <script type="text/javascript">${build404RedirectScript(pathSegmentsToKeep)}</script>
  </head>
  <body>
    <div class="shell">
      <img class="icon" src="${iconUrl}" width="64" height="64" alt="" />
      <p class="brand">Slumber</p>
      <h1 class="title">Opening Slumber…</h1>
      <p class="lead">If nothing happens, use one of the links below.</p>
      <div class="actions">
        <a class="btn btn--primary" href="${homeUrl}">Go home</a>
        <a class="btn" href="${downloadUrl}">Download</a>
      </div>
    </div>
  </body>
</html>`;
}
