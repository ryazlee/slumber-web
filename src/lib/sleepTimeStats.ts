import { parseClockToMinutes, formatClockMinutes } from './timeline';

type SessionLike = {
  bedtime?: string | null;
  wakeTime?: string | null;
};

/** Shift early-morning clock times onto the prior sleep night for averaging. */
export function adjustBedtimeForSleepAverage(minutes: number): number {
  return minutes < 720 ? minutes + 1440 : minutes;
}

export function parseSleepClock(s: string | null | undefined): number | null {
  if (!s || s === '—') return null;
  return parseClockToMinutes(s);
}

export function formatSleepClockMinutes(total: number): string {
  return formatClockMinutes(total);
}

/** Circular mean for bedtimes (e.g. 11 PM and 1 AM → midnight, not 3 PM). */
export function averageBedtimeMinutes(values: number[]): number | null {
  if (values.length === 0) return null;
  const adjusted = values.map(adjustBedtimeForSleepAverage);
  return Math.round(adjusted.reduce((a, b) => a + b, 0) / adjusted.length);
}

export function averageWakeTimeMinutes(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

/**
 * Earliest bedtime for a sleep day — uses every session when present so nap days
 * and multi-session posts don't miss the first in-bed time.
 */
export function extractBedtimeMinutes(
  bedtime: string | null | undefined,
  sessionBreakdown?: SessionLike[] | null,
): number | null {
  const candidates: number[] = [];
  const top = parseSleepClock(bedtime);
  if (top != null) candidates.push(top);

  for (const session of sessionBreakdown ?? []) {
    const mins = parseSleepClock(session.bedtime);
    if (mins != null) candidates.push(mins);
  }

  if (candidates.length === 0) return null;

  let best = candidates[0];
  let bestAdjusted = adjustBedtimeForSleepAverage(best);
  for (let i = 1; i < candidates.length; i += 1) {
    const candidate = candidates[i];
    const adjusted = adjustBedtimeForSleepAverage(candidate);
    if (adjusted < bestAdjusted) {
      best = candidate;
      bestAdjusted = adjusted;
    }
  }
  return best;
}

/** Latest wake for a sleep day (last session chronologically). */
export function extractWakeTimeMinutes(
  wakeTime: string | null | undefined,
  sessionBreakdown?: SessionLike[] | null,
): number | null {
  const sessions = sessionBreakdown ?? [];
  if (sessions.length > 0) {
    const sorted = [...sessions].sort((a, b) => {
      const am = adjustBedtimeForSleepAverage(parseSleepClock(a.bedtime) ?? 0);
      const bm = adjustBedtimeForSleepAverage(parseSleepClock(b.bedtime) ?? 0);
      return am - bm;
    });
    const last = sorted[sorted.length - 1];
    return parseSleepClock(last.wakeTime);
  }
  return parseSleepClock(wakeTime);
}

export function compareTimeMetricMinutes(metricId: string, value: string): number | null {
  const mins = parseSleepClock(value);
  if (mins == null) return null;
  if (metricId === 'avgBedtime') return adjustBedtimeForSleepAverage(mins);
  return mins;
}
