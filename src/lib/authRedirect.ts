import { getSiteUrl } from './siteUrl';

/**
 * Supabase OAuth / magic-link callback URL.
 * Prefer the live browser origin so redirects match useslumber.com vs GitHub Pages.
 * Add every variant to Supabase Auth → Redirect URLs.
 */
export function getAuthCallbackUrl(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin.replace(/\/$/, '')}/login-callback`;
  }
  return `${getSiteUrl()}/login-callback`;
}
