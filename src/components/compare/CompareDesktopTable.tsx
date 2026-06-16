import { Link } from 'react-router-dom';
import Avatar from '../Avatar';
import CompareMetricLabel from './CompareMetricLabel';
import CompareValue from './CompareValue';
import {
  avatarSizeForDensity,
  participantLabel,
  type CompareDensity,
} from './compareDensity';
import type { CompareMetricDef } from '../../lib/compareMetrics';
import type { CompareParticipant } from '../../lib/compareTypes';
import type { PeriodStats } from '../../lib/compareStats';

type MetricGroup = {
  key: string;
  label: string;
  metrics: CompareMetricDef[];
};

type Props = {
  metricGroups: MetricGroup[];
  participants: CompareParticipant[];
  statsById: Record<string, PeriodStats | null>;
  leadersByMetricId: Map<string, Set<string>>;
  anyLoading: boolean;
  density: CompareDensity;
};

export default function CompareDesktopTable({
  metricGroups,
  participants,
  statsById,
  leadersByMetricId,
  anyLoading,
  density,
}: Props) {
  const avatarSize = avatarSizeForDensity(density);
  const colSpan = participants.length + 1;

  return (
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
                    <Avatar
                      userId={p.id}
                      username={p.username}
                      avatarUrl={p.avatarUrl}
                      userRoles={p.userRoles}
                      size={avatarSize}
                    />
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
                    <CompareMetricLabel metric={metric} />
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
  );
}
