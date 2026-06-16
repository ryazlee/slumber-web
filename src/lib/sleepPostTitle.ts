/** Matches app default: `"June 15 Sleep"` from `lib/composerCustomSleep.ts`. */
export function defaultSleepPostTitle(sleepDateISO: string): string {
  const [year, month, day] = sleepDateISO.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return `${d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} Sleep`;
}

const GENERIC_TITLES = new Set(['my sleep', 'sleep log', 'sleep']);

export function isDefaultSleepPostTitle(
  title: string | null | undefined,
  sleepDateISO: string,
): boolean {
  const trimmed = (title ?? '').trim();
  if (!trimmed) return true;
  if (GENERIC_TITLES.has(trimmed.toLowerCase())) return true;
  return trimmed.toLowerCase() === defaultSleepPostTitle(sleepDateISO).toLowerCase();
}

/** Returns the title when the user set something custom; otherwise null. */
export function customSleepPostTitle(
  title: string | null | undefined,
  sleepDateISO: string,
): string | null {
  if (isDefaultSleepPostTitle(title, sleepDateISO)) return null;
  return trimmedOrNull(title);
}

function trimmedOrNull(title: string | null | undefined): string | null {
  const trimmed = (title ?? '').trim();
  return trimmed || null;
}
