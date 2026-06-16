/** Feed-optimized URL when available; detail view uses full-size. */
export function postPhotoDisplayUrl(
  post: { photoUrls?: string[]; photoThumbUrls?: string[] },
  index: number,
  variant: 'feed' | 'full',
): string | undefined {
  const full = post.photoUrls?.[index];
  if (!full) return undefined;
  if (variant === 'full') return full;
  return post.photoThumbUrls?.[index] ?? full;
}
