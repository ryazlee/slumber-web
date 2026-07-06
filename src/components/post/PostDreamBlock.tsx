import ExpandableMentionText from '../ExpandableMentionText';
import MentionText from '../MentionText';
import { DREAM_MOOD_CONFIG, dreamLogPrefix, dreamMoodColor } from '../../lib/sleepPostMeta';
import type { DreamMood } from '../../lib/types';

type Props = {
  dreamLog: string;
  dreamMood?: DreamMood;
  canReadDream: boolean;
  blurDream: boolean;
  isOwnPost: boolean;
  variant?: 'feed' | 'detail';
};

export default function PostDreamBlock({
  dreamLog,
  dreamMood,
  canReadDream,
  blurDream,
  isOwnPost,
  variant = 'feed',
}: Props) {
  if (!dreamLog) return null;

  const moodMeta = dreamMood ? DREAM_MOOD_CONFIG[dreamMood] : undefined;
  const showMoodLabel = variant === 'detail' && canReadDream && moodMeta && dreamMood;
  const prefix = dreamLogPrefix(dreamMood);

  return (
    <div className="post-dream">
      {canReadDream ? (
        <>
          {blurDream && isOwnPost ? (
            <span className="post-dream-badge">Private dream</span>
          ) : null}
          {showMoodLabel ? (
            <p className="post-dream-mood" style={{ color: dreamMoodColor(dreamMood) }}>
              <span aria-hidden>{moodMeta.emoji}</span> {moodMeta.label}
            </p>
          ) : null}
          {variant === 'feed' ? (
            <ExpandableMentionText className="post-dream-text" prefix={prefix}>
              {dreamLog}
            </ExpandableMentionText>
          ) : (
            <p className="post-dream-text">
              {dreamMood ? null : (
                <span className="post-dream-icon" aria-hidden>💭 </span>
              )}
              <MentionText>{dreamLog}</MentionText>
            </p>
          )}
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
