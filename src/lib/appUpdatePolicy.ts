/** Same major.minor.patch rules as the app (`lib/appUpdatePolicy.ts` in slumber). */

const VERSION_RE = /^\d+\.\d+\.\d+$/;

export const APP_UPDATE_MESSAGE_MAX = 280;

export function isAppUpdateVersion(value: string): boolean {
  return VERSION_RE.test(value.trim());
}

/** -1 if left < right, 0 if equal, 1 if left > right. Null when either side is not major.minor.patch. */
export function compareVersions(left: string, right: string): -1 | 0 | 1 | null {
  const a = parseVersion(left);
  const b = parseVersion(right);
  if (!a || !b) return null;
  for (let i = 0; i < 3; i += 1) {
    if (a[i] < b[i]) return -1;
    if (a[i] > b[i]) return 1;
  }
  return 0;
}

/** Reported users strictly below `minVersion`. Unparsable versions are skipped. */
export function countUsersBelowVersion(
  rows: { version: string; userCount: number }[],
  minVersion: string,
): number | null {
  if (!isAppUpdateVersion(minVersion)) return null;
  return rows.reduce((sum, row) => {
    const order = compareVersions(row.version, minVersion);
    return order === -1 ? sum + row.userCount : sum;
  }, 0);
}

function parseVersion(value: string): [number, number, number] | null {
  const trimmed = value.trim();
  if (!VERSION_RE.test(trimmed)) return null;
  const parts = trimmed.split('.').map((part) => Number(part));
  if (parts.length !== 3 || parts.some((part) => !Number.isInteger(part))) return null;
  return [parts[0], parts[1], parts[2]];
}
