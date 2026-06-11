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
    const byDay = totals.get(p.userId) ?? new Map<string, number>();
    const dayEntries = Array.from(byDay.entries()).sort(([a], [b]) => (a < b ? -1 : 1));

    const accruedMinutes = dayEntries.reduce((sum, [, mins]) => sum + mins, 0);
    let cumulative = 0;
    const segments = dayEntries
      .map(([date, mins]) => {
        const widthPct = p.goalMinutes > 0 ? (mins / p.goalMinutes) * 100 : 0;
        const startPct = cumulative;
        cumulative += widthPct;
        return { date, mins, widthPct, startPct };
      })
      .filter((seg) => seg.widthPct > 0);

    return {
      userId: p.userId,
      segments,
      accruedMinutes,
      nightsLogged: dayEntries.length,
      totalPct: p.goalMinutes > 0
        ? Math.round((Math.min(accruedMinutes, p.goalMinutes) / p.goalMinutes) * 100)
        : 0,
    };
  });
}
