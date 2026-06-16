import { formatMins } from '../../lib/format';
import type { SleepPost } from '../../lib/types';

type Props = {
  post: SleepPost;
  variant?: 'inline' | 'section';
};

export default function PostDetailMetrics({ post, variant = 'section' }: Props) {
  const className = variant === 'inline'
    ? 'post-detail-metrics post-detail-metrics--inline'
    : 'post-detail-metrics';

  return (
    <dl className={className}>
      <div className="post-detail-metric">
        <dt>In bed</dt>
        <dd>{formatMins(post.inBedMinutes)}</dd>
      </div>
      <div className="post-detail-metric">
        <dt>Asleep</dt>
        <dd>{formatMins(post.asleepMinutes)}</dd>
      </div>
      {post.awakeEvents > 0 ? (
        <div className={`post-detail-metric${variant === 'section' ? ' post-detail-metric--awake' : ''}`}>
          <dt>Wakes</dt>
          <dd>{post.awakeEvents}</dd>
        </div>
      ) : null}
      <div className="post-detail-metric">
        <dt>Device</dt>
        <dd className={variant === 'section' ? 'post-detail-metric-device' : undefined}>
          {post.sourceDevice || '—'}
        </dd>
      </div>
    </dl>
  );
}
