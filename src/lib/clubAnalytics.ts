import type { Vibe } from './types';
import { VIBE_CONFIG } from './sleepPostMeta';

export type ClubAnalyticsPeriodKey = 'day' | 'week' | 'month';

export type ClubVibeMixItem = {
  vibe: Vibe;
  count: number;
  pct: number;
};

export type ClubMvp = {
  userId: string;
  username: string;
  avatarUrl: string | null;
  asleepMinutes: number;
  nightsLogged: number;
  reason: 'longest_sleep' | 'most_nights';
};

export type ClubConsistencyRow = {
  userId: string;
  username: string;
  avatarUrl: string | null;
  nightsLogged: number;
  possibleNights: number;
  avgAsleepMinutes: number | null;
};

export type ClubYouVsClub = {
  yourAsleepMinutes: number | null;
  clubAsleepMinutes: number | null;
  yourDeepPct: number | null;
  clubDeepPct: number | null;
  yourRemPct: number | null;
  clubRemPct: number | null;
};

export type ClubAchievementId =
  | 'full_log'
  | 'deep_pack'
  | 'all_vibes'
  | 'dreamy'
  | 'wake_sync'
  | 'buddy_night';

export type ClubAchievement = {
  id: ClubAchievementId;
  emoji: string;
  label: string;
};

export type ClubPeriodAnalytics = {
  postsCount: number;
  loggedMembers: number;
  memberCount: number;
  possibleNights: number;
  avgAsleepMinutes: number | null;
  avgDeepMinutes: number | null;
  avgRemMinutes: number | null;
  avgCoreMinutes: number | null;
  deepPct: number | null;
  remPct: number | null;
  corePct: number | null;
  dreamRate: number | null;
  buddyNightCount: number;
  buddyNightRate: number | null;
  vibeMix: ClubVibeMixItem[];
  dominantVibe: Vibe | null;
  mvp: ClubMvp | null;
  consistency: ClubConsistencyRow[];
  youVsClub: ClubYouVsClub | null;
  bedtimeSpreadMinutes: number | null;
  wakeSyncPct: number | null;
};

export type ClubAnalytics = {
  memberCount: number;
  dayDate: string;
  viewerUserId: string | null;
  loggingStreakDays: number;
  day: ClubPeriodAnalytics;
  week: ClubPeriodAnalytics;
  month: ClubPeriodAnalytics;
  prevWeek: ClubPeriodAnalytics;
};

const VIBES: Vibe[] = ['CHARGED', 'SOLID', 'MEH', 'DRAGGING', 'ZOMBIE'];

function isVibe(value: unknown): value is Vibe {
  return typeof value === 'string' && (VIBES as string[]).includes(value);
}

function numOrNull(v: unknown): number | null {
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function mapVibeMix(raw: unknown): ClubVibeMixItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const row = item as Record<string, unknown>;
      if (!isVibe(row.vibe)) return null;
      return {
        vibe: row.vibe,
        count: Number(row.count) || 0,
        pct: Number(row.pct) || 0,
      };
    })
    .filter((v): v is ClubVibeMixItem => v != null && v.count > 0);
}

function mapMvp(raw: unknown): ClubMvp | null {
  if (!raw || typeof raw !== 'object') return null;
  const row = raw as Record<string, unknown>;
  if (typeof row.userId !== 'string' || typeof row.username !== 'string') return null;
  return {
    userId: row.userId,
    username: row.username,
    avatarUrl: typeof row.avatarUrl === 'string' ? row.avatarUrl : null,
    asleepMinutes: Number(row.asleepMinutes) || 0,
    nightsLogged: Number(row.nightsLogged) || 0,
    reason: row.reason === 'most_nights' ? 'most_nights' : 'longest_sleep',
  };
}

function mapConsistency(raw: unknown): ClubConsistencyRow[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const row = item as Record<string, unknown>;
      if (typeof row.userId !== 'string' || typeof row.username !== 'string') return null;
      return {
        userId: row.userId,
        username: row.username,
        avatarUrl: typeof row.avatarUrl === 'string' ? row.avatarUrl : null,
        nightsLogged: Number(row.nightsLogged) || 0,
        possibleNights: Number(row.possibleNights) || 0,
        avgAsleepMinutes: numOrNull(row.avgAsleepMinutes),
      };
    })
    .filter((v): v is ClubConsistencyRow => v != null);
}

function mapYouVsClub(raw: unknown): ClubYouVsClub | null {
  if (!raw || typeof raw !== 'object') return null;
  const row = raw as Record<string, unknown>;
  return {
    yourAsleepMinutes: numOrNull(row.yourAsleepMinutes),
    clubAsleepMinutes: numOrNull(row.clubAsleepMinutes),
    yourDeepPct: numOrNull(row.yourDeepPct),
    clubDeepPct: numOrNull(row.clubDeepPct),
    yourRemPct: numOrNull(row.yourRemPct),
    clubRemPct: numOrNull(row.clubRemPct),
  };
}

function mapPeriod(raw: unknown): ClubPeriodAnalytics {
  const row = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  return {
    postsCount: Number(row.postsCount) || 0,
    loggedMembers: Number(row.loggedMembers) || 0,
    memberCount: Number(row.memberCount) || 0,
    possibleNights: Number(row.possibleNights) || 1,
    avgAsleepMinutes: numOrNull(row.avgAsleepMinutes),
    avgDeepMinutes: numOrNull(row.avgDeepMinutes),
    avgRemMinutes: numOrNull(row.avgRemMinutes),
    avgCoreMinutes: numOrNull(row.avgCoreMinutes),
    deepPct: numOrNull(row.deepPct),
    remPct: numOrNull(row.remPct),
    corePct: numOrNull(row.corePct),
    dreamRate: numOrNull(row.dreamRate),
    buddyNightCount: Number(row.buddyNightCount) || 0,
    buddyNightRate: numOrNull(row.buddyNightRate),
    vibeMix: mapVibeMix(row.vibeMix),
    dominantVibe: isVibe(row.dominantVibe) ? row.dominantVibe : null,
    mvp: mapMvp(row.mvp),
    consistency: mapConsistency(row.consistency),
    youVsClub: mapYouVsClub(row.youVsClub),
    bedtimeSpreadMinutes: numOrNull(row.bedtimeSpreadMinutes),
    wakeSyncPct: numOrNull(row.wakeSyncPct),
  };
}

export function mapClubAnalyticsRow(raw: unknown): ClubAnalytics {
  const row = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  return {
    memberCount: Number(row.memberCount) || 0,
    dayDate: typeof row.dayDate === 'string' ? row.dayDate : '',
    viewerUserId: typeof row.viewerUserId === 'string' ? row.viewerUserId : null,
    loggingStreakDays: Number(row.loggingStreakDays) || 0,
    day: mapPeriod(row.day),
    week: mapPeriod(row.week),
    month: mapPeriod(row.month),
    prevWeek: mapPeriod(row.prevWeek),
  };
}

export function emptyClubPeriodAnalytics(): ClubPeriodAnalytics {
  return {
    postsCount: 0,
    loggedMembers: 0,
    memberCount: 0,
    possibleNights: 1,
    avgAsleepMinutes: null,
    avgDeepMinutes: null,
    avgRemMinutes: null,
    avgCoreMinutes: null,
    deepPct: null,
    remPct: null,
    corePct: null,
    dreamRate: null,
    buddyNightCount: 0,
    buddyNightRate: null,
    vibeMix: [],
    dominantVibe: null,
    mvp: null,
    consistency: [],
    youVsClub: null,
    bedtimeSpreadMinutes: null,
    wakeSyncPct: null,
  };
}

const FORECAST: Record<Vibe, { title: string; detail: string }> = {
  CHARGED: { title: 'Charged crew', detail: 'The club woke up ready — lean into the energy.' },
  SOLID: { title: 'Solid night', detail: 'Steady vibes across the club. Keep the streak going.' },
  MEH: { title: 'Neutral wave', detail: 'A middling morning. Soft day ahead is fine.' },
  DRAGGING: { title: 'Coffee watch', detail: 'The club is dragging — caffeine and kindness recommended.' },
  ZOMBIE: { title: 'Zombie watch', detail: 'Rough night club-wide. Easy mode today.' },
};

export function clubForecast(dominant: Vibe | null): { emoji: string; title: string; detail: string } | null {
  if (!dominant) return null;
  const meta = VIBE_CONFIG[dominant];
  const copy = FORECAST[dominant];
  return { emoji: meta.emoji, title: copy.title, detail: copy.detail };
}

export function clubMoodSwing(
  current: Vibe | null,
  previous: Vibe | null,
): string | null {
  if (!current || !previous || current === previous) return null;
  return `${VIBE_CONFIG[previous].emoji} ${VIBE_CONFIG[previous].label} → ${VIBE_CONFIG[current].emoji} ${VIBE_CONFIG[current].label}`;
}

export function clubAchievements(stats: ClubPeriodAnalytics): ClubAchievement[] {
  const out: ClubAchievement[] = [];
  if (stats.memberCount > 0 && stats.loggedMembers >= stats.memberCount) {
    out.push({ id: 'full_log', emoji: '💯', label: 'Full log night' });
  }
  if ((stats.deepPct ?? 0) >= 20) {
    out.push({ id: 'deep_pack', emoji: '💜', label: 'Deep pack' });
  }
  if (stats.vibeMix.length >= 5) {
    out.push({ id: 'all_vibes', emoji: '🌈', label: 'All vibes' });
  }
  if ((stats.dreamRate ?? 0) >= 50) {
    out.push({ id: 'dreamy', emoji: '💭', label: 'Dreamy club' });
  }
  if ((stats.wakeSyncPct ?? 0) >= 70) {
    out.push({ id: 'wake_sync', emoji: '⏰', label: 'Wake sync' });
  }
  if (stats.buddyNightCount > 0) {
    out.push({ id: 'buddy_night', emoji: '👯', label: 'Buddy nights' });
  }
  return out;
}

export function formatClubRecapText(args: {
  clubName?: string;
  periodLabel: string;
  stats: ClubPeriodAnalytics;
  loggingStreakDays: number;
}): string {
  const { clubName, periodLabel, stats, loggingStreakDays } = args;
  const vibe = stats.dominantVibe ? VIBE_CONFIG[stats.dominantVibe] : null;
  const lines = [
    clubName ? `${clubName} — ${periodLabel}` : `Club — ${periodLabel}`,
    stats.avgAsleepMinutes != null ? `Avg sleep: ${Math.round(stats.avgAsleepMinutes / 60 * 10) / 10}h` : null,
    `Logged: ${stats.loggedMembers}/${stats.memberCount || '?'}`,
    vibe ? `Vibe: ${vibe.emoji} ${vibe.label}` : null,
    stats.mvp ? `MVP: @${stats.mvp.username}` : null,
    loggingStreakDays > 1 ? `Logging streak: ${loggingStreakDays} days` : null,
    'via Slumber',
  ].filter(Boolean);
  return lines.join('\n');
}
