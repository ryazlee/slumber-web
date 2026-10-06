import { useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  addDaysToLocalDateISO,
  buildMonthGrid,
  formatLocalDateLabel,
  parseLocalDateISO,
  toLocalDateISO,
} from './adminDateUtils';

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] as const;
const MONTH_OPTIONS = Array.from({ length: 12 }, (_, month) => ({
  month,
  label: new Date(2020, month, 1).toLocaleDateString(undefined, { month: 'long' }),
}));

function yearBounds(min?: string, max?: string, viewYear?: number): { start: number; end: number } {
  const now = new Date().getFullYear();
  let start = now - 2;
  let end = now + 15;
  const minYear = min ? Number(min.slice(0, 4)) : NaN;
  const maxYear = max ? Number(max.slice(0, 4)) : NaN;
  if (Number.isFinite(minYear)) start = Math.min(start, minYear);
  if (Number.isFinite(maxYear)) end = Math.max(end, maxYear);
  if (viewYear != null) {
    start = Math.min(start, viewYear);
    end = Math.max(end, viewYear);
  }
  return { start, end };
}

type Props = {
  id?: string;
  label: string;
  value: string;
  onChange: (next: string) => void;
  min?: string;
  max?: string;
  placeholder?: string;
};

export default function AdminDateField({
  id: idProp,
  label,
  value,
  onChange,
  min,
  max,
  placeholder = 'Choose date',
}: Props) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const monthSelectId = `${id}-month`;
  const yearSelectId = `${id}-year`;
  const yearInputId = `${id}-year-input`;
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [yearDraft, setYearDraft] = useState('');

  const selected = parseLocalDateISO(value);
  const initialView = selected ?? new Date();
  const [viewYear, setViewYear] = useState(initialView.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialView.getMonth());

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event: PointerEvent) => {
      const root = rootRef.current;
      if (!root) return;
      if (event.target instanceof Node && root.contains(event.target)) return;
      // Native <select> menus can sit outside this node while open.
      const active = document.activeElement;
      if (active instanceof HTMLSelectElement && root.contains(active)) return;
      setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        setOpen(false);
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKey, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const next = selected ?? new Date();
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
    setYearDraft(String(next.getFullYear()));
    // Scroll the expanded calendar into view inside the modal body.
    requestAnimationFrame(() => {
      rootRef.current?.querySelector('.admin-date-popover')?.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      });
    });
  }, [open]); // sync month when the picker opens

  const cells = useMemo(
    () => buildMonthGrid(viewYear, viewMonth, min, max),
    [viewYear, viewMonth, min, max],
  );

  const { start: yearStart, end: yearEnd } = yearBounds(min, max, viewYear);
  const yearOptions = useMemo(() => {
    const years: number[] = [];
    for (let y = yearStart; y <= yearEnd; y += 1) years.push(y);
    return years;
  }, [yearStart, yearEnd]);

  const today = toLocalDateISO();
  const shiftMonth = (delta: number) => {
    const next = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
    setYearDraft(String(next.getFullYear()));
  };

  const setYear = (year: number) => {
    if (!Number.isFinite(year) || year < 1970 || year > 2100) return;
    setViewYear(year);
    setYearDraft(String(year));
  };

  const commitYearDraft = () => {
    const parsed = Number(yearDraft.trim());
    if (!Number.isInteger(parsed)) {
      setYearDraft(String(viewYear));
      return;
    }
    setYear(parsed);
  };

  const pick = (iso: string) => {
    onChange(iso);
    setOpen(false);
  };

  const applyPreset = (iso: string) => {
    if ((min && iso < min) || (max && iso > max)) return;
    pick(iso);
  };

  return (
    <div className="admin-date-field" ref={rootRef}>
      <label className="admin-label" htmlFor={id}>{label}</label>
      <div className="admin-date-field-row">
        <button
          id={id}
          type="button"
          className={`admin-date-trigger${value ? '' : ' admin-date-trigger--empty'}${open ? ' admin-date-trigger--open' : ''}`}
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => setOpen((prev) => !prev)}
        >
          <span className="admin-date-trigger-label">
            {value ? formatLocalDateLabel(value) : placeholder}
          </span>
          <span className="admin-date-trigger-icon" aria-hidden>📅</span>
        </button>
        {value ? (
          <button
            type="button"
            className="admin-button admin-button-ghost admin-button-sm"
            onClick={() => {
              onChange('');
              setOpen(false);
            }}
          >
            Clear
          </button>
        ) : null}
      </div>

      {open ? (
        <div className="admin-date-popover" role="dialog" aria-label={`${label} calendar`}>
          <div className="admin-date-month-nav">
            <button
              type="button"
              className="admin-date-nav-btn"
              aria-label="Previous month"
              onClick={() => shiftMonth(-1)}
            >
              ‹
            </button>
            <div className="admin-date-selectors">
              <label className="admin-date-sr-only" htmlFor={monthSelectId}>Month</label>
              <select
                id={monthSelectId}
                className="admin-input admin-input-select admin-date-select admin-date-select--month"
                value={viewMonth}
                onChange={(e) => setViewMonth(Number(e.target.value))}
              >
                {MONTH_OPTIONS.map((option) => (
                  <option key={option.month} value={option.month}>{option.label}</option>
                ))}
              </select>
              <label className="admin-date-sr-only" htmlFor={yearSelectId}>Year</label>
              <select
                id={yearSelectId}
                className="admin-input admin-input-select admin-date-select admin-date-select--year"
                value={viewYear}
                onChange={(e) => setYear(Number(e.target.value))}
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            <button
              type="button"
              className="admin-date-nav-btn"
              aria-label="Next month"
              onClick={() => shiftMonth(1)}
            >
              ›
            </button>
          </div>

          <div className="admin-date-year-jump">
            <label className="admin-date-year-jump-label" htmlFor={yearInputId}>Jump to year</label>
            <input
              id={yearInputId}
              className="admin-input admin-date-year-input"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="off"
              maxLength={4}
              value={yearDraft}
              placeholder="YYYY"
              onChange={(e) => setYearDraft(e.target.value.replace(/\D/g, '').slice(0, 4))}
              onBlur={commitYearDraft}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  commitYearDraft();
                }
              }}
            />
          </div>

          <div className="admin-date-weekdays" aria-hidden>
            {WEEKDAYS.map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>

          <div className="admin-date-grid">
            {cells.map((cell) => {
              const isSelected = cell.iso === value;
              const isToday = cell.iso === today;
              return (
                <button
                  key={cell.iso}
                  type="button"
                  disabled={cell.disabled}
                  className={[
                    'admin-date-day',
                    cell.inMonth ? '' : 'admin-date-day--muted',
                    isSelected ? 'admin-date-day--selected' : '',
                    isToday ? 'admin-date-day--today' : '',
                  ].filter(Boolean).join(' ')}
                  onClick={() => pick(cell.iso)}
                >
                  {cell.day}
                </button>
              );
            })}
          </div>

          <div className="admin-date-presets">
            <button type="button" className="admin-button admin-button-ghost admin-button-sm" onClick={() => applyPreset(today)}>
              Today
            </button>
            <button
              type="button"
              className="admin-button admin-button-ghost admin-button-sm"
              onClick={() => applyPreset(addDaysToLocalDateISO(today, 1))}
            >
              Tomorrow
            </button>
            <button
              type="button"
              className="admin-button admin-button-ghost admin-button-sm"
              onClick={() => applyPreset(addDaysToLocalDateISO(today, 7))}
            >
              +7 days
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
