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
