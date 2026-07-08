import ExpandableMentionText from '../ExpandableMentionText';
import MentionText from '../MentionText';
import PrivateDreamMentionHint from '../PrivateDreamMentionHint';
import { extractMentionUsernames } from '../../lib/mentions';
import { DREAM_MOOD_CONFIG, dreamLogPrefix, dreamMoodColor } from '../../lib/sleepPostMeta';
import type { DreamMood } from '../../lib/types';

type Props = {
  dreamLog: string;
  dreamMood?: DreamMood;
  canReadDream: boolean;
  blurDream: boolean;
  isOwnPost: boolean;
  variant?: 'feed' | 'detail';
  onMentionPress?: (username: string) => void;
};

export default function PostDreamBlock({
  dreamLog,
  dreamMood,
  canReadDream,
  blurDream,
  isOwnPost,
  variant = 'feed',
  onMentionPress,
}: Props) {
  if (!dreamLog) return null;

  const moodMeta = dreamMood ? DREAM_MOOD_CONFIG[dreamMood] : undefined;
  const showMoodLabel = variant === 'detail' && canReadDream && moodMeta && dreamMood;
  const prefix = dreamLogPrefix(dreamMood);
  const dreamMentionUsernames = extractMentionUsernames(dreamLog);

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
            <ExpandableMentionText className="post-dream-text" prefix={prefix} onMentionPress={onMentionPress}>
              {dreamLog}
            </ExpandableMentionText>
          ) : (
            <p className="post-dream-text">
              {dreamMood ? null : (
                <span className="post-dream-icon" aria-hidden>💭 </span>
              )}
              <MentionText onMentionPress={onMentionPress}>{dreamLog}</MentionText>
            </p>
          )}
        </>
      ) : (
        <div className="post-dream-private">
          <span className="post-dream-badge">Private dream</span>
          {dreamMentionUsernames.length > 0 ? (
            <PrivateDreamMentionHint
              usernames={dreamMentionUsernames}
              onMentionPress={onMentionPress}
            />
          ) : (
            <p className="post-dream-hint">Dream logged (only they can read it)</p>
          )}
        </div>
      )}
    </div>
  );
}
