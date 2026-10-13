import { addDaysToDateISO, getLocalDateISO } from './dates';
import { buildDreamSleepAnalytics, type DreamAnalyticsRow, type DreamSleepAnalytics } from './dreamAnalytics';
import { filterWearableSleepRows } from './sleepPostCustom';
import { supabase } from './supabase';
import { getCachedTagLabelMap, loadTags } from './tags';
import type { DreamMood, Vibe } from './types';

const VIBES = new Set<string>(['CHARGED', 'SOLID', 'MEH', 'DRAGGING', 'ZOMBIE']);
const MOODS = new Set<string>(['NIGHTMARE', 'WEIRD', 'NEUTRAL', 'GOOD', 'VIVID']);

type DreamRow = {
  sleep_date: string;
  asleep_minutes: number | null;
  rem_minutes: number | null;
  deep_minutes: number | null;
  core_minutes: number | null;
  vibe: string | null;
  tags: string[] | null;
  dream_log: string | null;
  dream_mood: string | null;
  is_custom?: boolean | null;
  source_device?: string | null;
};

/** Dream journal recall, mood, and factor notes for the last 90 days. */
export async function fetchDreamSleepAnalytics(userId: string): Promise<DreamSleepAnalytics> {
  const windowDays = 90;
  const since = addDaysToDateISO(getLocalDateISO(), -windowDays);
  const { data, error } = await supabase
    .from('sleep_posts')
    .select('sleep_date, asleep_minutes, rem_minutes, deep_minutes, core_minutes, vibe, tags, dream_log, dream_mood, is_custom, source_device')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .not('asleep_minutes', 'is', null)
    .gte('sleep_date', since)
    .order('sleep_date', { ascending: false })
    .limit(200);

  if (error) throw error;

  await loadTags();

  const rows: DreamAnalyticsRow[] = filterWearableSleepRows((data ?? []) as DreamRow[])
    .flatMap((row) => {
      const asleep = row.asleep_minutes ?? 0;
      if (asleep <= 0) return [];
      return [{
        sleepDate: row.sleep_date,
        asleepMinutes: asleep,
        remMinutes: row.rem_minutes,
        deepMinutes: row.deep_minutes,
        coreMinutes: row.core_minutes,
        vibe: row.vibe && VIBES.has(row.vibe) ? row.vibe as Vibe : null,
        tags: row.tags ?? [],
        hasDreamLog: !!row.dream_log?.trim(),
        dreamMood: row.dream_mood && MOODS.has(row.dream_mood) ? row.dream_mood as DreamMood : null,
      }];
    });

  return buildDreamSleepAnalytics(rows, {
    windowDays,
    tagLabelMap: getCachedTagLabelMap(),
  });
}
