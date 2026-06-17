import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

const DEFAULT_SITE_URL = 'https://ryazlee.github.io/slumber-web';
const IOS_APP_ID = 'L57M37HLYR.com.ryan.slumber';

function appLinkPath(basePath: string, route: string): string {
  const base = basePath.replace(/\/$/, '');
  return `${base}/${route}`.replace(/\/+/g, '/');
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
