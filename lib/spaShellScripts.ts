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
  'Social sleep tracking for iOS. Log from Apple Health or Google Health, share with friends, and join sleep challenges.';

const DEEPLINK_TITLE = 'Join on Slumber';
const DEEPLINK_DESCRIPTION =
  "You're invited to try social sleep tracking for iOS. Log sleep with friends, compare stats, and join challenges.";

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

  return `
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
    <meta property="og:image:alt" content="Slumber, social sleep tracking for iOS" />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${imageUrl}" />

    <link rel="image_src" href="${imageUrl}" />
    <meta itemprop="image" content="${imageUrl}" />
    <link rel="manifest" href="${assetUrl(siteUrl, '/manifest.webmanifest')}" />`;
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
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    ${buildSocialMetaHead(siteUrl, 'deeplink')}
    <script type="text/javascript">${build404RedirectScript(pathSegmentsToKeep)}</script>
  </head>
  <body></body>
</html>`;
}
