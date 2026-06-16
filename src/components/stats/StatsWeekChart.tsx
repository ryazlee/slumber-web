import { Link } from 'react-router-dom';
import type { SleepPost } from '../../lib/types';
import { dominantStageColor } from '../../lib/stageColors';
import { weekChartNights } from '../../lib/statsInsights';
import { formatMins } from '../../lib/format';

const BAR_MAX = 56;

type Props = {
  posts: SleepPost[];
};

export default function StatsWeekChart({ posts }: Props) {
  const nights = weekChartNights(posts);
  const logged = nights.filter((n) => n.post);
  const maxMins = Math.max(...logged.map((n) => n.post!.asleepMinutes), 1);

  return (
    <div className="stats-card stats-week-chart">
      <div className="stats-card-header">
        <h3 className="stats-card-title">Last 7 Nights</h3>
        <span className="stats-card-subtitle">{logged.length}/{nights.length} logged</span>
      </div>

      <div className="stats-week-bars">
        {nights.map(({ dateISO, post }) => {
          const initial = new Date(`${dateISO}T12:00:00`)
            .toLocaleDateString('en-US', { weekday: 'narrow' });
          const asleep = post?.asleepMinutes ?? 0;
          const barH = asleep > 0
            ? Math.max(6, Math.round((asleep / maxMins) * BAR_MAX))
            : 4;
          const color = post
            ? dominantStageColor({
              asleepMinutes: post.asleepMinutes,
              deepMinutes: post.deepMinutes,
              remMinutes: post.remMinutes,
              coreMinutes: post.coreMinutes,
            })
            : 'var(--border)';

          const bar = (
            <div className="stats-week-col">
              <div className="stats-week-track" style={{ height: BAR_MAX }}>
                <div
                  className="stats-week-fill"
                  style={{
                    height: barH,
                    backgroundColor: post ? color : 'var(--surface)',
                    opacity: post ? 1 : 0.4,
                  }}
                />
              </div>
              <span className="stats-week-day">{initial}</span>
              {post ? <span className="stats-week-mins">{formatMins(asleep)}</span> : null}
            </div>
          );

          if (!post) {
            return <div key={dateISO} className="stats-week-bar-wrap">{bar}</div>;
          }

          return (
            <Link key={dateISO} to={`/post/${post.id}`} className="stats-week-bar-wrap stats-week-bar-link">
              {bar}
            </Link>
          );
        })}
      </div>

      <p className="stats-week-hint">Tap a bar to open that night</p>
    </div>
  );
}
