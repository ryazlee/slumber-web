import { useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  addDaysToLocalDateISO,
  buildMonthGrid,
  formatLocalDateLabel,
  parseLocalDateISO,
  toLocalDateISO,
} from './adminDateUtils';

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] as const;

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
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const selected = parseLocalDateISO(value);
  const initialView = selected ?? new Date();
  const [viewYear, setViewYear] = useState(initialView.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialView.getMonth());

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event: PointerEvent) => {
      const root = rootRef.current;
      if (!root) return;
      if (event.target instanceof Node && !root.contains(event.target)) {
        setOpen(false);
      }
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

  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });

  const today = toLocalDateISO();
  const shiftMonth = (delta: number) => {
    const next = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
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
            <div className="admin-date-month-label">{monthLabel}</div>
            <button
              type="button"
              className="admin-date-nav-btn"
              aria-label="Next month"
              onClick={() => shiftMonth(1)}
            >
              ›
            </button>
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
