import type { Vibe } from '../../lib/types';
import { vibeColor, vibeMeta } from '../../lib/sleepPostMeta';

type Props = {
  vibe: Vibe;
  showLabel?: boolean;
  className?: string;
};

export default function PostVibe({ vibe, showLabel = false, className = '' }: Props) {
  const meta = vibeMeta(vibe);
  if (!meta) return null;

  return (
    <div className={`post-vibe${className ? ` ${className}` : ''}`} style={{ color: vibeColor(vibe) }}>
      <span className="post-vibe-emoji" aria-hidden>{meta.emoji}</span>
      {showLabel ? <span className="post-vibe-label">{meta.label}</span> : null}
    </div>
  );
}
