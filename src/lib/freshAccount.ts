/** Keep aligned with `lib/profiles/freshAccount.ts` in the app. */
export const FRESH_ACCOUNT_WINDOW_MS = 5 * 60_000;

/** True only for first account creation (`profiles.created_at`). */
export function isRecentlyCreatedAccount(
  joinedAt: string | null | undefined,
  now = Date.now(),
): boolean {
  if (!joinedAt) return false;
  const created = Date.parse(joinedAt);
  if (!Number.isFinite(created)) return false;
  const age = now - created;
  if (age < -60_000) return false;
  return age < FRESH_ACCOUNT_WINDOW_MS;
}
