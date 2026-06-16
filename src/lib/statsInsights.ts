import type { SleepPost } from './types';
import { getRecentSleepNightISOs } from './dates';
import type { InsightChip } from './statsTypes';

export type { InsightChip };

export function weekChartNights(posts: SleepPost[]): Array<{ dateISO: string; post: SleepPost | null }> {
  const byDate = new Map(posts.map((p) => [p.sleepDate, p]));
  return getRecentSleepNightISOs(7).map((dateISO) => ({
    dateISO,
    post: byDate.get(dateISO) ?? null,
  }));
}

export function sleepDurationStdDev(posts: SleepPost[]): number | null {
  const mins = posts.map((p) => p.asleepMinutes).filter((m) => m > 0);
  if (mins.length < 3) return null;
  const mean = mins.reduce((a, b) => a + b, 0) / mins.length;
  const variance = mins.reduce((s, m) => s + (m - mean) ** 2, 0) / mins.length;
  return Math.sqrt(variance);
}

export function consistencyInsight(posts: SleepPost[]): InsightChip | null {
  const stdDev = sleepDurationStdDev(posts);
  if (stdDev == null) return null;
  if (stdDev <= 30) return { emoji: '🎯', label: 'Very consistent', detail: '±30m night to night' };
  if (stdDev <= 55) return { emoji: '📊', label: 'Pretty steady', detail: 'Sleep duration varies a bit' };
  return { emoji: '🎢', label: 'All over the place', detail: 'Big swings this week' };
}

function parseBedtimeMinutes(s: string | null | undefined): number | null {
  if (!s || s === '—') return null;
  const m = s.match(/^(\d+):(\d+)\s*(AM|PM)$/i);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const period = m[3].toUpperCase();
  if (period === 'AM') { if (h === 12) h = 0; }
  else { if (h !== 12) h += 12; }
  return h * 60 + min;
}

export function chronotypeInsight(avgBedtime: string | null): InsightChip | null {
  const mins = parseBedtimeMinutes(avgBedtime);
  if (mins == null) return null;
  const adjusted = mins < 720 ? mins + 1440 : mins;
  if (adjusted >= 23 * 60) return { emoji: '🦉', label: 'Night owl', detail: `Avg bed ${avgBedtime}` };
  if (adjusted <= 22 * 60 + 30) return { emoji: '🌅', label: 'Early bird', detail: `Avg bed ${avgBedtime}` };
  return { emoji: '🌙', label: 'Balanced schedule', detail: `Avg bed ${avgBedtime}` };
}

export function weekVsMonthInsight(
  weekAvg: number | null,
  monthAvg: number | null,
): InsightChip | null {
  if (weekAvg == null || monthAvg == null || monthAvg === 0) return null;
  const delta = weekAvg - monthAvg;
  if (Math.abs(delta) < 8) {
    return { emoji: '➡️', label: 'On par with your month', detail: 'This week ≈ 30-day avg' };
  }
  const sign = delta > 0 ? '+' : '';
  const rounded = Math.round(Math.abs(delta));
  if (delta > 0) {
    return { emoji: '📈', label: `${sign}${rounded}m vs 30-day avg`, detail: 'Sleeping more this week' };
  }
  return { emoji: '📉', label: `-${rounded}m vs 30-day avg`, detail: 'Shorter nights this week' };
}

export function dreamInsight(dreamRate: number | null, dreamsCount: number | null): InsightChip | null {
  if (dreamRate == null || dreamsCount == null) return null;
  if (dreamsCount === 0) return { emoji: '💭', label: 'No dreams logged', detail: 'Last 30 days' };
  if (dreamRate >= 50) return { emoji: '✨', label: `${dreamRate}% dream rate`, detail: `${dreamsCount} journal entries` };
  return { emoji: '💭', label: `${dreamRate}% dream rate`, detail: `${dreamsCount} entries in 30d` };
}
