import { useEffect, useState } from 'react';
import type { SleepPost } from '../lib/types';
import { postPhotoDisplayUrl } from '../lib/postPhotos';
import { resolveCachedImageUrl } from '../lib/imageCache';
import CachedImage from './CachedImage';

type Props = {
  post: Pick<SleepPost, 'photoUrls' | 'photoThumbUrls'>;
  variant: 'feed' | 'detail';
};

export default function PostPhotoGallery({ post, variant }: Props) {
  const urls = post.photoUrls ?? [];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    for (let i = 0; i < urls.length; i += 1) {
      const url = postPhotoDisplayUrl(post, i, variant === 'feed' ? 'feed' : 'full');
      if (url) void resolveCachedImageUrl(url);
    }
  }, [urls.join('|'), variant]);

  if (!urls.length) return null;

  const showDots = urls.length > 1;

  if (variant === 'feed' && urls.length === 1) {
    const src = postPhotoDisplayUrl(post, 0, 'feed');
    if (!src) return null;
    return (
      <div className="post-photos post-photos--feed">
        <CachedImage url={src} alt="" className="post-photo post-photo--single" />
      </div>
    );
  }

  return (
    <div className={`post-photos post-photos--${variant}`}>
      <div
        className="post-photo-track"
        onScroll={(e) => {
          const el = e.currentTarget;
          const width = el.clientWidth || 1;
          setIndex(Math.round(el.scrollLeft / width));
        }}
      >
        {urls.map((_, i) => {
          const src = postPhotoDisplayUrl(post, i, variant === 'feed' ? 'feed' : 'full');
          if (!src) return null;
          return (
            <CachedImage
              key={`${src}-${i}`}
              url={src}
              alt=""
              className="post-photo post-photo--slide"
            />
          );
        })}
      </div>
      {showDots ? (
        <div className="post-photo-dots" aria-hidden>
          {urls.map((_, i) => (
            <span key={i} className={`post-photo-dot${i === index ? ' post-photo-dot--active' : ''}`} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
