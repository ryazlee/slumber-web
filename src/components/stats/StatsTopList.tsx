import { Link } from 'react-router-dom';
import type { TopNight } from '../../lib/statsTypes';
import { formatMins, formatSleepDate } from '../../lib/format';

type Props = {
  title: string;
  emoji: string;
  nights: TopNight[];
  valueKey: keyof TopNight;
  accentColor: string;
};

export default function StatsTopList({
  title,
  emoji,
  nights,
  valueKey,
  accentColor,
}: Props) {
  if (!nights.length || nights.every((n) => (n[valueKey] as number) === 0)) return null;

  return (
    <div className="stats-card stats-top-list">
      <div className="stats-top-list-header">
        <span className="stats-top-list-emoji" aria-hidden>{emoji}</span>
        <h3 className="stats-top-list-title">{title}</h3>
      </div>
      <ul className="stats-top-list-rows">
        {nights.map((n, i) => (
          <li key={n.sleepDate + i} className="stats-top-list-row">
            <span
              className="stats-top-list-rank"
              style={{ color: i === 0 ? accentColor : 'var(--text-dim)' }}
            >
              #{i + 1}
            </span>
            <div className="stats-top-list-meta">
              <span className="stats-top-list-date">{formatSleepDate(n.sleepDate)}</span>
              {n.deepMinutes > 0 ? (
                <span className="stats-top-list-sub">{formatMins(n.deepMinutes)} deep</span>
              ) : null}
            </div>
            <span
              className="stats-top-list-value"
              style={{ color: i === 0 ? accentColor : 'var(--text)' }}
            >
              {formatMins(n[valueKey] as number)}
            </span>
            <Link to={`/post/${n.postId}`} className="stats-top-list-link" aria-label="Open post">
              ↗
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
