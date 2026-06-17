import { useEffect } from 'react';

export type DocumentMeta = {
  title: string;
  description?: string;
  image?: string;
  url?: string;
};

function setMetaTag(attr: 'name' | 'property', key: string, content: string): void {
  let el = document.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

/** Update document title and Open Graph tags (helps browsers; crawlers need server-side OG). */
export function useDocumentMeta(meta: DocumentMeta | null): void {
  useEffect(() => {
    if (!meta) return;

    document.title = meta.title;

    if (meta.description) {
      setMetaTag('name', 'description', meta.description);
      setMetaTag('property', 'og:description', meta.description);
      setMetaTag('name', 'twitter:description', meta.description);
    }

    setMetaTag('property', 'og:title', meta.title);
    setMetaTag('name', 'twitter:title', meta.title);
    setMetaTag('property', 'og:site_name', 'Slumber');
    setMetaTag('property', 'og:type', 'website');

    if (meta.url) {
      setMetaTag('property', 'og:url', meta.url);
    }

    if (meta.image) {
      setMetaTag('property', 'og:image', meta.image);
      setMetaTag('property', 'og:image:secure_url', meta.image);
      setMetaTag('property', 'og:image:type', 'image/png');
      setMetaTag('property', 'og:image:width', '1200');
      setMetaTag('property', 'og:image:height', '630');
      setMetaTag('name', 'twitter:image', meta.image);
      setMetaTag('name', 'twitter:card', 'summary_large_image');
    }
  }, [meta?.title, meta?.description, meta?.image, meta?.url]);
}
