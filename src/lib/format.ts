const AVATAR_COLORS = ['#8B5CF6', '#0891B2', '#EC4899', '#34C759', '#7b3fa0', '#F59E0B', '#6366F1'];

export function avatarColorFromName(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export const formatMins = (mins: number): string => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

export const formatSleepDate = (dateISO: string): string => {
  const [year, month, day] = dateISO.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};

export const goalHours = (minutes: number): string => `${minutes / 60}h`;

export function formatChallengeStatus(status: string): string {
  switch (status) {
    case 'pending': return 'Pending';
    case 'active': return 'Active';
    case 'pending_completion': return 'Finalizing';
    case 'completed': return 'Completed';
    case 'declined': return 'Declined';
    case 'cancelled': return 'Cancelled';
    default: return status;
  }
}

export function formatChallengeRaceType(challenge: {
  isGroup: boolean;
  goalMinutes: number;
  noExpiration: boolean;
}): string {
  const kind = challenge.isGroup ? 'Group' : '1v1';
  const goal = `${goalHours(challenge.goalMinutes)} goal`;
  const duration = challenge.noExpiration ? 'No expiry' : 'Timed';
  return `${kind} · ${goal} · ${duration}`;
}

export const formatChallengeRecord = (wins: number, losses: number, ties?: number): string =>
  `${wins} – ${losses}${ties !== undefined && ties !== 0 ? ` – ${ties}` : ''}`;

export const timeAgo = (isoString: string): string => {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
};

export function formatChallengeStartDate(
  startedAt: string | null,
  fallback?: string | null,
): string {
  const iso = startedAt ?? fallback;
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function toLocalDateISO(d: Date): string {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-');
}

