import type { StatsMetric } from '../../lib/statsTypes';

type Props = {
  title?: string;
  metrics: StatsMetric[];
  embedded?: boolean;
  variant?: 'tiles' | 'list';
};

export default function StatsPeriodMetrics({
  title = 'Last 30 days',
  metrics,
  embedded = false,
  variant = 'tiles',
}: Props) {
  const visible = metrics.filter((m) => m.value !== '—');
  if (!visible.length) return null;

  const body = variant === 'list' ? (
    <div className="stats-metric-list">
      {visible.map((m) => (
        <div key={m.label} className="stats-metric-row">
          <span>{m.label}</span>
          <span style={m.accent ? { color: m.accent } : undefined}>{m.value}</span>
        </div>
      ))}
    </div>
  ) : (
    <div className="stats-metric-grid">
      {visible.map((m) => (
        <div key={m.label} className="stats-metric-tile">
          <span className="stats-metric-value" style={m.accent ? { color: m.accent } : undefined}>
            {m.value}
          </span>
          <span className="stats-metric-label">{m.label}</span>
        </div>
      ))}
    </div>
  );

  if (embedded) return body;

  return (
    <section className="stats-section">
      <h2 className="stats-section-label">{title}</h2>
      {body}
    </section>
  );
}
