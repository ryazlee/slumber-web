import type { InsightChip } from '../../lib/statsTypes';

type Props = {
  insights: InsightChip[];
};

export default function StatsInsightChips({ insights }: Props) {
  const visible = insights.filter(Boolean);
  if (!visible.length) return null;

  return (
    <div className="stats-insight-row" role="list">
      {visible.map((chip, i) => (
        <div key={`${chip.label}-${i}`} className="stats-insight-chip" role="listitem">
          <span className="stats-insight-emoji" aria-hidden>{chip.emoji}</span>
          <div className="stats-insight-text">
            <span className="stats-insight-label">{chip.label}</span>
            {chip.detail ? <span className="stats-insight-detail">{chip.detail}</span> : null}
          </div>
        </div>
      ))}
    </div>
  );
}
