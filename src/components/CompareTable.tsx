import { useMemo, type CSSProperties } from 'react';
import CompareDesktopTable from './compare/CompareDesktopTable';
import CompareMobileCards from './compare/CompareMobileCards';
import { getCompareDensity } from './compare/compareDensity';
import {
  getCompareMetricLeaderIds,
  groupCompareMetricsByCategory,
  type CompareMetricDef,
} from '../lib/compareMetrics';
import { COMPARE_PERIOD_HEADLINE } from '../lib/comparePeriods';
import type { ComparePeriodKey } from '../lib/compareState';
import type { CompareParticipant } from '../lib/compareTypes';
import type { PeriodStats } from '../lib/compareStats';
import { useComparePeriodsBatch } from '../hooks/useCompare';

type Props = {
  participants: CompareParticipant[];
  period: ComparePeriodKey;
  metrics: CompareMetricDef[];
};

export type { CompareParticipant };

export default function CompareTable({ participants, period, metrics }: Props) {
  const periodQueries = useComparePeriodsBatch(participants.map((p) => p.id));

  const statsById = useMemo(() => {
    const map: Record<string, PeriodStats | null> = {};
    participants.forEach((p, i) => {
      map[p.id] = periodQueries[i]?.data?.[period] ?? null;
    });
    return map;
  }, [participants, period, periodQueries]);

  const leadersByMetricId = useMemo(() => {
    const map = new Map<string, Set<string>>();
    const allLoaded = periodQueries.length > 0 && periodQueries.every((q) => !q.isLoading);
    if (!allLoaded) return map;

    const ids = participants.map((p) => p.id);
    for (const m of metrics) {
      map.set(m.id, getCompareMetricLeaderIds(ids, statsById, m));
    }
    return map;
  }, [participants, metrics, statsById, periodQueries]);

  const metricGroups = useMemo(
    () => groupCompareMetricsByCategory(metrics),
    [metrics],
  );

  const anyLoading = periodQueries.some((q) => q.isLoading);
  const density = getCompareDensity(participants.length);
  const tableStyle = { '--compare-participant-count': participants.length } as CSSProperties;

  const tableProps = {
    metricGroups,
    participants,
    statsById,
    leadersByMetricId,
    anyLoading,
    density,
  };

  return (
    <div className={`compare-results compare-results--${density}`} style={tableStyle}>
      <header className="compare-results-head">
        <h2 className="compare-results-title">{COMPARE_PERIOD_HEADLINE[period]} averages</h2>
      </header>

      <CompareMobileCards {...tableProps} />
      <CompareDesktopTable {...tableProps} />
    </div>
  );
}
