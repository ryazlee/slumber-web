const DEFAULT_SITE = 'https://ryazlee.github.io/slumber-web';

export function getSiteUrl(): string {
  const explicit = import.meta.env.VITE_SITE_URL?.trim();
  return (explicit || DEFAULT_SITE).replace(/\/$/, '');
}

export function getOgImageUrl(): string {
  return `${getSiteUrl()}/og-image.png`;
}

export function getLinkPreviewBaseUrl(): string {
  const explicit = import.meta.env.VITE_LINK_PREVIEW_BASE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, '');

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
  if (supabaseUrl) {
    return `${supabaseUrl.replace(/\/$/, '')}/functions/v1/link-preview`;
  }

  return getSiteUrl();
}

function previewPath(path: string): string {
  const base = getLinkPreviewBaseUrl();
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalized}`;
}

export function buildPostShareUrl(postId: string): string {
  return previewPath(`/post/${postId}`);
}

export function buildProfileShareUrl(userId: string): string {
  return previewPath(`/profile/${userId}`);
}

export function buildChallengeShareUrl(challengeId: string): string {
  return previewPath(`/challenge/${challengeId}`);
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
