import type { DreamMood, Vibe } from './types';
import {
  DREAM_MOOD_CONFIG,
  DREAM_MOOD_OPTIONS,
  VIBE_CONFIG,
} from './sleepPostMeta';
import { formatMins } from './format';

/** Known contributing-factor labels when TagsService map isn't passed in. */
const FACTOR_FALLBACK: Record<string, { emoji: string; label: string }> = {
  LATE_CAFFEINE: { emoji: '☕', label: 'Late Caffeine' },
  ALCOHOL: { emoji: '🍺', label: 'Alcohol' },
  LATE_WORKOUT: { emoji: '🏋️', label: 'Late Workout' },
  SCREEN_TIME: { emoji: '📱', label: 'Screen Time' },
  HEAVY_MEAL: { emoji: '🍕', label: 'Heavy Meal' },
  HIGH_STRESS: { emoji: '🧠', label: 'High Stress' },
  CANNABIS: { emoji: '🌿', label: 'Cannabis' },
  MELATONIN: { emoji: '💊', label: 'Melatonin' },
};

export type DreamAnalyticsRow = {
  sleepDate: string;
  asleepMinutes: number;
  remMinutes: number | null;
  deepMinutes: number | null;
  coreMinutes: number | null;
  vibe: Vibe | null;
  tags: string[];
  hasDreamLog: boolean;
  dreamMood: DreamMood | null;
};

export type DreamMoodMix = {
  mood: DreamMood;
  emoji: string;
  label: string;
  count: number;
  pct: number;
};

/** Per dream-tone snapshot: sleep length, cycle mix, and usual morning vibe. */
export type DreamMoodProfile = {
  mood: DreamMood;
  emoji: string;
  label: string;
  count: number;
  pct: number;
  avgAsleepMinutes: number | null;
  avgRemMinutes: number | null;
  avgDeepMinutes: number | null;
  remPct: number | null;
  deepPct: number | null;
  topVibe: Vibe | null;
  topVibeEmoji: string | null;
  topVibeLabel: string | null;
  topVibePct: number | null;
};

export type DreamFactorHit = {
  tag: string;
  emoji: string;
  label: string;
  nights: number;
  nightmareRate: number;
  baselineNightmareRate: number;
};

export type DreamSleepAnalytics = {
  windowDays: number;
  totalNights: number;
  dreamsLogged: number;
  recallRate: number | null;
  withMood: number;
  moodMix: DreamMoodMix[];
  moodProfiles: DreamMoodProfile[];
  factorHits: DreamFactorHit[];
  /** Top takeaway for the hero card. */
  highlight: string | null;
  insights: string[];
};

const MIN_BUCKET = 2;
const MIN_FACTOR_NIGHTS = 3;
const POSITIVE_MOODS: DreamMood[] = ['GOOD', 'VIVID'];
const ROUGH_MOODS: DreamMood[] = ['NIGHTMARE', 'WEIRD'];
const POSITIVE_VIBES: Vibe[] = ['CHARGED', 'SOLID'];
const ROUGH_VIBES: Vibe[] = ['DRAGGING', 'ZOMBIE', 'MEH'];

function addNullable(a: number | null, b: number | null): number | null {
  if (a == null && b == null) return null;
  return (a ?? 0) + (b ?? 0);
}

/** One row per wake morning so nap siblings don't inflate recall rate. */
function collapseDreamRowsByNight(rows: DreamAnalyticsRow[]): DreamAnalyticsRow[] {
  const byDate = new Map<string, DreamAnalyticsRow>();
  for (const row of rows) {
    const cur = byDate.get(row.sleepDate);
    if (!cur) {
      byDate.set(row.sleepDate, { ...row, tags: [...row.tags] });
      continue;
    }
    cur.asleepMinutes += row.asleepMinutes;
    cur.remMinutes = addNullable(cur.remMinutes, row.remMinutes);
    cur.deepMinutes = addNullable(cur.deepMinutes, row.deepMinutes);
    cur.coreMinutes = addNullable(cur.coreMinutes, row.coreMinutes);
    if (!cur.vibe && row.vibe) cur.vibe = row.vibe;
    if (row.hasDreamLog) {
      cur.hasDreamLog = true;
      if (!cur.dreamMood && row.dreamMood) cur.dreamMood = row.dreamMood;
    }
    for (const tag of row.tags) {
      if (!cur.tags.includes(tag)) cur.tags.push(tag);
    }
  }
  return [...byDate.values()];
}

/** Build dream analytics from sleep-night rows (typically last 90 days). */
export function buildDreamSleepAnalytics(
  rows: DreamAnalyticsRow[],
  opts?: {
    windowDays?: number;
    tagLabelMap?: Record<string, { label: string; emoji: string }>;
  },
): DreamSleepAnalytics {
  const windowDays = opts?.windowDays ?? 90;
  const tagLabelMap = opts?.tagLabelMap ?? FACTOR_FALLBACK;
  const nights = collapseDreamRowsByNight(rows);

  const totalNights = nights.length;
  const withLog = nights.filter((r) => r.hasDreamLog);
  const withMood = nights.filter((r) => r.dreamMood != null);
  const dreamsLogged = withLog.length;
  const recallRate = totalNights > 0
    ? Math.round((dreamsLogged / totalNights) * 100)
    : null;

  const moodCounts = new Map<DreamMood, number>();
  for (const r of withMood) {
    moodCounts.set(r.dreamMood!, (moodCounts.get(r.dreamMood!) ?? 0) + 1);
  }
  const moodTotal = withMood.length;
  const moodMix: DreamMoodMix[] = DREAM_MOOD_OPTIONS
    .map((opt) => {
      const count = moodCounts.get(opt.value) ?? 0;
      if (count === 0) return null;
      return {
        mood: opt.value,
        emoji: opt.emoji,
        label: opt.label,
        count,
        pct: moodTotal > 0 ? Math.round((count / moodTotal) * 100) : 0,
      };
    })
    .filter((x): x is DreamMoodMix => x != null)
    .sort((a, b) => b.count - a.count);

  const moodProfiles = buildMoodProfiles(withMood, moodTotal);
  const factorHits = buildFactorHits(withMood, tagLabelMap);
  const insights = buildInsights({
    recallRate,
    dreamsLogged,
    totalNights,
    moodMix,
    moodProfiles,
    factorHits,
    withMood,
  });

  return {
    windowDays,
    totalNights,
    dreamsLogged,
    recallRate,
    withMood: moodTotal,
    moodMix,
    moodProfiles,
    factorHits,
    highlight: insights[0] ?? null,
    insights,
  };
}

function buildMoodProfiles(rows: DreamAnalyticsRow[], moodTotal: number): DreamMoodProfile[] {
  return DREAM_MOOD_OPTIONS
    .map((opt) => {
      const nights = rows.filter((r) => r.dreamMood === opt.value);
      if (nights.length === 0) return null;

      const asleep = avgOf(nights.map((r) => r.asleepMinutes).filter((n) => n > 0));
      const rem = avgOf(nights.map((r) => r.remMinutes).filter((n): n is number => n != null && n > 0));
      const deep = avgOf(nights.map((r) => r.deepMinutes).filter((n): n is number => n != null && n > 0));

      // Stage % from nights that have stage minutes + asleep
      const remPcts: number[] = [];
      const deepPcts: number[] = [];
      for (const r of nights) {
        if (!(r.asleepMinutes > 0)) continue;
        if (r.remMinutes != null && r.remMinutes >= 0) {
          remPcts.push(Math.round((r.remMinutes / r.asleepMinutes) * 100));
        }
        if (r.deepMinutes != null && r.deepMinutes >= 0) {
          deepPcts.push(Math.round((r.deepMinutes / r.asleepMinutes) * 100));
        }
      }

      const vibeCounts = new Map<Vibe, number>();
      let vibeNights = 0;
      for (const r of nights) {
        if (!r.vibe) continue;
        vibeNights += 1;
        vibeCounts.set(r.vibe, (vibeCounts.get(r.vibe) ?? 0) + 1);
      }

      let topVibe: Vibe | null = null;
      let topCount = 0;
      for (const [vibe, count] of vibeCounts) {
        if (count > topCount) {
          topVibe = vibe;
          topCount = count;
        }
      }
      const vibeReady = topVibe && vibeNights >= MIN_BUCKET && topCount >= MIN_BUCKET;
      const vibeMeta = vibeReady && topVibe ? VIBE_CONFIG[topVibe] : null;

      return {
        mood: opt.value,
        emoji: opt.emoji,
        label: opt.label,
        count: nights.length,
        pct: moodTotal > 0 ? Math.round((nights.length / moodTotal) * 100) : 0,
        avgAsleepMinutes: asleep,
        avgRemMinutes: rem,
        avgDeepMinutes: deep,
        remPct: avgOf(remPcts),
        deepPct: avgOf(deepPcts),
        topVibe: vibeReady ? topVibe : null,
        topVibeEmoji: vibeMeta?.emoji ?? null,
        topVibeLabel: vibeMeta?.label ?? null,
        topVibePct: vibeReady ? Math.round((topCount / vibeNights) * 100) : null,
      } satisfies DreamMoodProfile;
    })
    .filter((x): x is DreamMoodProfile => x != null)
    .sort((a, b) => b.count - a.count);
}

function avgOf(values: number[]): number | null {
  if (!values.length) return null;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

function buildFactorHits(
  dreamRows: DreamAnalyticsRow[],
  tagLabelMap: Record<string, { label: string; emoji: string }>,
): DreamFactorHit[] {
  if (dreamRows.length < MIN_FACTOR_NIGHTS) return [];

  const baselineNightmares = dreamRows.filter((r) => r.dreamMood === 'NIGHTMARE').length;
  const baselineNightmareRate = Math.round((baselineNightmares / dreamRows.length) * 100);

  const tagNights = new Map<string, DreamAnalyticsRow[]>();
  for (const row of dreamRows) {
    for (const tag of row.tags) {
      if (!tag) continue;
      const list = tagNights.get(tag) ?? [];
      list.push(row);
      tagNights.set(tag, list);
    }
  }

  const hits: DreamFactorHit[] = [];
  for (const [tag, nights] of tagNights) {
    if (nights.length < MIN_FACTOR_NIGHTS) continue;
    const nightmares = nights.filter((r) => r.dreamMood === 'NIGHTMARE').length;
    const nightmareRate = Math.round((nightmares / nights.length) * 100);
    if (Math.abs(nightmareRate - baselineNightmareRate) < 15) continue;

    const meta = tagLabelMap[tag] ?? FACTOR_FALLBACK[tag] ?? { emoji: '🏷️', label: tag };
    hits.push({
      tag,
      emoji: meta.emoji,
      label: meta.label,
      nights: nights.length,
      nightmareRate,
      baselineNightmareRate,
    });
  }

  return hits.sort((a, b) => Math.abs(b.nightmareRate - b.baselineNightmareRate)
    - Math.abs(a.nightmareRate - a.baselineNightmareRate)).slice(0, 3);
}

function buildInsights(input: {
  recallRate: number | null;
  dreamsLogged: number;
  totalNights: number;
  moodMix: DreamMoodMix[];
  moodProfiles: DreamMoodProfile[];
  factorHits: DreamFactorHit[];
  withMood: DreamAnalyticsRow[];
}): string[] {
  const insights: string[] = [];

  // Dream tone → morning vibe (strongest product story)
  const vibeInsight = moodVibeInsight(input.withMood);
  if (vibeInsight) insights.push(vibeInsight);

  // Sleep cycles: REM / deep differences across dream tones
  const remInsight = stageDeltaInsight(input.moodProfiles, 'rem');
  if (remInsight) insights.push(remInsight);
  else {
    const deepInsight = stageDeltaInsight(input.moodProfiles, 'deep');
    if (deepInsight) insights.push(deepInsight);
  }

  // Sleep length vs dream tone
  const sleepInsight = sleepDeltaInsight(input.moodProfiles);
  if (sleepInsight) insights.push(sleepInsight);

  const topFactor = input.factorHits[0];
  if (topFactor && insights.length < 3) {
    const delta = topFactor.nightmareRate - topFactor.baselineNightmareRate;
    const sign = delta > 0 ? '+' : '';
    insights.push(
      `${topFactor.emoji} ${topFactor.label}: nightmares ${sign}${delta} pts vs your usual (${topFactor.nightmareRate}% on those nights).`,
    );
  }

  if (input.recallRate != null && input.totalNights >= 5 && insights.length < 2) {
    if (input.dreamsLogged === 0) {
      insights.push('Journal a few dreams and tag how they felt to unlock patterns.');
    } else {
      insights.push(`Dream recall ${input.recallRate}% · ${input.dreamsLogged} nights journaled.`);
    }
  }

  if (input.moodMix[0] && input.moodMix[0].count >= MIN_BUCKET && insights.length < 2) {
    const top = input.moodMix[0];
    insights.push(`Most common dream tone: ${top.emoji} ${top.label.toLowerCase()} (${top.pct}%).`);
  }

  return insights.slice(0, 3);
}

function moodVibeInsight(rows: DreamAnalyticsRow[]): string | null {
  const roughNights = rows.filter((r) => r.dreamMood && ROUGH_MOODS.includes(r.dreamMood) && r.vibe);
  const goodNights = rows.filter((r) => r.dreamMood && POSITIVE_MOODS.includes(r.dreamMood) && r.vibe);

  if (roughNights.length >= MIN_BUCKET) {
    const roughMorning = roughNights.filter((r) => r.vibe && ROUGH_VIBES.includes(r.vibe)).length;
    const pct = Math.round((roughMorning / roughNights.length) * 100);
    if (pct >= 50) {
      return `After nightmare/weird dreams, mornings land rough ${pct}% of the time.`;
    }
  }

  if (goodNights.length >= MIN_BUCKET) {
    const goodMorning = goodNights.filter((r) => r.vibe && POSITIVE_VIBES.includes(r.vibe)).length;
    const pct = Math.round((goodMorning / goodNights.length) * 100);
    if (pct >= 50) {
      return `After good/vivid dreams, you wake Charged or Solid ${pct}% of the time.`;
    }
  }

  // Fallback: top profile vibe link
  return null;
}

function stageDeltaInsight(
  profiles: DreamMoodProfile[],
  stage: 'rem' | 'deep',
): string | null {
  const ranked = profiles
    .filter((p) => p.count >= MIN_BUCKET && (stage === 'rem' ? p.remPct != null : p.deepPct != null))
    .map((p) => ({
      ...p,
      value: (stage === 'rem' ? p.remPct : p.deepPct) as number,
    }))
    .sort((a, b) => b.value - a.value);

  if (ranked.length < 2) return null;
  const best = ranked[0];
  const worst = ranked[ranked.length - 1];
  if (best.mood === worst.mood) return null;
  const delta = best.value - worst.value;
  if (delta < 5) return null;

  const label = stage === 'rem' ? 'REM' : 'deep';
  return `${best.emoji} ${best.label} nights lean ${label}-heavier (${best.value}% vs ${worst.value}% on ${worst.label.toLowerCase()}).`;
}

function sleepDeltaInsight(profiles: DreamMoodProfile[]): string | null {
  const ranked = profiles
    .filter((p) => p.count >= MIN_BUCKET && p.avgAsleepMinutes != null)
    .map((p) => ({ ...p, value: p.avgAsleepMinutes as number }))
    .sort((a, b) => b.value - a.value);

  if (ranked.length < 2) return null;
  const best = ranked[0];
  const worst = ranked[ranked.length - 1];
  if (best.mood === worst.mood) return null;
  const delta = best.value - worst.value;
  if (delta < 15) return null;

  return `${best.emoji} ${DREAM_MOOD_CONFIG[best.mood].label} nights avg ${formatMins(best.value)} — ${formatMins(delta)} more than ${worst.label.toLowerCase()}.`;
}
