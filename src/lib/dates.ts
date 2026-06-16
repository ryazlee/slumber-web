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

/** Last night's sleep_date (sleep_date is the night, not wake morning). */
export function getLastNightSleepDateISO(): string {
  return addDaysToDateISO(getLocalDateISO(), -1);
}

/** Recent sleep-night YYYY-MM-DDs, oldest first (default: 7 nights ending at last night). */
export function getRecentSleepNightISOs(count = 7): string[] {
  const lastNight = getLastNightSleepDateISO();
  return Array.from({ length: count }, (_, i) => addDaysToDateISO(lastNight, -(count - 1 - i)));
}
