import { useMemo, useState } from 'react';
import StatsScreenSkeleton from '../../components/StatsScreenSkeleton';
import { useQueryClient } from '@tanstack/react-query';
import SleepCompatibilityPanel from '../../components/stats/SleepCompatibilityPanel';
import StatsCollapsible from '../../components/stats/StatsCollapsible';
import StatsDreamAnalytics from '../../components/stats/StatsDreamAnalytics';
import StatsMonthlySection from '../../components/stats/StatsMonthlySection';
import StatsPeriodMetrics from '../../components/stats/StatsPeriodMetrics';
import StatsPrStrip from '../../components/stats/StatsPrStrip';
import StatsStageMix from '../../components/stats/StatsStageMix';
import StatsWeekChart from '../../components/stats/StatsWeekChart';
import { useAuth } from '../../context/AuthContext';
import { useComparePeriods } from '../../hooks/useCompare';
import { useLifetimeStats, useUserStats } from '../../hooks/useStats';
import { queryKeys } from '../../hooks/queryKeys';
import { weekVsMonthDeltaLabel } from '../../lib/statsInsights';
import { buildMonthMetrics } from '../../lib/statsMetrics';
import { resolvePctPr, resolvePr } from '../../lib/statsPr';
import { formatMins, formatPct } from '../../lib/format';
import { getQueryErrorMessage } from '../../lib/queryError';

export default function MyStats() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const userId = user?.id ?? null;

  const {
    data: stats,
    isLoading,
    isRefetching,
    isError: isStatsError,
    error: statsError,
  } = useUserStats(userId);

  const {
    data: lifetime,
    isError: isLifetimeError,
    error: lifetimeError,
  } = useLifetimeStats(userId);

  const { data: compare } = useComparePeriods(userId);

  const [dreamsOpened, setDreamsOpened] = useState(false);
  const weekComparison = weekVsMonthDeltaLabel(
    compare?.week?.asleep ?? null,
    compare?.month?.asleep ?? null,
  );

  const monthMetrics = useMemo(
    () => buildMonthMetrics(compare?.month ?? null),
    [compare?.month],
  );

  const personalRecordSections = useMemo(() => {
    if (!stats) return [];
    const best = lifetime?.bestNights[0];
    const shortest = lifetime?.shortestNights[0];
    const wakes = lifetime?.mostWakesNights[0];
    const deep = lifetime?.mostDeepNights[0];
    const rem = lifetime?.mostRemNights[0];
    const core = lifetime?.mostCoreNights[0];
    const deepPct = lifetime?.highestDeepPctNights[0];
    const remPct = lifetime?.highestRemPctNights[0];
    const corePct = lifetime?.highestCorePctNights[0];
    const lowDeepPct = lifetime?.lowestDeepPctNights[0];
    const lowRemPct = lifetime?.lowestRemPctNights[0];
    const lowCorePct = lifetime?.lowestCorePctNights[0];
    const formatCount = (v: number) => String(Math.round(v));

    return [
      {
        title: 'Highlights',
        kind: 'best' as const,
        items: [
          { emoji: '🏆', label: 'Longest sleep', pr: resolvePr(stats.prLongestSleep, best, 'asleepMinutes'), format: formatMins, tone: 'best' as const, featured: true },
          { emoji: '💜', label: 'Most deep', pr: resolvePr(stats.prMostDeep, deep, 'deepMinutes'), format: formatMins, tone: 'deep' as const },
          { emoji: '💗', label: 'Most REM', pr: resolvePr(stats.prMostRem, rem, 'remMinutes'), format: formatMins, tone: 'rem' as const },
          { emoji: '💙', label: 'Most core', pr: resolvePr(stats.prMostCore, core, 'coreMinutes'), format: formatMins, tone: 'core' as const },
          { emoji: '💜', label: 'Highest deep %', pr: resolvePctPr(stats.prHighestDeepPct, deepPct, 'deepMinutes'), format: formatPct, tone: 'deep' as const },
          { emoji: '💗', label: 'Highest REM %', pr: resolvePctPr(stats.prHighestRemPct, remPct, 'remMinutes'), format: formatPct, tone: 'rem' as const },
          { emoji: '💙', label: 'Highest core %', pr: resolvePctPr(stats.prHighestCorePct, corePct, 'coreMinutes'), format: formatPct, tone: 'core' as const },
        ],
      },
      {
        title: 'Rough nights',
        kind: 'rough' as const,
        items: [
          { emoji: '🧊', label: 'Lowest deep %', pr: resolvePctPr(stats.prLowestDeepPct, lowDeepPct, 'deepMinutes'), format: formatPct, tone: 'deep' as const },
          { emoji: '🧊', label: 'Lowest REM %', pr: resolvePctPr(stats.prLowestRemPct, lowRemPct, 'remMinutes'), format: formatPct, tone: 'rem' as const },
          { emoji: '🧊', label: 'Lowest core %', pr: resolvePctPr(stats.prLowestCorePct, lowCorePct, 'coreMinutes'), format: formatPct, tone: 'core' as const },
          { emoji: '⏱️', label: 'Shortest sleep', pr: resolvePr(stats.prShortestSleep, shortest, 'asleepMinutes'), format: formatMins, tone: 'rough' as const },
          { emoji: '😵', label: 'Most wakes', pr: resolvePr(stats.prMostWakes, wakes, 'awakeEvents'), format: formatCount, tone: 'awake' as const },
        ],
      },
    ];
  }, [stats, lifetime]);

  const onRefresh = () => {
    if (!userId) return;
    qc.invalidateQueries({ queryKey: queryKeys.userStats(userId) });
    qc.invalidateQueries({ queryKey: queryKeys.lifetimeStats(userId) });
    qc.invalidateQueries({ queryKey: queryKeys.comparePeriods(userId) });
  };

  if (isLoading && !isRefetching) {
    return <StatsScreenSkeleton />;
  }

  if (isStatsError || isLifetimeError) {
    const message = getQueryErrorMessage(statsError ?? lifetimeError, 'Failed to load stats');
    return (
      <div className="stats-error">
        <p className="admin-error">{message}</p>
        <button type="button" className="stats-refresh-btn" onClick={onRefresh}>Try again</button>
      </div>
    );
  }

  return (
    <div className="my-stats">
      <div className="my-stats-toolbar">
        <button type="button" className="stats-refresh-btn" onClick={onRefresh} disabled={isRefetching}>
          {isRefetching ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {stats ? (
        <section className="stats-section">
          <h2 className="stats-section-label">This week</h2>
          <StatsWeekChart
            posts={stats.weeklyPosts}
            avgMinutes={compare?.week?.asleep ?? null}
            comparisonLabel={weekComparison}
          />
        </section>
      ) : null}

      {monthMetrics.length > 0 || compare?.month ? (
        <section className="stats-section">
          <h2 className="stats-section-label">Last 30 days</h2>
          <div className="stats-card stats-month-card">
            <StatsPeriodMetrics metrics={monthMetrics} embedded variant="list" />
            {compare?.month ? (
              <StatsStageMix
                deepPct={compare.month.deepPct}
                remPct={compare.month.remPct}
                corePct={compare.month.corePct}
                embedded
                showHeader={false}
              />
            ) : null}
          </div>
        </section>
      ) : null}

      <SleepCompatibilityPanel />

      {stats ? (
        <StatsCollapsible title="Personal records">
          <StatsPrStrip sections={personalRecordSections} />
        </StatsCollapsible>
      ) : null}

      {lifetime ? (
        <StatsCollapsible title="Lifetime">
          <div className="stats-card stats-lifetime-card">
            <div className="stats-metric-list">
              <div className="stats-metric-row"><span>Nights</span><span>{lifetime.totalNights}</span></div>
              <div className="stats-metric-row">
                <span>Avg sleep</span>
                <span>{formatMins(Math.round(lifetime.avgAsleepMinutes))}</span>
              </div>
              {lifetime.avgBedtime ? (
                <div className="stats-metric-row"><span>Avg bedtime</span><span>{lifetime.avgBedtime}</span></div>
              ) : null}
              {lifetime.avgWakeTime ? (
                <div className="stats-metric-row"><span>Avg wake-up</span><span>{lifetime.avgWakeTime}</span></div>
              ) : null}
              <div className="stats-metric-row"><span>Log streak</span><span>{stats?.currentStreak ?? 0} nights</span></div>
              <div className="stats-metric-row"><span>Best streak</span><span>{stats?.longestStreak ?? 0} nights</span></div>
            </div>
          </div>
        </StatsCollapsible>
      ) : null}

      <StatsCollapsible title="Dreams" onOpen={() => setDreamsOpened(true)}>
        {dreamsOpened ? <StatsDreamAnalytics /> : null}
      </StatsCollapsible>

      {lifetime && lifetime.monthlyBests.length > 0 ? (
        <StatsCollapsible title="Monthly">
          <StatsMonthlySection months={lifetime.monthlyBests} />
        </StatsCollapsible>
      ) : null}
    </div>
  );
}
