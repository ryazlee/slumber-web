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

export default function CompareMobileCards({
  metricGroups,
  participants,
  statsById,
  leadersByMetricId,
  anyLoading,
  density,
}: Props) {
  const avatarSize = avatarSizeForDensity(density);

  return (
    <div className="compare-cards" aria-label="Compare stats by category">
      {metricGroups.map((group) => (
        <section key={group.key} className="compare-category-card">
          <h3 className="compare-category-card-title">{group.label}</h3>
          <div className="compare-metric-cards">
            {group.metrics.map((metric) => (
              <article key={metric.id} className="compare-metric-card">
                <div className="compare-metric-card-label">
                  <CompareMetricLabel metric={metric} />
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
                        <span
                          className="compare-metric-card-person-name"
                          title={p.isSelf ? 'You' : `@${p.username}`}
                        >
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
  );
}
