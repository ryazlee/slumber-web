export type DateRange = {
  start: string;
  end: string;
};

export type RangePreset = '7' | '14' | '30' | '90' | 'custom';

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function rangeForPreset(preset: Exclude<RangePreset, 'custom'>, end = todayISO()): DateRange {
  const endDate = new Date(`${end}T12:00:00`);
  const startDate = new Date(endDate);
  startDate.setDate(endDate.getDate() - (Number(preset) - 1));
  return { start: toISODate(startDate), end };
}

export function formatRangeLabel(range: DateRange): string {
  const fmt = (iso: string) => {
    const d = new Date(`${iso}T12:00:00`);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };
  return `${fmt(range.start)} – ${fmt(range.end)}`;
}

export function dayCount(range: DateRange): number {
  const start = new Date(`${range.start}T12:00:00`);
  const end = new Date(`${range.end}T12:00:00`);
  return Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1;
}
