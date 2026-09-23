import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { formatDelta, formatDeltaPercent, formatNumber } from './format';

type Props = {
  label: string;
  value: number | string;
  sub?: ReactNode;
  /** When set, the whole card navigates to this admin page. */
  to?: string;
  /** Current minus previous period. Hidden when null. */
  delta?: number | null;
  /** Prior-period value, used for a percent change. */
  previous?: number;
  deltaLabel?: string;
  /** When true, an increase is shown as negative (e.g. never posted). */
  invertDelta?: boolean;
  /** Short change, without the comparison phrase. Flat changes omit the percent. */
  compactDelta?: boolean;
};

export default function AdminMetricCard({
  label,
  value,
  sub,
  to,
  delta,
  previous,
  deltaLabel,
  invertDelta = false,
  compactDelta = false,
}: Props) {
  const showDelta = delta != null;
  const deltaClass = !showDelta || delta === 0
    ? 'admin-metric-delta--flat'
    : (invertDelta ? delta > 0 : delta < 0)
      ? 'admin-metric-delta--down'
      : 'admin-metric-delta--up';
  const rawPct = showDelta && previous != null && !(compactDelta && delta === 0)
    ? formatDeltaPercent(typeof value === 'number' ? value : 0, previous)
    : null;
  const pct = rawPct?.replace(/^-/, '−') ?? null;
  const deltaText = !showDelta
    ? ''
    : compactDelta
      ? [formatDelta(delta), pct].filter(Boolean).join(' · ')
      : `${formatDelta(delta)}${pct ? ` (${pct})` : ''}${deltaLabel ? ` ${deltaLabel}` : ''}`;

  const body = (
    <>
      <p className="admin-metric-label">{label}</p>
      <p className="admin-metric-value">
        {typeof value === 'number' ? formatNumber(value) : value}
      </p>
      {showDelta ? (
        <p className={`admin-metric-delta ${deltaClass}`}>{deltaText}</p>
      ) : null}
      {sub ? <p className="admin-metric-sub">{sub}</p> : null}
    </>
  );

  if (to) {
    return (
      <Link to={to} className="admin-metric-card admin-metric-card--link">
        {body}
      </Link>
    );
  }

  return <div className="admin-metric-card">{body}</div>;
}
