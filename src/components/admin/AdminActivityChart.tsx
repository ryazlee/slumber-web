import { useEffect, useMemo, useRef, useState } from 'react';
import type { DailyActivityRow } from '../../lib/admin';

type SeriesKey = 'signups' | 'posts' | 'comments' | 'active_users';

type Props = {
  title: string;
  rows: DailyActivityRow[];
  series: SeriesKey;
  color?: string;
};

const BAR_GAP = 2;
const MIN_BAR_WIDTH = 6;

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
  if (idealBarWidth >= MIN_BAR_WIDTH) {
    return { mode: 'fit' as const, barWidth: idealBarWidth, trackWidth: containerWidth };
  }
  const barWidth = MIN_BAR_WIDTH;
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
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? 0;
      setContainerWidth(width);
    });
    observer.observe(el);
    setContainerWidth(el.getBoundingClientRect().width);
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
    ? { width: layout.barWidth, minWidth: layout.barWidth }
    : undefined;

  return (
    <section className="admin-chart-card">
      <div className="admin-chart-header">
        <h3 className="admin-chart-title">{title}</h3>
        {hovered ? (
          <p className="admin-chart-hover-summary">
            {formatDayTooltip(hovered.day)}: <strong>{hovered[series]}</strong>
          </p>
        ) : (
          <p className="admin-chart-hover-summary admin-chart-hover-summary--hint">Hover a bar for daily counts</p>
        )}
      </div>

      <div
        ref={scrollRef}
        className={`admin-chart-scroll${layout.mode === 'scroll' ? ' admin-chart-scroll--overflow' : ''}`}
      >
        <div
          className="admin-chart-track"
          style={{
            width: layout.mode === 'scroll' ? layout.trackWidth : '100%',
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
                  onMouseEnter={() => setHoveredDay(row.day)}
                  onMouseLeave={() => setHoveredDay(null)}
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
      </div>
    </section>
  );
}
