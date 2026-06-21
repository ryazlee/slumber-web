import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

const DEFAULT_SITE_URL = 'https://ryazlee.github.io/slumber-web';
const IOS_APP_ID = 'L57M37HLYR.com.ryan.slumber';

function appLinkPath(basePath: string, route: string): string {
  const base = basePath.replace(/\/$/, '');
  return `${base}/${route}`.replace(/\/+/g, '/');
}

/** GitHub Pages project sites need 1 segment kept (`/repo-name/`); root deploys use 0. */
function pathSegmentsToKeep(basePath: string): number {
  const trimmed = basePath.replace(/^\/|\/$/g, '');
  if (!trimmed) return 0;
  return trimmed.split('/').filter(Boolean).length;
}

/**
 * SPA fallback for GitHub Pages — https://github.com/rafgraph/spa-github-pages
 * 404.html redirects to index.html with a query param; index.html restores the path via replaceState.
 */
function spaGithubPagesPlugin(basePath: string): Plugin {
  const segments = pathSegmentsToKeep(basePath);

  const restoreScript = `
    <script type="text/javascript">
      (function(l) {
        if (l.search[1] === '/') {
          var decoded = l.search.slice(1).split('&').map(function(s) {
            return s.replace(/~and~/g, '&');
          }).join('?');
          window.history.replaceState(null, null,
            l.pathname.slice(0, -1) + decoded + l.hash
          );
        }
      }(window.location));
    </script>`;

  const redirect404 = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Redirecting…</title>
    <script type="text/javascript">
      var pathSegmentsToKeep = ${segments};
      var l = window.location;
      l.replace(
        l.protocol + '//' + l.hostname + (l.port ? ':' + l.port : '') +
        l.pathname.split('/').slice(0, 1 + pathSegmentsToKeep).join('/') + '/?/' +
        l.pathname.slice(1).split('/').slice(pathSegmentsToKeep).join('/').replace(/&/g, '~and~') +
        (l.search ? '&' + l.search.slice(1).replace(/&/g, '~and~') : '') +
        l.hash
      );
    </script>
  </head>
  <body></body>
</html>`;

  return {
    name: 'spa-github-pages',
    transformIndexHtml(html) {
      return html.replace('<head>', `<head>${restoreScript}`);
    },
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: '404.html',
        source: redirect404,
      });
    },
  };
}

function appleAppSiteAssociationPlugin(basePath: string): Plugin {
  const paths = [
    appLinkPath(basePath, 'post/*'),
    appLinkPath(basePath, 'profile/*'),
    appLinkPath(basePath, 'challenge/*'),
    appLinkPath(basePath, 'challenges/*'),
    appLinkPath(basePath, 'challenge/join/*'),
    appLinkPath(basePath, 'invite/*'),
    appLinkPath(basePath, 'club/*/invite/*'),
  ];

  const content = JSON.stringify(
    {
      applinks: {
        apps: [],
        details: [{ appID: IOS_APP_ID, paths }],
      },
    },
    null,
    2,
  );

  return {
    name: 'apple-app-site-association',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url?.split('?')[0] === '/.well-known/apple-app-site-association') {
          res.setHeader('Content-Type', 'application/json');
          res.end(content);
          return;
        }
        next();
      });
    },
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: '.well-known/apple-app-site-association',
        source: content,
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const base = env.VITE_BASE_PATH ?? '/slumber-web/';
  const basePath = base.replace(/\/$/, '');
  const siteUrl = (env.VITE_SITE_URL ?? DEFAULT_SITE_URL).replace(/\/$/, '');

  return {
    base,
    plugins: [
      react(),
      spaGithubPagesPlugin(basePath),
      appleAppSiteAssociationPlugin(basePath),
      {
        name: 'html-site-url',
        transformIndexHtml(html) {
          return html.replaceAll('__SITE_URL__', siteUrl);
        },
      },
    ],
  };
});
