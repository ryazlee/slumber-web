import { useEffect, useMemo, useRef, useState } from 'react';
import type { DailyActivityRow } from '../../lib/admin';

type SeriesKey = 'signups' | 'posts' | 'comments' | 'active_users';

type Props = {
  title: string;
  rows: DailyActivityRow[];
  series: SeriesKey;
  color?: string;
};

const BAR_GAP = 1;
/** Below this, keep bars in a scroll track (desktop only). On phones we always fit. */
const MIN_FIT_BAR_WIDTH = 3;
const SCROLL_BAR_WIDTH = 6;
const NARROW_BREAKPOINT = 720;

function parseDay(day: string): Date {
  return new Date(`${day.slice(0, 10)}T12:00:00`);
}

function formatAxisLabel(day: string, spanDays: number, withYear: boolean): string {
  const d = parseDay(day);
  if (spanDays <= 14) {
    return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' });
  }
  if (withYear) {
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' });
  }
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatDayTooltip(day: string): string {
  const d = parseDay(day);
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function labelStep(count: number): number {
  if (count <= 7) return 1;
  if (count <= 14) return 2;
  if (count <= 31) return 4;
  if (count <= 60) return 7;
  return 14;
}

function shouldShowLabel(index: number, total: number): boolean {
  const step = labelStep(total);
  return index === 0 || index === total - 1 || index % step === 0;
}

function computeLayout(count: number, containerWidth: number) {
  if (count === 0 || containerWidth <= 0) {
    return { mode: 'fit' as const, barWidth: 0, trackWidth: 0 };
  }

  const gaps = Math.max(0, count - 1) * BAR_GAP;
  const idealBarWidth = (containerWidth - gaps) / count;
  const narrow = containerWidth < NARROW_BREAKPOINT;

  // Phones: always fit the full range in the viewport (no page-widening scroll track).
  if (narrow || idealBarWidth >= MIN_FIT_BAR_WIDTH) {
    return {
      mode: 'fit' as const,
      barWidth: Math.max(1, idealBarWidth),
      trackWidth: containerWidth,
    };
  }

  const barWidth = SCROLL_BAR_WIDTH;
  return {
    mode: 'scroll' as const,
    barWidth,
    trackWidth: count * barWidth + gaps,
  };
}

export default function AdminActivityChart({ title, rows, series, color = 'var(--accent)' }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return undefined;

    const updateWidth = (next: number) => {
      const rounded = Math.round(next);
      setContainerWidth((prev) => (Math.abs(prev - rounded) < 1 ? prev : rounded));
    };

    const observer = new ResizeObserver((entries) => {
      updateWidth(entries[0]?.contentRect.width ?? 0);
    });
    observer.observe(el);
    updateWidth(el.clientWidth);
    return () => observer.disconnect();
  }, []);

  const max = Math.max(1, ...rows.map((r) => r[series]));
  const hovered = rows.find((row) => row.day === hoveredDay) ?? null;
  const spansYear = rows.length > 0
    && rows[0].day.slice(0, 4) !== rows[rows.length - 1].day.slice(0, 4);

  const layout = useMemo(
    () => computeLayout(rows.length, containerWidth),
    [rows.length, containerWidth],
  );

  const gridStyle = layout.mode === 'fit' && rows.length > 0
    ? { gridTemplateColumns: `repeat(${rows.length}, minmax(0, 1fr))` }
    : undefined;

  const colStyle = layout.mode === 'scroll'
    ? { width: layout.barWidth, minWidth: layout.barWidth, maxWidth: layout.barWidth }
    : undefined;

  const ready = containerWidth > 0;

  return (
    <section className="admin-chart-card">
      <div className="admin-chart-header">
        <h3 className="admin-chart-title">{title}</h3>
        {hovered ? (
          <p className="admin-chart-hover-summary">
            {formatDayTooltip(hovered.day)}: <strong>{hovered[series]}</strong>
          </p>
        ) : (
          <p className="admin-chart-hover-summary admin-chart-hover-summary--hint">Tap a bar for daily counts</p>
        )}
      </div>

      <div
        ref={scrollRef}
        className={`admin-chart-scroll${layout.mode === 'scroll' ? ' admin-chart-scroll--overflow' : ''}`}
      >
        {ready ? (
          <div
            className="admin-chart-track"
            style={{
              width: layout.mode === 'scroll' ? layout.trackWidth : '100%',
              maxWidth: layout.mode === 'fit' ? '100%' : undefined,
            }}
          >
            <div
              className={`admin-chart-bars${layout.mode === 'fit' ? ' admin-chart-bars--fit' : ''}`}
              style={gridStyle}
              role="img"
              aria-label={`${title} over time`}
            >
              {rows.map((row) => {
                const value = row[series];
                const heightPct = Math.max(value > 0 ? 4 : 0, Math.round((value / max) * 100));
                const isHovered = hoveredDay === row.day;

                return (
                  <div
                    key={row.day}
                    className={`admin-chart-bar-col${isHovered ? ' admin-chart-bar-col--hovered' : ''}`}
                    style={colStyle}
                    onPointerEnter={() => setHoveredDay(row.day)}
                    onPointerLeave={() => setHoveredDay(null)}
                    onFocus={() => setHoveredDay(row.day)}
                    onBlur={() => setHoveredDay(null)}
                    tabIndex={0}
                    aria-label={`${formatDayTooltip(row.day)}: ${value}`}
                  >
                    {isHovered && (
                      <div className="admin-chart-tooltip">
                        <span className="admin-chart-tooltip-value">{value}</span>
                        <span className="admin-chart-tooltip-date">{formatDayTooltip(row.day)}</span>
                      </div>
                    )}
                    <div
                      className="admin-chart-bar"
                      style={{ height: `${heightPct}%`, background: color }}
                    />
                  </div>
                );
              })}
            </div>

            <div
              className={`admin-chart-xaxis${layout.mode === 'fit' ? ' admin-chart-xaxis--fit' : ''}`}
              style={gridStyle}
              aria-hidden
            >
              {rows.map((row, index) => (
                <div
                  key={`${row.day}-tick`}
                  className="admin-chart-xaxis-tick"
                  style={colStyle}
                >
                  {shouldShowLabel(index, rows.length)
                    ? formatAxisLabel(row.day, rows.length, spansYear && (index === 0 || index === rows.length - 1))
                    : null}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="admin-chart-bars admin-chart-bars--skeleton" aria-hidden />
        )}
      </div>
    </section>
  );
}
