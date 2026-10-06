/** Local calendar day helpers for admin date fields (YYYY-MM-DD). */

export function toLocalDateISO(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseLocalDateISO(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(year, month, day);
  if (
    Number.isNaN(date.getTime())
    || date.getFullYear() !== year
    || date.getMonth() !== month
    || date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

export function addDaysToLocalDateISO(value: string, days: number): string {
  const date = parseLocalDateISO(value) ?? new Date();
  date.setDate(date.getDate() + days);
  return toLocalDateISO(date);
}

/** ISO timestamptz → local YYYY-MM-DD for date inputs. */
export function isoToLocalDateInput(iso: string | null | undefined): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return toLocalDateISO(date);
}

/** Local YYYY-MM-DD → ISO timestamptz at start or end of that local day. */
export function localDateInputToIso(value: string, edge: 'start' | 'end'): string | null {
  const date = parseLocalDateISO(value);
  if (!date) return null;
  if (edge === 'start') {
    date.setHours(0, 0, 0, 0);
  } else {
    date.setHours(23, 59, 59, 999);
  }
  return date.toISOString();
}

export function formatLocalDateLabel(value: string | null | undefined): string {
  if (!value) return '';
  const date = parseLocalDateISO(value);
  if (!date) return value;
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatScheduleWindow(
  startsAt: string | null | undefined,
  endsAt: string | null | undefined,
): string {
  const start = isoToLocalDateInput(startsAt ?? null);
  const end = isoToLocalDateInput(endsAt ?? null);
  const fmt = (isoDay: string) => {
    const date = parseLocalDateISO(isoDay);
    return date
      ? date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
      : isoDay;
  };
  if (start && end) return `${fmt(start)} – ${fmt(end)}`;
  if (start) return `From ${fmt(start)}`;
  if (end) return `Until ${fmt(end)}`;
  return 'Indefinite';
}

export type CalendarCell = {
  iso: string;
  day: number;
  inMonth: boolean;
  disabled: boolean;
};

/** 6×7 grid of local days for a month view (Sunday-first). */
export function buildMonthGrid(
  viewYear: number,
  viewMonth: number,
  min?: string,
  max?: string,
): CalendarCell[] {
  const first = new Date(viewYear, viewMonth, 1);
  const startOffset = first.getDay(); // 0 = Sunday
  const gridStart = new Date(viewYear, viewMonth, 1 - startOffset);
  const cells: CalendarCell[] = [];
  for (let i = 0; i < 42; i += 1) {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + i);
    const iso = toLocalDateISO(date);
    cells.push({
      iso,
      day: date.getDate(),
      inMonth: date.getMonth() === viewMonth,
      disabled: Boolean((min && iso < min) || (max && iso > max)),
    });
  }
  return cells;
}
