import type { StageSegment } from './types';

/** Count AWAKE stage segments (one per wearable wake episode). */
export function countWakes(segments: StageSegment[] | null | undefined): number {
  if (!segments?.length) return 0;
  return segments.filter((s) => s.type === 'AWAKE').length;
}
