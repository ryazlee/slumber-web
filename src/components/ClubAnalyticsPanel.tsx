import { useState } from 'react';
import { Link } from 'react-router-dom';
import Avatar from './Avatar';
import StatsStageMix from './stats/StatsStageMix';
import { useClubAnalytics } from '../hooks/useSocial';
import {
  clubForecast,
  type ClubAnalyticsPeriodKey,
  type ClubPeriodAnalytics,
} from '../lib/clubAnalytics';
import { formatMins, formatPct, formatSleepDate, pluralCount } from '../lib/format';

const PERIODS: { key: ClubAnalyticsPeriodKey; label: string }[] = [
  { key: 'day', label: 'Last night' },
  { key: 'week', label: '7 days' },
  { key: 'month', label: '30 days' },
];

type Props = {
  clubId: string;
};

export default function ClubAnalyticsPanel({ clubId }: Props) {
  const [period, setPeriod] = useState<ClubAnalyticsPeriodKey>('day');
  const query = useClubAnalytics(clubId, true);
  const data = query.data;
  const stats = data?.[period] ?? null;
  const periodLabel = PERIODS.find((tab) => tab.key === period)?.label ?? period;
  const windowLabel = period === 'day' && data?.dayDate ? formatSleepDate(data.dayDate) : periodLabel;

  return (
    <section className="social-club-analytics" aria-labelledby="club-analytics-title">
      <h3 id="club-analytics-title">Analytics</h3>
      <div className="global-lb-periods club-analytics-periods" role="tablist" aria-label="Club analytics window">
        {PERIODS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={period === tab.key}
            className={`global-lb-period${period === tab.key ? ' global-lb-period--active' : ''}`}
            onClick={() => setPeriod(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {query.isLoading && !data ? (
        <p className="app-muted">Loading club analytics…</p>
      ) : query.isError && !data ? (
        <p className="admin-error">Couldn’t load club analytics.</p>
      ) : !stats || stats.postsCount === 0 ? (
        <p className="app-muted">No sleep logged yet. Wearable nights from members show up here.</p>
      ) : (
        <PeriodBody
          stats={stats}
          period={period}
          windowLabel={windowLabel}
          memberCount={data?.memberCount ?? stats.memberCount}
          streak={data?.loggingStreakDays ?? 0}
        />
      )}
    </section>
  );
}

function PeriodBody({
  stats,
  period,
  windowLabel,
  memberCount,
  streak,
}: {
  stats: ClubPeriodAnalytics;
  period: ClubAnalyticsPeriodKey;
  windowLabel: string;
  memberCount: number;
  streak: number;
}) {
  const forecast = period === 'day' ? clubForecast(stats.dominantVibe) : null;
  const heroBits = [
    `${stats.loggedMembers}/${memberCount || '—'} logged`,
    streak > 1 ? `${streak}-day streak` : null,
    forecast?.title ?? null,
  ].filter(Boolean);

  const ranked = period !== 'day'
    ? stats.consistency
      .filter((row) => row.nightsLogged > 0)
      .slice(0, 5)
      .map((row) => ({
        userId: row.userId,
        username: row.username,
        avatarUrl: row.avatarUrl,
        value: `${row.nightsLogged}/${row.possibleNights}`,
      }))
    : stats.mvp
      ? [{
        userId: stats.mvp.userId,
        username: stats.mvp.username,
        avatarUrl: stats.mvp.avatarUrl,
        value: stats.mvp.reason === 'longest_sleep'
          ? formatMins(stats.mvp.asleepMinutes)
          : pluralCount(stats.mvp.nightsLogged, 'night'),
      }]
      : [];

  const you = stats.youVsClub;
  const compareRows = you ? [
    { label: 'Sleep', yours: you.yourAsleepMinutes != null ? formatMins(you.yourAsleepMinutes) : '—', club: you.clubAsleepMinutes != null ? formatMins(you.clubAsleepMinutes) : '—' },
    { label: 'Deep', yours: you.yourDeepPct != null ? formatPct(you.yourDeepPct) : '—', club: you.clubDeepPct != null ? formatPct(you.clubDeepPct) : '—' },
    { label: 'REM', yours: you.yourRemPct != null ? formatPct(you.yourRemPct) : '—', club: you.clubRemPct != null ? formatPct(you.clubRemPct) : '—' },
  ] : [];

  return (
    <div className="club-analytics-stack">
      <div className="stats-card">
        <p className="stats-card-subtitle">{windowLabel}</p>
        <p className="stats-recap-avg">
          <strong>{stats.avgAsleepMinutes != null ? formatMins(stats.avgAsleepMinutes) : '—'}</strong>
          <span>Avg sleep</span>
        </p>
        <p className="app-muted">{heroBits.join(' · ')}</p>
      </div>

      <StatsStageMix
        deepPct={stats.deepPct}
        remPct={stats.remPct}
        corePct={stats.corePct}
        periodLabel={windowLabel}
      />

      {ranked.length > 0 ? (
        <div className="stats-card">
          <h4 className="stats-card-title">{period === 'day' ? 'Night MVP' : 'Most consistent'}</h4>
          <div className="compat-list">
            {ranked.map((row) => (
              <Link key={row.userId} to={`/profile/${row.userId}`} className="compat-list-row">
                <span className="compat-featured-person">
                  <Avatar userId={row.userId} username={row.username} avatarUrl={row.avatarUrl ?? undefined} size="sm" />
                  <span className="compat-featured-name">@{row.username}</span>
                </span>
                <span>{row.value}</span>
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      {compareRows.length > 0 ? (
        <div className="stats-card">
          <h4 className="stats-card-title">You vs club</h4>
          <div className="stats-metric-list">
            <div className="stats-metric-row stats-metric-row--head">
              <span />
              <span>You</span>
              <span>Club</span>
            </div>
            {compareRows.map((row) => (
              <div key={row.label} className="stats-metric-row stats-metric-row--3">
                <span>{row.label}</span>
                <span>{row.yours}</span>
                <span>{row.club}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
