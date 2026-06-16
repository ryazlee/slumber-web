import type { SleepPost } from '../lib/types';
import { PR_LABELS } from '../lib/pr';

type Props = {
  post: Pick<SleepPost, 'prTypes' | 'monthlyPrTypes' | 'isPR'>;
};

export default function PersonalRecordBadges({ post }: Props) {
  const allTime = post.prTypes ?? [];
  const monthly = post.monthlyPrTypes ?? [];

  if (!post.isPR && allTime.length === 0 && monthly.length === 0) return null;

  return (
    <div className="post-pr-badges">
      {allTime.map((type) => (
        <span key={`at-${type}`} className="post-pr-badge post-pr-badge--alltime">
          🏆 {PR_LABELS[type] ?? type}
        </span>
      ))}
      {monthly.map((type) => (
        <span key={`mo-${type}`} className="post-pr-badge post-pr-badge--monthly">
          🥇 Monthly {PR_LABELS[type] ?? type}
        </span>
      ))}
    </div>
  );
}
