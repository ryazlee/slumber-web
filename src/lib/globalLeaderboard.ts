import { supabase } from './supabase';

export type GlobalLeaderboardEntry = {
  userId: string;
  username: string;
  avatarUrl: string | null;
  userRoles: string[] | null;
  nights: number;
  value: number;
  /** prevRank − currentRank; positive = moved up. Null = not ranked on the board 7 days ago. */
  rankDelta: number | null;
  /** From RPC (SECURITY DEFINER). streaks are select-own client-side. */
  currentStreak: number;
};

export type GlobalLeaderboardMetric =
  | 'deepPct'
  | 'remPct'
  | 'corePct'
  | 'avgHours'
  | 'dreamRate';

/** Weekly = rolling last 7 days ending today (not calendar week); all-time = every qualifying wearable night. */
export type GlobalLeaderboardPeriod = 'weekly' | 'all_time';

export type GlobalSleepLeaderboard = {
  /** Rolling window length; null for all-time. */
  days: number | null;
  period: GlobalLeaderboardPeriod;
  /** Lookback for rankDelta — compare to same board as of this many days ago (always 7).
   * Newcomers (not on prior board) receive prevBoardSize - rank (positive ↑). */
  deltaDays: number;
  minNights: number;
  clubId: string | null;
  deepPct: GlobalLeaderboardEntry[];
  remPct: GlobalLeaderboardEntry[];
  corePct: GlobalLeaderboardEntry[];
  avgHours: GlobalLeaderboardEntry[];
  dreamRate: GlobalLeaderboardEntry[];
};

export const LEADERBOARD_PERIODS: {
  key: GlobalLeaderboardPeriod;
  label: string;
  /** null → all-time (RPC p_days NULL). */
  days: number | null;
  minNights: number;
}[] = [
  { key: 'all_time', label: 'All-time', days: null, minNights: 5 },
  { key: 'weekly', label: 'Weekly', days: 7, minNights: 3 },
];

export function leaderboardPeriodConfig(period: GlobalLeaderboardPeriod) {
  return LEADERBOARD_PERIODS.find((p) => p.key === period) ?? LEADERBOARD_PERIODS[0];
}

function mapEntry(raw: unknown): GlobalLeaderboardEntry | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const userId = typeof r.userId === 'string' ? r.userId : null;
  const username = typeof r.username === 'string' ? r.username : null;
  if (!userId || !username) return null;
  const nights = typeof r.nights === 'number' ? r.nights : Number(r.nights);
  const value = typeof r.value === 'number' ? r.value : Number(r.value);
  if (!Number.isFinite(nights) || !Number.isFinite(value)) return null;
  const rawRoles = r.userRoles;
  const userRoles = Array.isArray(rawRoles)
    ? rawRoles.filter((role): role is string => typeof role === 'string')
    : null;
  const rawDelta = r.rankDelta;
  let rankDelta: number | null = null;
  if (rawDelta != null) {
    const n = typeof rawDelta === 'number' ? rawDelta : Number(rawDelta);
    if (Number.isFinite(n)) rankDelta = n;
  }
  const rawStreak = r.currentStreak;
  const streakN =
    typeof rawStreak === 'number' ? rawStreak : rawStreak != null ? Number(rawStreak) : 0;
  return {
    userId,
    username,
    avatarUrl: typeof r.avatarUrl === 'string' ? r.avatarUrl : null,
    userRoles: userRoles && userRoles.length > 0 ? userRoles : null,
    nights,
    value,
    rankDelta,
    currentStreak: Number.isFinite(streakN) ? Math.max(0, Math.trunc(streakN)) : 0,
  };
}

function mapList(raw: unknown): GlobalLeaderboardEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(mapEntry).filter((e): e is GlobalLeaderboardEntry => e != null);
}

function mapPeriod(raw: unknown, days: number | null): GlobalLeaderboardPeriod {
  if (raw === 'all_time' || raw === 'weekly') return raw;
  return days == null ? 'all_time' : 'weekly';
}

export async function fetchGlobalSleepLeaderboard(opts?: {
  period?: GlobalLeaderboardPeriod;
  days?: number | null;
  limit?: number;
  minNights?: number;
  clubId?: string | null;
}): Promise<GlobalSleepLeaderboard> {
  const clubId = opts?.clubId ?? null;
  const period = opts?.period ?? 'all_time';
  const config = leaderboardPeriodConfig(period);
  const days = opts?.days !== undefined ? opts.days : config.days;
  const minNights = opts?.minNights ?? config.minNights;

  const { data, error } = await supabase.rpc('get_global_sleep_leaderboard', {
    p_days: days,
    p_limit: opts?.limit ?? 10,
    p_min_nights: minNights,
    p_club_id: clubId,
  });
  if (error) throw error;

  const payload = (data ?? {}) as Record<string, unknown>;
  const payloadDays =
    payload.days == null
      ? null
      : typeof payload.days === 'number'
        ? payload.days
        : Number(payload.days);
  const resolvedDays =
    payloadDays != null && Number.isFinite(payloadDays) ? payloadDays : days ?? null;
  const deltaDaysRaw = payload.deltaDays;
  const deltaDays =
    typeof deltaDaysRaw === 'number' && Number.isFinite(deltaDaysRaw)
      ? deltaDaysRaw
      : 7;

  return {
    days: resolvedDays,
    period: mapPeriod(payload.period, resolvedDays),
    deltaDays,
    minNights: typeof payload.minNights === 'number' ? payload.minNights : minNights,
    clubId: typeof payload.clubId === 'string' ? payload.clubId : clubId,
    deepPct: mapList(payload.deepPct),
    remPct: mapList(payload.remPct),
    corePct: mapList(payload.corePct),
    avgHours: mapList(payload.avgHours),
    dreamRate: mapList(payload.dreamRate),
  };
}
