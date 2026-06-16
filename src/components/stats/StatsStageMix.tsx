import { stageColor } from '../../lib/stageColors';

type Props = {
  deepPct: number | null;
  remPct: number | null;
  corePct: number | null;
  periodLabel?: string;
};

export default function StatsStageMix({
  deepPct,
  remPct,
  corePct,
  periodLabel = '30 days',
}: Props) {
  const stages = [
    { key: 'deep' as const, label: 'Deep', pct: deepPct },
    { key: 'rem' as const, label: 'REM', pct: remPct },
    { key: 'core' as const, label: 'Core', pct: corePct },
  ].filter((s) => s.pct != null && s.pct > 0);

  if (stages.length === 0) return null;

  const total = stages.reduce((s, st) => s + (st.pct ?? 0), 0);

  return (
    <div className="stats-card stats-stage-mix">
      <div className="stats-card-header">
        <h3 className="stats-card-title">Stage mix</h3>
        <span className="stats-card-subtitle">{periodLabel}</span>
      </div>

      <div className="stats-stage-stacked">
        {stages.map((s) => (
          <div
            key={s.key}
            className="stats-stage-segment"
            style={{ flex: s.pct ?? 0, backgroundColor: stageColor(s.key) }}
          />
        ))}
      </div>

      <div className="stats-stage-rows">
        {stages.map((s) => (
          <div key={s.key} className="stats-stage-row">
            <span className="stats-stage-dot" style={{ backgroundColor: stageColor(s.key) }} />
            <span className="stats-stage-label">{s.label}</span>
            <div className="stats-stage-bar-track">
              <div
                className="stats-stage-bar-fill"
                style={{
                  backgroundColor: stageColor(s.key),
                  width: total > 0 ? `${Math.round(((s.pct ?? 0) / total) * 100)}%` : '0%',
                }}
              />
            </div>
            <span className="stats-stage-pct">{s.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
