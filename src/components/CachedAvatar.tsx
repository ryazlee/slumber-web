import type { CSSProperties, ReactNode } from 'react';
import { useCachedImage } from '../hooks/useCachedImage';

type CachedAvatarProps = {
  url?: string;
  username: string;
  className?: string;
  style?: CSSProperties;
  fallback?: ReactNode;
};

export default function CachedAvatar({
  url,
  username,
  className,
  style,
  fallback,
}: CachedAvatarProps) {
  const src = useCachedImage(url);
  const initials = username.slice(0, 2).toUpperCase();

  if (!url || !src) {
    return (
      <span className={className} style={style}>
        {fallback ?? initials}
      </span>
    );
  }

  return (
    <span className={className} style={style}>
      <img src={src} alt="" loading="lazy" decoding="async" />
    </span>
  );
}
