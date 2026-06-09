import { useEffect, useState } from 'react';
import { resolveCachedImageUrl } from '../lib/imageCache';

export function useCachedImage(url?: string): string | undefined {
  const [src, setSrc] = useState<string | undefined>(url);

  useEffect(() => {
    if (!url) {
      setSrc(undefined);
      return;
    }

    let cancelled = false;
    setSrc(url);

    resolveCachedImageUrl(url).then((resolved) => {
      if (!cancelled) setSrc(resolved);
    });

    return () => { cancelled = true; };
  }, [url]);

  return src;
}
