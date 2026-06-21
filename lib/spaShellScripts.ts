/**
 * Inline scripts injected into built index.html / 404.html for GitHub Pages SPA routing.
 * Kept in one module so vite.config.ts and the runtime escape helpers stay aligned.
 */

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

export function build404Html(pathSegmentsToKeep: number): string {
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Redirecting…</title>
    <script type="text/javascript">${build404RedirectScript(pathSegmentsToKeep)}</script>
  </head>
  <body></body>
</html>`;
}
