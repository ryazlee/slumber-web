import { Link } from 'react-router-dom';
import type { PR } from '../../lib/statsTypes';
import { formatSleepDate } from '../../lib/format';

type PrItem = {
  emoji: string;
  label: string;
  pr: PR;
  format: (v: number) => string;
};

type Props = {
  items: PrItem[];
};

export default function StatsPrStrip({ items }: Props) {
  const visible = items.filter((i) => i.pr?.value);
  if (!visible.length) return null;

  return (
    <div className="stats-card stats-pr-strip">
      <div className="stats-pr-grid">
        {visible.map((item) => {
          const content = (
            <>
              <span className="stats-pr-emoji" aria-hidden>{item.emoji}</span>
              <span className="stats-pr-value">{item.format(item.pr!.value)}</span>
              <span className="stats-pr-label">{item.label}</span>
              {item.pr?.date ? (
                <span className="stats-pr-date">{formatSleepDate(item.pr.date.split('T')[0])}</span>
              ) : null}
            </>
          );

          if (item.pr?.postId) {
            return (
              <Link key={item.label} to={`/post/${item.pr.postId}`} className="stats-pr-tile stats-pr-tile--link">
                {content}
              </Link>
            );
          }

          return (
            <div key={item.label} className="stats-pr-tile">
              {content}
            </div>
          );
        })}
      </div>
    </div>
  );
}
