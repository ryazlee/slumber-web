import type { ChallengeContributionPost, ChallengeProgress } from './types';

export type ProgressBarSegment = {
  date: string;
  mins: number;
  widthPct: number;
  startPct: number;
};

export type SplitBarUser = {
  userId: string;
  segments: ProgressBarSegment[];
  accruedMinutes: number;
  nightsLogged: number;
  totalPct: number;
};

function segmentsForMinutes(
  entries: { key: string; mins: number }[],
  goalMinutes: number,
): ProgressBarSegment[] {
  if (goalMinutes <= 0) return [];
  let cumulative = 0;
  return entries
    .filter((entry) => entry.mins > 0)
    .map((entry) => {
      const widthPct = (entry.mins / goalMinutes) * 100;
      const startPct = cumulative;
      cumulative += widthPct;
      return { date: entry.key, mins: entry.mins, widthPct, startPct };
    })
    .filter((seg) => seg.widthPct > 0);
}

/**
 * Bars and hours come from `get_challenge_progress` (every accepted racer).
 * Visible posts only fill segment dividers when the RPC did not send entry minutes.
 * They never replace another racer's total.
 */
export function buildSplitBarsByUser(
  contributions: ChallengeContributionPost[],
  progress: ChallengeProgress[],
): SplitBarUser[] {
  const totals = new Map<string, Map<string, number>>();
  for (const row of contributions) {
    const byDay = totals.get(row.userId) ?? new Map<string, number>();
    byDay.set(row.sleepDate, (byDay.get(row.sleepDate) ?? 0) + row.asleepMinutes);
    totals.set(row.userId, byDay);
  }

  return progress.map((p) => {
    const fromEntries = (p.entryMinutes ?? []).filter((mins) => mins > 0);
    const segments = fromEntries.length > 0
      ? segmentsForMinutes(
        fromEntries.map((mins, index) => ({ key: String(index), mins })),
        p.goalMinutes,
      )
      : segmentsForMinutes(
        Array.from(totals.get(p.userId)?.entries() ?? [])
          .sort(([a], [b]) => (a < b ? -1 : 1))
          .map(([date, mins]) => ({ key: date, mins })),
        p.goalMinutes,
      );

    return {
      userId: p.userId,
      segments,
      accruedMinutes: p.accruedMinutes,
      nightsLogged: p.nightsLogged,
      totalPct: p.goalMinutes > 0
        ? Math.round((Math.min(p.accruedMinutes, p.goalMinutes) / p.goalMinutes) * 100)
        : 0,
    };
  });
}
