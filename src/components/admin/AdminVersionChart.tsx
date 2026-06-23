import type { AppVersionRow } from '../../lib/admin';
import { formatNumber } from './format';

type Props = {
  versions: AppVersionRow[];
  title?: string;
};

export default function AdminVersionChart({ versions, title = 'App version adoption' }: Props) {
  const reported = versions.reduce((sum, row) => sum + row.user_count, 0);
  const max = Math.max(1, ...versions.map((row) => row.user_count));
  const top = versions.slice(0, 8);

  if (top.length === 0) {
    return (
      <section className="admin-chart-card">
        <h3 className="admin-chart-title">{title}</h3>
        <p className="admin-muted">No version data reported yet.</p>
      </section>
    );
  }

  return (
    <section className="admin-chart-card admin-version-chart">
      <div className="admin-chart-header">
        <h3 className="admin-chart-title">{title}</h3>
        <p className="admin-chart-hover-summary admin-chart-hover-summary--hint">
          {formatNumber(reported)} users with a reported version
        </p>
      </div>
      <ul className="admin-version-list">
        {top.map((row) => {
          const pct = reported > 0 ? Math.round((row.user_count / reported) * 1000) / 10 : 0;
          return (
            <li key={row.version} className="admin-version-row">
              <span className="admin-version-label">v{row.version}</span>
              <span className="admin-version-bar-wrap">
                <span
                  className="admin-version-bar"
                  style={{ width: `${Math.max(6, (row.user_count / max) * 100)}%` }}
                />
              </span>
              <span className="admin-version-count">
                {formatNumber(row.user_count)}
                <span className="admin-version-pct">{pct}%</span>
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
