import { useCachedImage } from '../hooks/useCachedImage';

type Props = {
  url?: string;
  alt?: string;
  className?: string;
};

export default function CachedImage({ url, alt = '', className }: Props) {
  const src = useCachedImage(url);

  if (!url || !src) return null;

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      decoding="async"
    />
  );
}
