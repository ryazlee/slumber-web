import { getSiteUrl } from './siteUrl';

/** Supabase `emailRedirectTo` target for web magic links — add to Auth redirect URLs. */
export function getAuthCallbackUrl(): string {
  return `${getSiteUrl()}/login-callback`;
}
