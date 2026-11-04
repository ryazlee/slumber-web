import { formatMins, goalHours, pluralCount } from './format';

export const DRAWING_KIND_LABEL = 'Prize drawing';

export function drawingEntryCount(accruedMinutes: number, goalMinutes: number): 0 | 1 {
  if (!Number.isFinite(accruedMinutes) || !Number.isFinite(goalMinutes) || goalMinutes <= 0) return 0;
  return accruedMinutes >= goalMinutes ? 1 : 0;
}

export function drawingHowItWorksLine(goalMinutes: number): string {
  return `Hit ${goalHours(goalMinutes)} of wearable sleep for 1 entry. Winner chosen in a drawing after it ends.`;
}

export function drawingStatusCopy(opts: {
  accruedMinutes: number;
  goalMinutes: number;
  entries: number;
  completed?: boolean;
}): { entriesLabel: string; detail: string } {
  const entriesLabel = pluralCount(opts.entries, 'entry');
  if (opts.completed) {
    return {
      entriesLabel,
      detail: opts.entries > 0
        ? 'Drawing happens outside the app.'
        : `Needed ${goalHours(opts.goalMinutes)} in the window.`,
    };
  }
  if (opts.entries > 0) {
    return { entriesLabel, detail: 'You’re in the drawing' };
  }
  const remain = Math.max(0, opts.goalMinutes - opts.accruedMinutes);
  return {
    entriesLabel,
    detail: remain > 0 ? `${formatMins(remain)} to go` : 'Hit the goal to enter',
  };
}
