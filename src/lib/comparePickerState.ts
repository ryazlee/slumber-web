import { ALL_COMPARE_METRICS } from './compareMetrics';

export function toggleComparePerson(ids: string[], id: string): string[] {
  return ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
}

export function toggleCompareMetric(ids: string[], id: string): string[] {
  if (ids.includes(id)) {
    if (ids.length <= 1) return ids;
    return ids.filter((x) => x !== id);
  }
  const next = [...ids, id];
  const order = ALL_COMPARE_METRICS.map((m) => m.id);
  next.sort((a, b) => order.indexOf(a) - order.indexOf(b));
  return next;
}

export function formatCompareSetupLabel(peopleCount: number, statsCount: number): string {
  const people = peopleCount === 1 ? '1 person' : `${peopleCount} people`;
  const stats = statsCount === 1 ? '1 stat' : `${statsCount} stats`;
  return `${people} · ${stats}`;
}
