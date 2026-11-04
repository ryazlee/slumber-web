function toLocalDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getLocalDateISO(): string {
  return toLocalDateISO(new Date());
}

export function addDaysToDateISO(dateISO: string, days: number): string {
  const [y, m, d] = dateISO.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return toLocalDateISO(date);
}

/**
 * Whole local calendar days from dateISO to referenceISO (0 = same day, 1 = yesterday).
 * Round, not floor: spring-forward midnights are 23 hours apart.
 */
export function daysAgoForDateISO(dateISO: string, referenceISO = getLocalDateISO()): number {
  const [y, m, d] = dateISO.split('-').map(Number);
  const [ry, rm, rd] = referenceISO.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const ref = new Date(ry, rm - 1, rd);
  return Math.round((ref.getTime() - date.getTime()) / 86_400_000);
}

/** 0 when the last logged morning is older than the day before asOfISO. */
export function displayedCurrentStreak(
  currentRun: number | null | undefined,
  lastSleepDate: string | null | undefined,
  asOfISO: string,
): number {
  const run = Number.isFinite(currentRun) ? Math.max(0, Math.trunc(currentRun ?? 0)) : 0;
  if (run === 0 || !lastSleepDate) return 0;
  return daysAgoForDateISO(lastSleepDate, asOfISO) <= 1 ? run : 0;
}

/** Last completed sleep's wake date: today after 5am, yesterday before. */
export function getLastNightSleepDateISO(): string {
  const now = new Date();
  const today = getLocalDateISO();
  if (now.getHours() < 5) return addDaysToDateISO(today, -1);
  return today;
}

/** Recent wake-morning YYYY-MM-DDs, oldest first (default: 7 days ending at last completed sleep). */
export function getRecentSleepNightISOs(count = 7): string[] {
  const lastNight = getLastNightSleepDateISO();
  return Array.from({ length: count }, (_, i) => addDaysToDateISO(lastNight, -(count - 1 - i)));
}
