import type { CohortRetentionRow } from '../../lib/admin';

type Props = {
  rows: CohortRetentionRow[];
  title?: string;
};

function formatWeekLabel(weekStart: string): string {
  const d = new Date(`${weekStart.slice(0, 10)}T12:00:00`);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function AdminCohortChart({
  rows,
  title = 'Signup cohort retention (week +2)',
}: Props) {
  if (rows.length === 0) {
    return (
      <section className="admin-chart-card">
        <h3 className="admin-chart-title">{title}</h3>
        <p className="admin-muted">Not enough signup history yet.</p>
      </section>
    );
  }

  const maxPct = Math.max(1, ...rows.map((row) => row.retention_week_2_pct));

  return (
    <section className="admin-chart-card admin-cohort-chart">
      <div className="admin-chart-header">
        <h3 className="admin-chart-title">{title}</h3>
        <p className="admin-chart-hover-summary admin-chart-hover-summary--hint">
          % of each signup week who posted again 2 weeks later
        </p>
      </div>
      <ul className="admin-cohort-list">
        {rows.map((row) => (
          <li key={row.week_start} className="admin-cohort-row">
            <span className="admin-cohort-label">{formatWeekLabel(row.week_start)}</span>
            <span className="admin-cohort-bar-wrap">
              <span
                className="admin-cohort-bar"
                style={{ width: `${Math.max(4, (row.retention_week_2_pct / maxPct) * 100)}%` }}
              />
            </span>
            <span className="admin-cohort-meta">
              <strong>{row.retention_week_2_pct}%</strong>
              <span className="admin-cohort-sub">
                {row.posted_week_2}/{row.signups}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
