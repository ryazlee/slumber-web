/** Default public site URL — keep in sync with `lib/webBaseUrl.ts` `DEFAULT_WEB_BASE_URL`. */
export const DEFAULT_SITE_URL = 'https://ryazlee.github.io/slumber-web';

function trimTrailingSlash(url: string): string {
  return url.replace(/\/$/, '');
}

/** Canonical site root (Open Graph, share meta). Set `VITE_SITE_URL` when the domain changes. */
export function getSiteUrl(): string {
  const explicit = import.meta.env.VITE_SITE_URL?.trim();
  return trimTrailingSlash(explicit || DEFAULT_SITE_URL);
}

/**
 * Deploy path prefix (`/` for custom domain root, `/slumber-web` on GitHub Pages).
 * Prefer `VITE_BASE_PATH`; otherwise derive from `VITE_SITE_URL`.
 */
export function getWebBasePath(): string {
  const fromBase = import.meta.env.VITE_BASE_PATH?.trim();
  if (fromBase) {
    const normalized = fromBase.replace(/\/$/, '');
    return normalized === '/' ? '' : normalized;
  }

  try {
    const pathname = new URL(getSiteUrl()).pathname.replace(/\/$/, '');
    return pathname === '/' ? '' : pathname;
  } catch {
    return '/slumber-web';
  }
}

/** Strip deploy base path before parsing app deep-link routes. */
export function normalizeWebAppPath(pathname: string): string {
  let path = pathname;
  if (!path.startsWith('/')) path = `/${path}`;

  const basePath = getWebBasePath();
  if (basePath) {
    if (path === basePath || path === `${basePath}/`) {
      path = '/';
    } else if (path.startsWith(`${basePath}/`)) {
      path = path.slice(basePath.length);
    }
  }

  return path.replace(/\/+$/, '') || '/';
}

export function formatMins(mins: number): string {
  const total = Math.max(0, Math.round(mins));
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

export function formatSleepDate(dateISO: string): string {
  const [year, month, day] = dateISO.split('-').map(Number);
  if (!year || !month || !day) return dateISO;
  const date = new Date(Date.UTC(year, month - 1, day, 12));
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}
