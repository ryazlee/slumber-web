import { dreamLogPrefix } from '../../lib/sleepPostMeta';
import type { DreamMood } from '../../lib/types';

type Props = {
  dreamLog: string;
  dreamMood?: DreamMood;
  canReadDream: boolean;
  blurDream: boolean;
  isOwnPost: boolean;
};

export default function PostDreamBlock({ dreamLog, dreamMood, canReadDream, blurDream, isOwnPost }: Props) {
  if (!dreamLog) return null;

  return (
    <div className="post-dream">
      {canReadDream ? (
        <>
          {blurDream && isOwnPost ? (
            <span className="post-dream-badge">Private dream</span>
          ) : null}
          <p className="post-dream-text">
            <span className="post-dream-icon" aria-hidden>{dreamLogPrefix(dreamMood).trim() || '💭'}</span>
            {dreamLog}
          </p>
        </>
      ) : (
        <div className="post-dream-private">
          <span className="post-dream-badge">Private dream</span>
          <p className="post-dream-hint">Dream logged (only they can read it)</p>
        </div>
      )}
    </div>
  );
}
