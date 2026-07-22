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

export function resolvePctPr(
  dbPr: PR,
  topNight?: TopNight,
  stageKey?: 'deepMinutes' | 'remMinutes' | 'coreMinutes',
): PR {
  if (dbPr?.value) return dbPr;
  if (!topNight || !stageKey || topNight.asleepMinutes <= 0) return null;
  const stage = topNight[stageKey];
  if (!stage || stage <= 0) return null;
  return {
    value: (stage / topNight.asleepMinutes) * 100,
    date: topNight.sleepDate,
    postId: topNight.postId,
  };
}
