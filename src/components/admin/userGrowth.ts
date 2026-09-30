import type { DailyActivityRow } from '../../lib/admin';

export type DailyActivityWithTotal = DailyActivityRow & {
  total_users: number;
};

/**
 * Running account total for a series that already ends today and is not
 * filtered by app version. baseline = totalUsers − signups in the series,
 * then each day adds that day's signups. Returns null when it cannot be anchored.
 */
export function withCumulativeUsers(
  rows: DailyActivityRow[],
  totalUsers: number | null | undefined,
): DailyActivityWithTotal[] | null {
  if (totalUsers == null || !Number.isFinite(totalUsers) || rows.length === 0) return null;
  const signupSum = rows.reduce((sum, row) => sum + row.signups, 0);
  let running = totalUsers - signupSum;
  return rows.map((row) => {
    running += row.signups;
    return { ...row, total_users: running };
  });
}
