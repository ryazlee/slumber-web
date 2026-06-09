import type { SleepPost } from '../lib/types';
import { formatMins } from '../lib/format';

type Props = {
  post: Pick<SleepPost, 'asleepMinutes' | 'bedtime' | 'wakeTime'>;
};

const hasTime = (value?: string | null): boolean => Boolean(value && value !== '—');

export default function ManualLogSleepBlock({ post }: Props) {
  const hasBedtime = hasTime(post.bedtime);
  const hasWake = hasTime(post.wakeTime);
  const hasDuration = post.asleepMinutes > 0;

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
        <p className="manual-sleep-duration">{formatMins(post.asleepMinutes)}</p>
      )}
      {timeLine && <p className="manual-sleep-times">{timeLine}</p>}
      <p className="manual-sleep-footnote">Not counted in challenges or stats</p>
    </div>
  );
}
