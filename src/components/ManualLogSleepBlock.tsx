import type { SleepPost } from '../lib/types';
import { formatMins } from '../lib/format';
import PostVibe from './post/PostVibe';

type Props = {
  post: Pick<SleepPost, 'asleepMinutes' | 'bedtime' | 'wakeTime' | 'vibe'>;
  variant?: 'card' | 'detail';
};

const hasTime = (value?: string | null): boolean => Boolean(value && value !== '—');

export default function ManualLogSleepBlock({ post, variant = 'card' }: Props) {
  const hasBedtime = hasTime(post.bedtime);
  const hasWake = hasTime(post.wakeTime);
  const hasDuration = post.asleepMinutes > 0;
  const isDetail = variant === 'detail';

  const timeLine = hasBedtime && hasWake
    ? `${post.bedtime} → ${post.wakeTime}`
    : hasBedtime
      ? `Bed ${post.bedtime}`
      : hasWake
        ? `Wake ${post.wakeTime}`
        : null;

  return (
    <div className="manual-sleep-block">
      <p className="manual-sleep-label">Manual log</p>
      {hasDuration && (
        <div className="manual-sleep-duration-row">
          <p className={`manual-sleep-duration${isDetail ? ' manual-sleep-duration--detail' : ''}`}>
            {formatMins(post.asleepMinutes)}
          </p>
          {post.vibe ? <PostVibe vibe={post.vibe} showLabel={isDetail} /> : null}
        </div>
      )}
      {timeLine && <p className="manual-sleep-times">{timeLine}</p>}
      <p className="manual-sleep-footnote">For the feed only. Stats and challenges sit this one out!</p>
    </div>
  );
}
