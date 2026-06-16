import { formatCompareStat, type CompareMetricDef } from '../../lib/compareMetrics';
import type { PeriodStats } from '../../lib/compareStats';

type Props = {
  metric: CompareMetricDef;
  stats: PeriodStats | null;
  isLoading: boolean;
  isLeader: boolean;
};

export default function CompareValue({ metric, stats, isLoading, isLeader }: Props) {
  const value = isLoading ? '…' : formatCompareStat(metric, stats);
  const showLeader = isLeader && value !== '—' && value !== '…';

  return (
    <span className={`compare-cell-value${showLeader ? ' compare-cell-value--best' : ''}`}>
      {value}
    </span>
  );
}
