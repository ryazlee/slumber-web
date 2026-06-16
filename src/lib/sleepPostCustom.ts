import type { SleepPost } from './types';

export const MANUAL_SLEEP_SOURCE_DEVICE = 'Custom';

export function isManualSleepPost(
  post: Pick<SleepPost, 'isCustom' | 'sourceDevice'>,
): boolean {
  return post.isCustom === true || post.sourceDevice === MANUAL_SLEEP_SOURCE_DEVICE;
}

export type ManualSleepRowFlags = {
  is_custom?: boolean | null;
  source_device?: string | null;
};

export function isManualSleepRow(row: ManualSleepRowFlags): boolean {
  return row.is_custom === true || row.source_device === MANUAL_SLEEP_SOURCE_DEVICE;
}

export function filterWearableSleepRows<T extends ManualSleepRowFlags>(rows: T[]): T[] {
  return rows.filter((row) => !isManualSleepRow(row));
}

/** Exclude manual logs from Supabase `sleep_posts` queries used for metrics. */
export function wearablePostsOnly<
  T extends {
    neq: (column: string, value: string) => T;
    not: (column: string, operator: string, value: boolean) => T;
  },
>(query: T): T {
  return query
    .neq('source_device', MANUAL_SLEEP_SOURCE_DEVICE)
    .not('is_custom', 'eq', true);
}
