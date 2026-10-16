import { formatMins, formatPct } from './format';
import { parseClockToMinutes } from './napDay';

/**
 * Friend-vs-you sleep compatibility from period averages.
 *
 * Works for rolling 30-day `PeriodStats` and calendar-month `MonthBest`
 * (via `habitsFromMonthBest`). Same formula either way.
 *
 * Timing carries the score, then duration. Stage mix and wakes count less,
 * because watches disagree on them. Each gap uses exp(-gap / tau): identical
 * inputs are 100, a larger gap always scores lower, and there is no cliff
 * where extra minutes stop mattering. Taus are set so ordinary friend gaps
 * (clocks roughly 30–120 minutes apart, or a closer clock with a different
 * length) usually land in the 55–86 range. A 30-minute shift on both clocks,
 * with the same time asleep, stages, wakes, and dream rate, is about 86.
 * 90+ means the clocks and time asleep are within about 20 minutes. Dream
 * rate is scored, but only a few points, and it is dropped when either side
 * has no rate.
 *
 * Only the size of each gap counts, not which person is earlier or sleeps
 * longer. A factor is dropped when either person lacks it, and the rest are
 * renormalized, so a Whoop user (no deep or REM) still compares with someone
 * on a staged watch using bedtime, wake, duration, and wakes. 100 means the
 * factors both people have are the same.
 */

export const SLEEP_COMPAT_WINDOW_DAYS = 30;
export const MIN_SLEEP_COMPAT_NIGHTS = 3;

const DAY_MINUTES = 1440;
/**
 * Gap that multiplies that factor's similarity by 1/e (~0.37).
 * Clock tau is the main knob for the 55–86 band: 30 minutes on both clocks,
 * everything else matched, is about 86.
 */
const CLOCK_TAU_MINUTES = 105;
const DURATION_TAU_MINUTES = 90;
const WAKES_TAU = 4.2;
/** Combined deep + REM below this is undifferentiated sleep, not a stage mix. */
const MIN_STAGED_PCT = 8;
/** L1 of shared stage percentages (deep + REM + core). */
const STAGE_L1_TAU = 60;
/** Dream-rate gap, in percentage points, that leaves ~37% of this factor. */
const DREAM_RATE_TAU = 50;

const WEIGHTS = {
  /** Average of bedtime and wake closeness. The main, device-independent signal. */
  schedule: 55,
  /** Similar average asleep minutes. Also comparable across Whoop and staged watches. */
  duration: 23,
  /** Similar deep/REM/core mix, only when both sides have a real breakdown. */
  stageMix: 8,
  /** Similar average wake events. */
  wakes: 10,
  /** Similar share of nights with a dream. Small on purpose. */
  dreams: 4,
} as const;

export type SleepCompatibilityHabits = {
  postsCount: number;
  asleep: number | null;
  avgBedtime: string | null;
  avgWakeTime: string | null;
  deepPct: number | null;
  remPct: number | null;
  corePct: number | null;
  awakeEvents: number | null;
  dreamRate: number | null;
};

/** Calendar-month (or other window) averages — same shape `MonthBest` already has. */
export type MonthSleepHabitsInput = {
  nightCount: number;
  avgAsleepMinutes: number;
  avgBedtime: string | null;
  avgWakeTime: string | null;
  avgDeepPct: number | null;
  avgRemPct: number | null;
  avgCorePct: number | null;
  avgAwakeEvents: number | null;
  /** Optional — calendar months may omit dream rate until nights carry it. */
  dreamRate?: number | null;
};

export function habitsFromMonthBest(month: MonthSleepHabitsInput): SleepCompatibilityHabits {
  const nightCount = month.nightCount ?? 0;
  const avgAsleep = month.avgAsleepMinutes ?? 0;
  return {
    postsCount: nightCount,
    asleep: avgAsleep > 0 ? avgAsleep : null,
    avgBedtime: month.avgBedtime ?? null,
    avgWakeTime: month.avgWakeTime ?? null,
    deepPct: month.avgDeepPct ?? null,
    remPct: month.avgRemPct ?? null,
    corePct: month.avgCorePct ?? null,
    awakeEvents: month.avgAwakeEvents ?? null,
    dreamRate: month.dreamRate ?? null,
  };
}

export type SleepCompatibilityDimensionKey =
  | 'schedule'
  | 'duration'
  | 'stageMix'
  | 'wakes'
  | 'dreams';

export const SLEEP_COMPAT_FACTOR_LABELS: Record<SleepCompatibilityDimensionKey, string> = {
  schedule: 'Sleep timing',
  duration: 'Duration',
  stageMix: 'Stage mix',
  wakes: 'Wakes',
  dreams: 'Dreams',
};

export type SleepCompatibilityDimension = {
  key: SleepCompatibilityDimensionKey;
  weight: number;
  /** 0–1 similarity; omitted when that input is missing for either person. */
  unitScore: number;
};

export type SleepCompatibilityFactor = {
  key: SleepCompatibilityDimensionKey;
  label: string;
  /** Original formula weight (sums to 100 when every dimension is present). */
  weight: number;
  /** 0–1 similarity for this dimension. */
  unitScore: number;
  /** Integer 0–100 similarity for this dimension (popup % column). */
  subscore: number;
  /** Points this factor adds to the displayed 0–100 score (renormalized). Integers sum to `score`. */
  contribution: number;
  /** Formatted value for you (info affordance). */
  selfValue: string;
  /** Formatted value for the friend (info affordance). */
  friendValue: string;
};

export type SleepCompatibilityScore = {
  /** Integer 0–100. */
  score: number;
  /** 1–2 short phrases for UI (e.g. "Similar bedtime", "Close avg sleep"). */
  reasons: string[];
  parts: SleepCompatibilityDimension[];
  /** Included dimensions in formula order, with renormalized points that add to `score`. */
  factors: SleepCompatibilityFactor[];
  /** Factors skipped because one or both sides had no comparable data. */
  omitted: SleepCompatibilityDimensionKey[];
};

export type SleepCompatibilityRanking = SleepCompatibilityScore & {
  id: string;
  username: string;
};

function clamp01(n: number): number {
  if (n <= 0) return 0;
  if (n >= 1) return 1;
  return n;
}

/** Symmetric decay. A gap of `tau` leaves about 37% of that factor's similarity. */
function gapSimilarity(absGap: number, tau: number): number {
  if (tau <= 0) return absGap === 0 ? 1 : 0;
  if (absGap <= 0) return 1;
  return Math.exp(-absGap / tau);
}

export function circularMinutesDelta(a: number, b: number): number {
  const raw = Math.abs(a - b) % DAY_MINUTES;
  return Math.min(raw, DAY_MINUTES - raw);
}

function linearOverlap(a0: number, a1: number, b0: number, b1: number): number {
  return Math.max(0, Math.min(a1, b1) - Math.max(a0, b0));
}

/** Overlap minutes of two clock intervals (start + duration), wrapping midnight. */
export function circularIntervalOverlapMinutes(
  aStart: number,
  aDuration: number,
  bStart: number,
  bDuration: number,
): number {
  const wrap = (n: number) => ((n % DAY_MINUTES) + DAY_MINUTES) % DAY_MINUTES;
  const a0 = wrap(aStart);
  const b0 = wrap(bStart);
  const aDur = Math.max(0, Math.min(aDuration, DAY_MINUTES));
  const bDur = Math.max(0, Math.min(bDuration, DAY_MINUTES));
  if (aDur <= 0 || bDur <= 0) return 0;
  return Math.max(
    linearOverlap(a0, a0 + aDur, b0, b0 + bDur),
    linearOverlap(a0, a0 + aDur, b0 + DAY_MINUTES, b0 + DAY_MINUTES + bDur),
    linearOverlap(a0 + DAY_MINUTES, a0 + DAY_MINUTES + aDur, b0, b0 + bDur),
  );
}

/**
 * A real hypnogram has meaningful deep or REM. All-core, or only a trace of
 * stages, is undifferentiated sleep (Whoop and similar devices). Those nights
 * still compare on timing, duration, and wakes.
 */
export function hasStageBreakdown(h: SleepCompatibilityHabits): boolean {
  if (h.deepPct == null && h.remPct == null) return false;
  return (h.deepPct ?? 0) + (h.remPct ?? 0) >= MIN_STAGED_PCT;
}

function stageMixSimilarity(a: SleepCompatibilityHabits, b: SleepCompatibilityHabits): number | null {
  if (!hasStageBreakdown(a) || !hasStageBreakdown(b)) return null;
  const pairs: [number, number][] = [];
  const consider = (left: number | null, right: number | null) => {
    if (left == null || right == null) return;
    pairs.push([left, right]);
  };
  consider(a.deepPct, b.deepPct);
  consider(a.remPct, b.remPct);
  consider(a.corePct, b.corePct);
  if (pairs.length === 0) return null;
  const l1 = pairs.reduce((sum, [left, right]) => sum + Math.abs(left - right), 0);
  return gapSimilarity(l1, STAGE_L1_TAU);
}

function clockSimilarity(a: string | null, b: string | null): number | null {
  const aa = parseClockToMinutes(a);
  const bb = parseClockToMinutes(b);
  if (aa == null || bb == null) return null;
  return gapSimilarity(circularMinutesDelta(aa, bb), CLOCK_TAU_MINUTES);
}

/** Bedtime and wake, averaged. Length of the night is the duration factor. */
function scheduleSimilarity(a: SleepCompatibilityHabits, b: SleepCompatibilityHabits): number | null {
  const bed = clockSimilarity(a.avgBedtime, b.avgBedtime);
  const wake = clockSimilarity(a.avgWakeTime, b.avgWakeTime);
  if (bed == null && wake == null) return null;
  if (bed == null) return wake;
  if (wake == null) return bed;
  return (bed + wake) / 2;
}

function durationSimilarity(a: SleepCompatibilityHabits, b: SleepCompatibilityHabits): number | null {
  if (a.asleep == null || b.asleep == null) return null;
  return gapSimilarity(Math.abs(a.asleep - b.asleep), DURATION_TAU_MINUTES);
}

function wakesSimilarity(a: SleepCompatibilityHabits, b: SleepCompatibilityHabits): number | null {
  if (a.awakeEvents == null || b.awakeEvents == null) return null;
  return gapSimilarity(Math.abs(a.awakeEvents - b.awakeEvents), WAKES_TAU);
}

function dreamSimilarity(a: SleepCompatibilityHabits, b: SleepCompatibilityHabits): number | null {
  if (a.dreamRate == null || b.dreamRate == null) return null;
  return gapSimilarity(Math.abs(a.dreamRate - b.dreamRate), DREAM_RATE_TAU);
}

function bedtimeDelta(a: SleepCompatibilityHabits, b: SleepCompatibilityHabits): number | null {
  const aa = parseClockToMinutes(a.avgBedtime);
  const bb = parseClockToMinutes(b.avgBedtime);
  if (aa == null || bb == null) return null;
  return circularMinutesDelta(aa, bb);
}

function wakeDelta(a: SleepCompatibilityHabits, b: SleepCompatibilityHabits): number | null {
  const aa = parseClockToMinutes(a.avgWakeTime);
  const bb = parseClockToMinutes(b.avgWakeTime);
  if (aa == null || bb == null) return null;
  return circularMinutesDelta(aa, bb);
}

function formatScheduleWindow(h: SleepCompatibilityHabits): string {
  if (!h.avgBedtime || !h.avgWakeTime) return '—';
  return `${h.avgBedtime}–${h.avgWakeTime}`;
}

function formatDurationValue(h: SleepCompatibilityHabits): string {
  if (h.asleep == null) return '—';
  return formatMins(Math.round(h.asleep));
}

function formatStageMixValue(h: SleepCompatibilityHabits): string {
  if (!hasStageBreakdown(h)) return '—';
  const deep = h.deepPct;
  const rem = h.remPct;
  const core = h.corePct;
  const part = (value: number | null) => (value == null ? '—' : `${Math.round(value)}%`);
  return `${part(deep)} / ${part(rem)} / ${part(core)}`;
}

function formatWakesValue(h: SleepCompatibilityHabits): string {
  if (h.awakeEvents == null) return '—';
  const n = Math.round(h.awakeEvents * 10) / 10;
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

function formatDreamValue(h: SleepCompatibilityHabits): string {
  if (h.dreamRate == null) return '—';
  return formatPct(h.dreamRate);
}

export function formatSleepCompatFactorValue(
  key: SleepCompatibilityDimensionKey,
  habits: SleepCompatibilityHabits,
): string {
  switch (key) {
    case 'schedule':
      return formatScheduleWindow(habits);
    case 'duration':
      return formatDurationValue(habits);
    case 'stageMix':
      return formatStageMixValue(habits);
    case 'wakes':
      return formatWakesValue(habits);
    case 'dreams':
      return formatDreamValue(habits);
    default:
      return '—';
  }
}

function buildReasons(
  a: SleepCompatibilityHabits,
  b: SleepCompatibilityHabits,
  parts: SleepCompatibilityDimension[],
): string[] {
  type Candidate = { label: string; contribution: number };
  const candidates: Candidate[] = [];
  const contrib = (key: SleepCompatibilityDimensionKey) => {
    const part = parts.find((p) => p.key === key);
    return part ? part.weight * part.unitScore : 0;
  };

  const schedule = parts.find((p) => p.key === 'schedule');
  if (schedule && schedule.unitScore >= 0.92) {
    candidates.push({ label: 'Similar sleep timing', contribution: contrib('schedule') });
  }

  const bed = bedtimeDelta(a, b);
  if (bed != null && bed <= 30) {
    candidates.push({
      label: 'Similar bedtime',
      contribution: contrib('schedule') + gapSimilarity(bed, CLOCK_TAU_MINUTES),
    });
  }

  const wake = wakeDelta(a, b);
  if (wake != null && wake <= 30) {
    candidates.push({
      label: 'Similar wake-up',
      contribution: contrib('schedule') + gapSimilarity(wake, CLOCK_TAU_MINUTES),
    });
  }

  if (a.asleep != null && b.asleep != null && Math.abs(a.asleep - b.asleep) <= 30) {
    candidates.push({ label: 'Close avg sleep', contribution: contrib('duration') });
  }

  const mix = parts.find((p) => p.key === 'stageMix');
  if (mix && mix.unitScore >= 0.9) {
    candidates.push({ label: 'Similar stage mix', contribution: contrib('stageMix') });
  }

  const wakes = parts.find((p) => p.key === 'wakes');
  if (wakes && a.awakeEvents != null && b.awakeEvents != null && Math.abs(a.awakeEvents - b.awakeEvents) <= 1) {
    candidates.push({ label: 'Similar wake-ups', contribution: contrib('wakes') });
  }

  if (
    a.dreamRate != null
    && b.dreamRate != null
    && Math.abs(a.dreamRate - b.dreamRate) <= 15
  ) {
    candidates.push({ label: 'Similar dream rate', contribution: contrib('dreams') });
  }

  if (candidates.length === 0) {
    const fallback: Record<SleepCompatibilityDimensionKey, string> = {
      schedule: 'Some schedule overlap',
      duration: 'Similar sleep length',
      stageMix: 'Similar stage mix',
      wakes: 'Similar wake-ups',
      dreams: 'Similar dream rate',
    };
    const best = [...parts].sort((x, y) => y.weight * y.unitScore - x.weight * x.unitScore)[0];
    if (best) candidates.push({ label: fallback[best.key], contribution: 1 });
  }

  candidates.sort((x, y) => y.contribution - x.contribution);
  const seen = new Set<string>();
  const reasons: string[] = [];
  for (const c of candidates) {
    if (seen.has(c.label)) continue;
    seen.add(c.label);
    reasons.push(c.label);
    if (reasons.length >= 2) break;
  }
  return reasons;
}

function hasEnoughNights(h: SleepCompatibilityHabits): boolean {
  return h.postsCount >= MIN_SLEEP_COMPAT_NIGHTS;
}

/** Largest-remainder integers that sum to `total` (usually the rounded score). */
function allocateIntegerContributions(raw: number[], total: number): number[] {
  const n = raw.length;
  if (n === 0) return [];
  const floors = raw.map((value) => Math.floor(value));
  let deficit = total - floors.reduce((sum, value) => sum + value, 0);
  const byFrac = raw
    .map((value, index) => ({ index, frac: value - Math.floor(value) }))
    .sort((a, b) => b.frac - a.frac || a.index - b.index);
  const out = [...floors];
  if (deficit > 0) {
    for (let k = 0; k < deficit; k++) {
      out[byFrac[k % n].index] += 1;
    }
  } else if (deficit < 0) {
    const bySmallFrac = [...byFrac].reverse();
    for (let k = 0; k < -deficit; k++) {
      const preferred = bySmallFrac[k % n].index;
      const idx = out[preferred] > 0 ? preferred : out.findIndex((value) => value > 0);
      if (idx >= 0) out[idx] -= 1;
    }
  }
  return out;
}

function buildFactors(
  parts: SleepCompatibilityDimension[],
  totalWeight: number,
  score: number,
  self: SleepCompatibilityHabits,
  friend: SleepCompatibilityHabits,
): SleepCompatibilityFactor[] {
  const rawContribs = parts.map((part) => (part.weight / totalWeight) * part.unitScore * 100);
  const contributions = allocateIntegerContributions(rawContribs, score);
  return parts.map((part, index) => ({
    key: part.key,
    label: SLEEP_COMPAT_FACTOR_LABELS[part.key],
    weight: part.weight,
    unitScore: part.unitScore,
    subscore: Math.round(clamp01(part.unitScore) * 100),
    contribution: contributions[index],
    selfValue: formatSleepCompatFactorValue(part.key, self),
    friendValue: formatSleepCompatFactorValue(part.key, friend),
  }));
}

/** Score two 30-day habit snapshots. Null when either side has too few nights. */
export function scoreSleepCompatibility(
  self: SleepCompatibilityHabits,
  friend: SleepCompatibilityHabits,
): SleepCompatibilityScore | null {
  if (!hasEnoughNights(self) || !hasEnoughNights(friend)) return null;

  const raw: { key: SleepCompatibilityDimensionKey; weight: number; unitScore: number | null }[] = [
    { key: 'schedule', weight: WEIGHTS.schedule, unitScore: scheduleSimilarity(self, friend) },
    { key: 'duration', weight: WEIGHTS.duration, unitScore: durationSimilarity(self, friend) },
    { key: 'stageMix', weight: WEIGHTS.stageMix, unitScore: stageMixSimilarity(self, friend) },
    { key: 'wakes', weight: WEIGHTS.wakes, unitScore: wakesSimilarity(self, friend) },
    { key: 'dreams', weight: WEIGHTS.dreams, unitScore: dreamSimilarity(self, friend) },
  ];

  const omitted = raw.filter((d) => d.unitScore == null).map((d) => d.key);
  const parts: SleepCompatibilityDimension[] = raw
    .filter((d): d is SleepCompatibilityDimension => d.unitScore != null);
  const totalWeight = parts.reduce((sum, d) => sum + d.weight, 0);
  if (totalWeight <= 0) return null;

  const unit = parts.reduce((sum, d) => sum + d.weight * d.unitScore, 0) / totalWeight;
  const score = Math.round(clamp01(unit) * 100);

  return {
    score,
    reasons: buildReasons(self, friend, parts),
    parts,
    factors: buildFactors(parts, totalWeight, score, self, friend),
    omitted,
  };
}

export type SleepCompatibilityFriendInput = {
  id: string;
  username: string;
  habits: SleepCompatibilityHabits | null;
};

export function rankSleepCompatibility(
  self: SleepCompatibilityHabits,
  friends: SleepCompatibilityFriendInput[],
): SleepCompatibilityRanking[] {
  const ranked: SleepCompatibilityRanking[] = [];
  for (const friend of friends) {
    if (!friend.habits) continue;
    const result = scoreSleepCompatibility(self, friend.habits);
    if (!result) continue;
    ranked.push({
      id: friend.id,
      username: friend.username,
      ...result,
    });
  }
  ranked.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return (a.username ?? '').localeCompare(b.username ?? '');
  });
  return ranked;
}
