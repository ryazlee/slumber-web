import { useDreamSleepAnalytics } from '../../hooks/useStats';
import { formatMins, pluralCount } from '../../lib/format';
import { dreamMoodColor, VIBE_CONFIG } from '../../lib/sleepPostMeta';
import { useAuth } from '../../context/AuthContext';

export default function StatsDreamAnalytics() {
  const { user } = useAuth();
  const { data, isLoading, isError } = useDreamSleepAnalytics(user?.id ?? null, true);

  if (isLoading && !data) {
    return <p className="app-muted">Loading dreams…</p>;
  }

  if (isError) {
    return <p className="admin-error">Couldn’t load dream analytics.</p>;
  }

  if (!data || data.totalNights === 0) {
    return (
      <div className="stats-card stats-dream-card">
        <p className="app-muted">
          Log a few nights — journal dreams and tag how they felt to see how tone lines up with cycles and mornings.
        </p>
      </div>
    );
  }

  const hasMood = data.withMood > 0;

  return (
    <div className="stats-card stats-dream-card">
      <div className="stats-metric-list">
        <Metric label="Recall" value={data.recallRate != null ? `${data.recallRate}%` : '—'} />
        <Metric label="Journaled" value={String(data.dreamsLogged)} />
        <Metric label="Mood-tagged" value={String(data.withMood)} />
      </div>
      <p className="app-muted">Last {data.windowDays} days</p>
      {data.highlight ? <p className="stats-dream-highlight">{data.highlight}</p> : null}

      {hasMood && data.moodMix.length > 0 ? (
        <div className="stats-dream-block">
          <h3>Mood mix</h3>
          <div className="stats-stage-stacked" aria-hidden>
            {data.moodMix.map((mood) => (
              <div
                key={mood.mood}
                className="stats-stage-segment"
                style={{ flex: mood.pct, background: dreamMoodColor(mood.mood) }}
                title={`${mood.label} ${mood.pct}%`}
              />
            ))}
          </div>
          <ul className="stats-dream-mix">
            {data.moodMix.map((mood) => (
              <li key={mood.mood}>
                <span>{mood.emoji} {mood.label}</span>
                <span>{mood.pct}%</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {hasMood && data.moodProfiles.length > 0 ? (
        <div className="stats-dream-block">
          <h3>By dream tone</h3>
          <ul className="stats-dream-profiles">
            {data.moodProfiles.map((profile) => {
              const vibe = profile.topVibe ? VIBE_CONFIG[profile.topVibe] : null;
              return (
                <li key={profile.mood}>
                  <span>{profile.emoji} {profile.label}</span>
                  <span className="app-muted">
                    {pluralCount(profile.count, 'night')}
                    {profile.avgAsleepMinutes != null ? ` · ${formatMins(profile.avgAsleepMinutes)}` : ''}
                    {vibe ? ` · ${vibe.emoji} ${vibe.label}` : ''}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {data.factorHits.length > 0 ? (
        <div className="stats-dream-block">
          <h3>Factors</h3>
          <ul className="stats-dream-profiles">
            {data.factorHits.slice(0, 4).map((hit) => (
              <li key={hit.tag}>
                <span>{hit.emoji} {hit.label}</span>
                <span className="app-muted">
                  {hit.nightmareRate}% nightmares · {pluralCount(hit.nights, 'night')}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="stats-metric-row">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
