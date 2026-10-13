import { useMemo, useState } from 'react';
import { formatMins, pluralCount } from '../../lib/format';
import { stageColor } from '../../lib/stageColors';
import type { MonthBest } from '../../lib/statsTypes';
import StatsStageMix from './StatsStageMix';

const RECAP_NUDGE_LAST_DAY = 7;
const RECAP_MIN_NIGHTS = 7;

function previousMonthKey(now = new Date()): string {
  const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  const monthIndex = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
}

function monthName(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number);
  if (!year || !month) return monthKey;
  return new Date(year, month - 1, 15).toLocaleDateString('en-US', { month: 'long' });
}

type Props = {
  months: MonthBest[];
};

export default function StatsMonthlySection({ months }: Props) {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const nudge = useMemo(() => {
    const now = new Date();
    if (now.getDate() > RECAP_NUDGE_LAST_DAY) return null;
    const key = previousMonthKey(now);
    const month = months.find((row) => row.month === key);
    if (!month || month.nightCount < RECAP_MIN_NIGHTS) return null;
    return month;
  }, [months]);

  const selected = months.find((row) => row.month === selectedKey) ?? null;

  return (
    <div className="stats-monthly">
      {nudge ? (
        <button
          type="button"
          className="stats-recap-banner"
          onClick={() => setSelectedKey(nudge.month)}
        >
          <span>Your {monthName(nudge.month)} recap is ready</span>
          <span>View</span>
        </button>
      ) : null}

      <div className="stats-table-scroll">
        <div className="stats-table-card stats-table-card--wide" role="table" aria-label="Monthly sleep">
          <div className="stats-table-row stats-table-row--header" role="row">
            <span className="stats-table-cell stats-table-cell--label">Month</span>
            <span className="stats-table-cell" style={{ color: 'var(--accent)' }}>Sleep</span>
            <span className="stats-table-cell" style={{ color: stageColor('core') }}>Core</span>
            <span className="stats-table-cell" style={{ color: stageColor('deep') }}>Deep</span>
            <span className="stats-table-cell" style={{ color: stageColor('rem') }}>REM</span>
            <span className="stats-table-cell">Wakes</span>
            <span className="stats-table-cell">Avg Bed</span>
            <span className="stats-table-cell">Avg Wake</span>
          </div>
          {months.map((month) => {
            const active = month.month === selectedKey;
            return (
              <button
                key={month.month}
                type="button"
                className={`stats-table-row stats-month-row${active ? ' stats-month-row--active' : ''}`}
                aria-pressed={active}
                aria-label={`${month.label} monthly recap`}
                onClick={() => setSelectedKey((current) => (current === month.month ? null : month.month))}
              >
                <span className="stats-table-cell stats-table-cell--label">{month.label}</span>
                <span className="stats-table-cell" style={{ color: 'var(--accent)' }}>{formatMins(month.asleepMinutes)}</span>
                <StageCell minutes={month.coreMinutes} pct={month.corePct} color={stageColor('core')} />
                <StageCell minutes={month.deepMinutes} pct={month.deepPct} color={stageColor('deep')} />
                <StageCell minutes={month.remMinutes} pct={month.remPct} color={stageColor('rem')} />
                <span className="stats-table-cell">{month.avgAwakeEvents != null ? month.avgAwakeEvents : '—'}</span>
                <span className="stats-table-cell">{month.avgBedtime ?? '—'}</span>
                <span className="stats-table-cell">{month.avgWakeTime ?? '—'}</span>
              </button>
            );
          })}
        </div>
      </div>

      {selected ? <MonthRecap month={selected} /> : null}
    </div>
  );
}

function StageCell({ minutes, pct, color }: { minutes: number; pct: number | null; color: string }) {
  if (minutes <= 0) return <span className="stats-table-cell">—</span>;
  return (
    <span className="stats-table-cell" style={{ color }}>
      {formatMins(minutes)}
      {pct != null ? ` · ${pct}%` : ''}
    </span>
  );
}

function MonthRecap({ month }: { month: MonthBest }) {
  const max = Math.max(...month.nights.map((night) => night.asleepMinutes), 1);
  return (
    <div className="stats-card stats-recap">
      <div className="stats-card-header">
        <h3 className="stats-card-title">{month.label}</h3>
        <span className="stats-card-subtitle">{pluralCount(month.nightCount, 'wearable night')}</span>
      </div>
      <p className="stats-recap-avg">
        <strong>{month.avgAsleepMinutes > 0 ? formatMins(month.avgAsleepMinutes) : '—'}</strong>
        <span>average sleep</span>
      </p>
      {month.nights.length > 0 ? (
        <div className="stats-recap-bars" aria-hidden>
          {month.nights.map((night) => (
            <div key={night.sleepDate} className="stats-recap-bar-col" title={night.sleepDate}>
              <div
                className="stats-recap-bar"
                style={{ height: `${Math.max(4, Math.round((night.asleepMinutes / max) * 56))}px` }}
              />
            </div>
          ))}
        </div>
      ) : null}
      <div className="stats-metric-list">
        <div className="stats-metric-row"><span>Avg bedtime</span><span>{month.avgBedtime ?? '—'}</span></div>
        <div className="stats-metric-row"><span>Avg wake-up</span><span>{month.avgWakeTime ?? '—'}</span></div>
        <div className="stats-metric-row"><span>Best night</span><span>{formatMins(month.asleepMinutes)}</span></div>
      </div>
      <StatsStageMix
        deepPct={month.avgDeepPct}
        remPct={month.avgRemPct}
        corePct={month.avgCorePct}
        periodLabel={month.label}
        embedded
        showHeader={false}
      />
    </div>
  );
}
