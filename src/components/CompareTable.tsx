import { useMemo, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import Avatar from './Avatar';
import {
  COMPARE_METRIC_CATEGORIES,
  formatCompareStat,
  getCompareMetricLeaderIds,
  type CompareMetricDef,
} from '../lib/compareMetrics';
import type { ComparePeriods, PeriodStats } from '../lib/compareStats';
import { useComparePeriodsBatch } from '../hooks/useCompare';

export type CompareParticipant = {
  id: string;
  username: string;
  isSelf: boolean;
};

type PeriodKey = keyof ComparePeriods;

type Props = {
  participants: CompareParticipant[];
  period: PeriodKey;
  metrics: CompareMetricDef[];
};

const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: 'today', label: 'Last night' },
  { key: 'week', label: '7d' },
  { key: 'month', label: '30d' },
  { key: 'allTime', label: 'All' },
];

const PERIOD_HEADLINE: Record<PeriodKey, string> = {
  today: 'Last night',
  week: 'Past 7 days',
  month: 'Past 30 days',
  allTime: 'All time',
};

export { PERIODS };

type CompareDensity = 'cozy' | 'compact' | 'dense';

function getCompareDensity(count: number): CompareDensity {
  if (count >= 6) return 'dense';
  if (count >= 4) return 'compact';
  return 'cozy';
}

function avatarSizeForDensity(density: CompareDensity): 'sm' | 'md' | 'lg' {
  if (density === 'dense') return 'sm';
  if (density === 'compact') return 'md';
  return 'lg';
}

function participantLabel(p: CompareParticipant, density: CompareDensity): string {
  if (p.isSelf) return 'You';
  const handle = `@${p.username}`;
  if (density === 'dense') {
    return p.username.length > 8 ? `@${p.username.slice(0, 7)}…` : handle;
  }
  if (density === 'compact' && p.username.length > 11) {
    return `@${p.username.slice(0, 10)}…`;
  }
  return handle;
}

function MetricLabel({ metric }: { metric: CompareMetricDef }) {
  return (
    <span className="compare-metric-label-inner">
      {metric.colorVar ? (
        <span
          className="compare-metric-dot compare-metric-dot--table"
          style={{ background: metric.colorVar }}
          aria-hidden
        />
      ) : null}
      <span>{metric.label}</span>
    </span>
  );
}

function CompareValue({
  metric,
  stats,
  isLoading,
  isLeader,
}: {
  metric: CompareMetricDef;
  stats: PeriodStats | null;
  isLoading: boolean;
  isLeader: boolean;
}) {
  const value = isLoading ? '…' : formatCompareStat(metric, stats);
  const showLeader = isLeader && value !== '—' && value !== '…';

  return (
    <span className={`compare-cell-value${showLeader ? ' compare-cell-value--best' : ''}`}>
      {value}
    </span>
  );
}

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

  const metricGroups = useMemo(() => (
    COMPARE_METRIC_CATEGORIES.map((cat) => ({
      ...cat,
      metrics: metrics.filter((m) => m.category === cat.key),
    })).filter((g) => g.metrics.length > 0)
  ), [metrics]);

  const anyLoading = periodQueries.some((q) => q.isLoading);
  const colSpan = participants.length + 1;
  const density = getCompareDensity(participants.length);
  const avatarSize = avatarSizeForDensity(density);
  const tableStyle = { '--compare-participant-count': participants.length } as CSSProperties;

  return (
    <div className={`compare-results compare-results--${density}`} style={tableStyle}>
      <header className="compare-results-head">
        <h2 className="compare-results-title">{PERIOD_HEADLINE[period]} averages</h2>
        <p className="compare-results-legend">Bold = best in your group</p>
      </header>

      {/* Mobile: stacked cards per category */}
      <div className="compare-cards" aria-label="Compare stats by category">
        {metricGroups.map((group) => (
          <section key={group.key} className="compare-category-card">
            <h3 className="compare-category-card-title">{group.label}</h3>
            <div className="compare-metric-cards">
              {group.metrics.map((metric) => (
                <article key={metric.id} className="compare-metric-card">
                  <div className="compare-metric-card-label">
                    <MetricLabel metric={metric} />
                  </div>
                  <div className="compare-metric-card-values">
                    {participants.map((p) => {
                      const isLeader = !anyLoading && (leadersByMetricId.get(metric.id)?.has(p.id) ?? false);
                      const stats = statsById[p.id] ?? null;
                      return (
                        <div
                          key={p.id}
                          className={[
                            'compare-metric-card-person',
                            p.isSelf ? 'compare-metric-card-person--self' : '',
                            isLeader ? 'compare-metric-card-person--leader' : '',
                          ].filter(Boolean).join(' ')}
                        >
                          {density !== 'cozy' ? (
                            <Avatar userId={p.id} username={p.username} size={avatarSize} />
                          ) : null}
                          <span className="compare-metric-card-person-name" title={p.isSelf ? 'You' : `@${p.username}`}>
                            {participantLabel(p, density)}
                          </span>
                          <CompareValue
                            metric={metric}
                            stats={stats}
                            isLoading={anyLoading}
                            isLeader={isLeader}
                          />
                        </div>
                      );
                    })}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Desktop: aligned table with category groups */}
      <div className="compare-table-wrap compare-table-wrap--desktop">
        <div className="compare-table-scroll">
          <table className="compare-table">
            <thead>
              <tr>
                <th className="compare-sticky-col compare-table-corner" scope="col" />
                {participants.map((p) => (
                  <th
                    key={p.id}
                    className={`compare-user-col${p.isSelf ? ' compare-user-col--self' : ''}`}
                    scope="col"
                  >
                    <Link
                      to={`/profile/${p.id}`}
                      className={`compare-user-head${p.isSelf ? ' compare-user-head--self' : ''}`}
                    >
                      <Avatar userId={p.id} username={p.username} size={avatarSize} />
                      <span className="compare-user-name" title={p.isSelf ? 'You' : `@${p.username}`}>
                        {participantLabel(p, density)}
                      </span>
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            {metricGroups.map((group) => (
              <tbody key={group.key} className="compare-category-group">
                <tr className="compare-category-row">
                  <th className="compare-sticky-col compare-category-label" colSpan={colSpan} scope="colgroup">
                    {group.label}
                  </th>
                </tr>
                {group.metrics.map((metric) => (
                  <tr key={metric.id} className="compare-metric-row">
                    <th className="compare-sticky-col compare-metric-label" scope="row">
                      <MetricLabel metric={metric} />
                    </th>
                    {participants.map((p) => {
                      const isLeader = !anyLoading && (leadersByMetricId.get(metric.id)?.has(p.id) ?? false);
                      const stats = statsById[p.id] ?? null;
                      return (
                        <td
                          key={p.id}
                          className={[
                            'compare-cell',
                            p.isSelf ? 'compare-cell--self' : '',
                            isLeader ? 'compare-cell--leader' : '',
                          ].filter(Boolean).join(' ')}
                        >
                          <CompareValue
                            metric={metric}
                            stats={stats}
                            isLoading={anyLoading}
                            isLeader={isLeader}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            ))}
          </table>
        </div>
      </div>
    </div>
  );
}
