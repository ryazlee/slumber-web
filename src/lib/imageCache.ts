const CACHE_NAME = 'slumber-images-v1';
const memory = new Map<string, string>();

export function isCacheableImageUrl(url: string): boolean {
  try {
    const { hostname, pathname, protocol } = new URL(url);
    return protocol === 'https:'
      && hostname.endsWith('.supabase.co')
      && pathname.startsWith('/storage/v1/object/');
  } catch {
    return false;
  }
}

/**
 * Resolve a remote image URL to a blob URL, using the Cache API when available.
 * Repeat loads skip Supabase egress when the browser already has the bytes.
 */
export async function resolveCachedImageUrl(url: string): Promise<string> {
  if (!isCacheableImageUrl(url)) return url;

  const existing = memory.get(url);
  if (existing) return existing;

  if (typeof caches === 'undefined') return url;

  try {
    const cache = await caches.open(CACHE_NAME);
    let response = await cache.match(url);

    if (!response) {
      response = await fetch(url, { mode: 'cors', credentials: 'omit' });
      if (response.ok) {
        await cache.put(url, response.clone());
      }
    }

    if (!response?.ok) return url;

    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    memory.set(url, blobUrl);
    return blobUrl;
  } catch {
    return url;
  }
}
