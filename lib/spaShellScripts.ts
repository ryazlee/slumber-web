/**
 * Inline scripts injected into built index.html / 404.html for GitHub Pages SPA routing.
 * Kept in one module so vite.config.ts and the runtime escape helpers stay aligned.
 *
 * Social crawlers (iMessage, Messenger, etc.) fetch deep-link URLs directly. On GitHub
 * Pages those paths return 404.html — so OG/Twitter meta must live here too, not only index.html.
 */

const OG_TITLE = 'Slumber';
const OG_DESCRIPTION =
  'Social sleep tracking for iOS. Log from Apple Health, share with friends, and join sleep challenges.';
const OG_IMAGE_WIDTH = 1200;
const OG_IMAGE_HEIGHT = 630;

/** Static Open Graph + Twitter Card tags (crawlers do not run React). */
export function buildSocialMetaHead(siteUrl: string): string {
  const imageUrl = `${siteUrl}/og-image.png`;
  return `
    <meta name="description" content="${OG_DESCRIPTION}" />
    <title>${OG_TITLE}</title>

    <link rel="icon" type="image/png" href="/moon.png" />
    <link rel="apple-touch-icon" href="/moon.png" />

    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="${OG_TITLE}" />
    <meta property="og:title" content="${OG_TITLE}" />
    <meta property="og:description" content="${OG_DESCRIPTION}" />
    <meta property="og:image" content="${imageUrl}" />
    <meta property="og:image:width" content="${OG_IMAGE_WIDTH}" />
    <meta property="og:image:height" content="${OG_IMAGE_HEIGHT}" />
    <meta property="og:image:alt" content="Slumber — social sleep tracking for iOS" />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${OG_TITLE}" />
    <meta name="twitter:description" content="${OG_DESCRIPTION}" />
    <meta name="twitter:image" content="${imageUrl}" />`;
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
    ${buildSocialMetaHead(siteUrl)}
    <script type="text/javascript">${build404RedirectScript(pathSegmentsToKeep)}</script>
  </head>
  <body></body>
</html>`;
}
