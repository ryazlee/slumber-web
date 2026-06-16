import type { PR, TopNight } from './statsTypes';

export function resolvePr(dbPr: PR, topNight?: TopNight, valueKey?: keyof TopNight): PR {
  if (dbPr?.value) return dbPr;
  if (!topNight || !valueKey) return null;
  const value = topNight[valueKey] as number;
  if (!value || value <= 0) return null;
  return {
    value,
    date: topNight.sleepDate,
    postId: topNight.postId,
  };
}
