import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { build404Html, buildIndexRestoreScript } from './lib/spaShellScripts';

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
    <script type="text/javascript">${buildIndexRestoreScript()}</script>`;

  return {
    name: 'spa-github-pages',
    transformIndexHtml(html) {
      return html.replace('<head>', `<head>${restoreScript}`);
    },
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: '404.html',
        source: build404Html(segments),
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
