import type { StatsMetric } from '../../lib/statsTypes';

type Props = {
  title?: string;
  metrics: StatsMetric[];
};

export default function StatsPeriodMetrics({ title = 'Last 30 days', metrics }: Props) {
  const visible = metrics.filter((m) => m.value !== '—');
  if (!visible.length) return null;

  return (
    <section className="stats-section">
      <h2 className="stats-section-label">{title}</h2>
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
    </section>
  );
}
