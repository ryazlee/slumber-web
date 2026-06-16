export function toDateInputValue(iso: string | null | undefined): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

export function defaultPremiumUntilDate(): string {
  const date = new Date();
  date.setUTCFullYear(date.getUTCFullYear() + 1);
  return date.toISOString().slice(0, 10);
}

export function lifetimePremiumUntilDate(): string {
  return '2099-01-01';
}

export function premiumUntilFromDateInput(value: string): string {
  return new Date(`${value}T23:59:59.999Z`).toISOString();
}

export function extendPremiumUntilOneYear(fromIso: string | null | undefined): string {
  const base = fromIso ? new Date(fromIso) : new Date();
  const start = base.getTime() > Date.now() ? base : new Date();
  start.setUTCFullYear(start.getUTCFullYear() + 1);
  return start.toISOString();
}

export function formatPremiumExpiry(iso: string | null | undefined): string {
  if (!iso) return 'No expiry';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  if (iso >= '2090-01-01') return 'Lifetime';
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatDaysRemaining(days: number | null | undefined, grantType: string): string {
  if (grantType === 'lifetime') return 'Lifetime';
  if (grantType === 'past_due') return 'Past due';
  if (days == null) return '—';
  if (days === 0) return 'Today';
  if (days === 1) return '1 day';
  return `${days} days`;
}
