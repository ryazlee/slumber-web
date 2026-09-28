import { supabase } from './supabase';

export type TagDefinition = {
  value: string;
  emoji: string;
  label: string;
};

const FALLBACK_TAGS: TagDefinition[] = [
  { value: 'LATE_CAFFEINE', emoji: '☕', label: 'Late Caffeine' },
  { value: 'ALCOHOL', emoji: '🍺', label: 'Alcohol' },
  { value: 'LATE_WORKOUT', emoji: '🏋️', label: 'Late Workout' },
  { value: 'SCREEN_TIME', emoji: '📱', label: 'Screen Time' },
  { value: 'HEAVY_MEAL', emoji: '🍕', label: 'Heavy Meal' },
  { value: 'HIGH_STRESS', emoji: '🧠', label: 'High Stress' },
  { value: 'CANNABIS', emoji: '🌿', label: 'Cannabis' },
  { value: 'MELATONIN', emoji: '💊', label: 'Melatonin' },
];

let _tags: TagDefinition[] | null = null;
let _labelMap: Record<string, { label: string; emoji: string }> | null = null;

function buildLabelMap(tags: TagDefinition[]): Record<string, { label: string; emoji: string }> {
  return tags.reduce<Record<string, { label: string; emoji: string }>>((acc, tag) => {
    acc[tag.value] = { label: tag.label, emoji: tag.emoji };
    return acc;
  }, {});
}

export async function loadTags(): Promise<TagDefinition[]> {
  if (_tags) return _tags;

  const { data, error } = await supabase
    .from('tags')
    .select('value, emoji, label')
    .order('sort_order', { ascending: true });

  _tags = error || !data?.length ? FALLBACK_TAGS : (data as TagDefinition[]);
  _labelMap = buildLabelMap(_tags);
  return _tags;
}

export function clearTagsCache(): void {
  _tags = null;
  _labelMap = null;
}

export function getCachedTags(): TagDefinition[] {
  return _tags ?? FALLBACK_TAGS;
}

export function getCachedTagLabelMap(): Record<string, { label: string; emoji: string }> {
  if (_labelMap) return _labelMap;
  _labelMap = buildLabelMap(getCachedTags());
  return _labelMap;
}

export function formatTagChip(tagKey: string): string {
  const resolved = getCachedTagLabelMap()[tagKey];
  return resolved ? `${resolved.emoji} ${resolved.label}` : tagKey;
}

export type VisiblePostTag = {
  value: string;
  text: string;
  pending: boolean;
};

/** Public catalog tags, plus the viewer's own pending suggestions. */
export function visiblePostTags(
  tags: string[],
  catalog: TagDefinition[] | undefined,
  pending: TagDefinition[],
): VisiblePostTag[] {
  const knownList = catalog ?? FALLBACK_TAGS;
  const known = new Map(knownList.map((tag) => [tag.value, tag]));
  const pendingByValue = new Map(pending.map((tag) => [tag.value, tag]));
  const chips: VisiblePostTag[] = [];

  for (const value of tags) {
    const pub = known.get(value);
    if (pub) {
      chips.push({ value, text: `${pub.emoji} ${pub.label}`, pending: false });
      continue;
    }
    const mine = pendingByValue.get(value);
    if (mine) {
      chips.push({ value, text: `${mine.emoji} ${mine.label}`, pending: true });
    }
  }

  return chips;
}

export async function loadMyPendingTags(): Promise<TagDefinition[]> {
  const { data, error } = await supabase.rpc('get_my_pending_tags');
  if (error || !data) return [];
  return data as TagDefinition[];
}
