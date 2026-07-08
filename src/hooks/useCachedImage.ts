import { useEffect, useState } from 'react';
import { getCachedImageUrlSync, resolveCachedImageUrl } from '../lib/imageCache';

export function useCachedImage(url?: string): string | undefined {
  const [src, setSrc] = useState<string | undefined>(() =>
    (url ? getCachedImageUrlSync(url) : undefined),
  );

  useEffect(() => {
    if (!url) {
      setSrc(undefined);
      return;
    }

    const cached = getCachedImageUrlSync(url);
    if (cached) {
      setSrc(cached);
      return;
    }

    let cancelled = false;

    resolveCachedImageUrl(url)
      .then((resolved) => {
        if (!cancelled) setSrc(resolved);
      })
      .catch(() => {
        if (!cancelled) setSrc(url);
      });

    return () => { cancelled = true; };
  }, [url]);

  return src;
}
