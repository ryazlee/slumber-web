import type { ReactNode } from 'react';
import { formatNumber } from './format';

type Props = {
  label: string;
  value: number | string;
  sub?: ReactNode;
};

export default function AdminMetricCard({ label, value, sub }: Props) {
  return (
    <div className="admin-metric-card">
      <p className="admin-metric-label">{label}</p>
      <p className="admin-metric-value">
        {typeof value === 'number' ? formatNumber(value) : value}
      </p>
      {sub ? <p className="admin-metric-sub">{sub}</p> : null}
    </div>
  );
}
