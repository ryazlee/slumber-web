import { useEffect, useMemo, useRef, useState } from 'react';
import type { DailyActivityRow } from '../../lib/admin';

type SeriesKey = 'signups' | 'posts' | 'comments' | 'active_users' | 'total_users';

type ChartRow = DailyActivityRow & { total_users?: number };

type Props = {
  title: string;
  rows: ChartRow[];
  series: SeriesKey;
  color?: string;
  /** Bars grow from zero. Line is scaled tightly around the series min and max. */
  variant?: 'bar' | 'line';
  /** First and last ticks include the year. All time, or any span that crosses a year. */
  edgeYear?: boolean;
};

const BAR_GAP = 1;
/** Below this, keep bars in a scroll track. The admin shell stacks under 900px, so fit there. */
const MIN_FIT_BAR_WIDTH = 3;
const SCROLL_BAR_WIDTH = 6;
const NARROW_BREAKPOINT = 900;

function parseDay(day: string): Date {
  return new Date(`${day.slice(0, 10)}T12:00:00`);
}

/** One label style at every range: "Sep 30", plus a 2-digit year on edge ticks when asked. */
function formatAxisLabel(day: string, withYear: boolean): string {
  const d = parseDay(day);
  return d.toLocaleDateString(undefined, withYear
    ? { month: 'short', day: 'numeric', year: '2-digit' }
    : { month: 'short', day: 'numeric' });
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

function formatChartValue(value: number): string {
  return value.toLocaleString();
}

/** Compact axis text: 1.2k / 10.5k when the number is large, otherwise an integer. */
function formatCompactTick(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? '−' : '';
  if (abs >= 1_000_000) return `${sign}${compactMagnitude(abs / 1_000_000)}m`;
  if (abs >= 1000) return `${sign}${compactMagnitude(abs / 1000)}k`;
  return `${sign}${Math.round(abs).toLocaleString()}`;
}

function compactMagnitude(n: number): string {
  if (n >= 100) return String(Math.round(n));
  const rounded = Math.round(n * 10) / 10;
  return String(rounded);
}

type YTick = { value: number; percent: number; label: string; edge: 'min' | 'mid' | 'max' };

/**
 * Bar charts are 0 → max. Line charts use the tight min → max already used to draw the line.
 * A flat line (min === max) gets one tick at the midline, where the point is drawn.
 */
function yAxisTicks(min: number, max: number, variant: 'bar' | 'line'): YTick[] {
  if (variant === 'line' && min === max) {
    return [{ value: min, percent: 50, label: formatCompactTick(min), edge: 'mid' }];
  }

  const span = max - min;
  let count = 2;
  if (span >= 20) count = 4;
  else if (span >= 4) count = 3;

  const values: number[] = [];
  for (let i = 0; i < count; i += 1) {
    const raw = min + (span * i) / (count - 1);
    const next = i === 0 || i === count - 1 ? raw : Math.round(raw);
    if (!values.includes(next)) values.push(next);
  }
  if (values[0] !== min) values.unshift(min);
  if (values[values.length - 1] !== max) values.push(max);

  const compact = values.map(formatCompactTick);
  const labels = new Set(compact).size === compact.length
    ? compact
    : values.map((value) => Math.round(value).toLocaleString());

  return values.map((value, index) => {
    const percent = span === 0 ? 50 : ((value - min) / span) * 100;
    const edge = percent <= 0 ? 'min' : percent >= 100 ? 'max' : 'mid';
    return { value, percent, label: labels[index], edge };
  });
}

function seriesValue(row: ChartRow, series: SeriesKey): number {
  const value = row[series];
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

/** Past this, never put a label on every bar — the axis stays a few even ticks. */
const LABEL_EVERY_DAY_MAX = 10;

type AxisTick = {
  index: number;
  /** 0–100 across the plot. */
  position: number;
  align: 'start' | 'center' | 'end';
  withYear: boolean;
};

/** Measured 11px system font: "Sep 30" ≈ 37px, "Sep 30, 26" ≈ 57px, plus air. */
const MONTH_DAY_LABEL = 40;
const YEAR_LABEL = 64;
const LABEL_GUTTER = 8;

/**
 * Same tick rhythm at every range. Count comes from plot width so labels cannot
 * overlap (a phone is narrower, so it gets fewer). Gaps are equal. Short ranges
 * (about 10 days or less) may label each day when those labels still fit.
 */
function axisTicks(count: number, plotWidth: number, showEdgeYear: boolean): AxisTick[] {
  if (count <= 0 || plotWidth <= 0) return [];
  if (count === 1) {
    return [{ index: 0, position: 50, align: 'center', withYear: showEdgeYear }];
  }

  const edgeLabel = showEdgeYear ? YEAR_LABEL : MONTH_DAY_LABEL;
  const edgeHalf = edgeLabel / 2;
  const midHalf = MONTH_DAY_LABEL / 2;
  // Sparse ticks sit on the plot edges, so the first gap clears a full edge label.
  const sparseGap = edgeLabel + midHalf + LABEL_GUTTER;
  const innerWidth = Math.max(0, plotWidth - Math.max(0, count - 1) * BAR_GAP);
  const barSlot = innerWidth / count;
  const everyDayFits = count <= LABEL_EVERY_DAY_MAX
    && barSlot >= edgeHalf + midHalf + LABEL_GUTTER
    && barSlot / 2 >= edgeHalf + 2;

  let tickCount = everyDayFits
    ? count
    : Math.max(2, Math.floor(plotWidth / sparseGap) + 1);
  if (!everyDayFits && count > LABEL_EVERY_DAY_MAX) {
    tickCount = Math.min(tickCount, count - 1);
  }
  tickCount = Math.min(tickCount, count);

  const indexes: number[] = [];
  const used = new Set<number>();
  for (let i = 0; i < tickCount; i += 1) {
    const t = i / (tickCount - 1);
    let index = i === 0 ? 0 : i === tickCount - 1 ? count - 1 : Math.round(t * (count - 1));
    if (used.has(index)) {
      const preferHigher = t >= 0.5;
      let found = -1;
      for (let step = 1; step < count; step += 1) {
        const candidates = preferHigher
          ? [index + step, index - step]
          : [index - step, index + step];
        const next = candidates.find((candidate) => candidate >= 0 && candidate < count && !used.has(candidate));
        if (next != null) {
          found = next;
          break;
        }
      }
      if (found < 0) continue;
      index = found;
    }
    used.add(index);
    indexes.push(index);
  }
  indexes.sort((a, b) => a - b);

  const everyDay = indexes.length === count;
  return indexes.map((index, i) => {
    const edge = i === 0 || i === indexes.length - 1;
    const position = everyDay
      ? ((index + 0.5) / count) * 100
      : (i / (indexes.length - 1)) * 100;
    let align: AxisTick['align'] = 'center';
    if (!everyDay && i === 0) align = 'start';
    else if (!everyDay && i === indexes.length - 1) align = 'end';
    return {
      index,
      position,
      align,
      withYear: showEdgeYear && edge,
    };
  });
}

function computeLayout(count: number, containerWidth: number) {
  if (count === 0 || containerWidth <= 0) {
    return { mode: 'fit' as const, barWidth: 0, trackWidth: 0 };
  }

  const gaps = Math.max(0, count - 1) * BAR_GAP;
  const idealBarWidth = (containerWidth - gaps) / count;
  const narrow = containerWidth < NARROW_BREAKPOINT;

  // Narrow screens: fit the full range so the page does not scroll sideways.
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

export default function AdminActivityChart({
  title,
  rows,
  series,
  color = 'var(--accent)',
  variant = 'bar',
  edgeYear = false,
}: Props) {
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

  const values = rows.map((row) => seriesValue(row, series));
  const dataMax = values.length > 0 ? Math.max(...values) : 0;
  const dataMin = values.length > 0 ? Math.min(...values) : 0;
  const lineSpan = dataMax - dataMin;
  const barMax = Math.max(1, dataMax);

  const yPercent = (value: number) => {
    if (variant === 'line') {
      if (lineSpan === 0) return 50;
      return ((value - dataMin) / lineSpan) * 100;
    }
    return Math.max(value > 0 ? 4 : 0, Math.round((value / barMax) * 100));
  };

  const linePoints = variant === 'line'
    ? rows.map((row, index) => {
      const y = 100 - yPercent(seriesValue(row, series));
      const x = rows.length <= 1 ? 50 : ((index + 0.5) / rows.length) * 100;
      return `${x},${y}`;
    }).join(' ')
    : '';

  const hovered = rows.find((row) => row.day === hoveredDay) ?? null;
  const spansYear = rows.length > 0
    && rows[0].day.slice(0, 4) !== rows[rows.length - 1].day.slice(0, 4);

  const layout = useMemo(
    () => computeLayout(rows.length, containerWidth),
    [rows.length, containerWidth],
  );
  const showEdgeYear = edgeYear || spansYear;
  const ticks = useMemo(
    () => axisTicks(rows.length, layout.trackWidth || containerWidth, showEdgeYear),
    [rows.length, layout.trackWidth, containerWidth, showEdgeYear],
  );

  const gridStyle = layout.mode === 'fit' && rows.length > 0
    ? { gridTemplateColumns: `repeat(${rows.length}, minmax(0, 1fr))` }
    : undefined;

  const colStyle = layout.mode === 'scroll'
    ? { width: layout.barWidth, minWidth: layout.barWidth, maxWidth: layout.barWidth }
    : undefined;

  const ready = containerWidth > 0;
  const hoveredValue = hovered ? seriesValue(hovered, series) : null;
  const yTicks = useMemo(
    () => yAxisTicks(variant === 'line' ? dataMin : 0, variant === 'line' ? dataMax : barMax, variant),
    [variant, dataMin, dataMax, barMax],
  );

  return (
    <section className="admin-chart-card">
      <div className="admin-chart-header">
        <h3 className="admin-chart-title">{title}</h3>
        {hovered && hoveredValue != null ? (
          <p className="admin-chart-hover-summary">
            {formatDayTooltip(hovered.day)}: <strong>{formatChartValue(hoveredValue)}</strong>
          </p>
        ) : (
          <p className="admin-chart-hover-summary admin-chart-hover-summary--hint">Hover or tap a day</p>
        )}
      </div>

      <div className="admin-chart-frame">
        {ready ? (
          <div className="admin-chart-yaxis" aria-hidden>
            <span className="admin-chart-yaxis-sizer">
              {yTicks.reduce((widest, tick) => (tick.label.length > widest.length ? tick.label : widest), '')}
            </span>
            {yTicks.map((tick) => (
              <span
                key={`${tick.edge}-${tick.value}`}
                className={`admin-chart-yaxis-label admin-chart-yaxis-label--${tick.edge}`}
                style={{ bottom: `calc((100% - 28px) * ${tick.percent / 100})` }}
              >
                {tick.label}
              </span>
            ))}
          </div>
        ) : null}
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
            <div className={`admin-chart-plot${variant === 'line' ? ' admin-chart-plot--line' : ''}`}>
              {variant === 'line' ? (
                <svg
                  className="admin-chart-line"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  aria-hidden
                >
                  <polyline
                    points={linePoints}
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                    vectorEffect="non-scaling-stroke"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                </svg>
              ) : null}
              <div
                className={`admin-chart-bars${layout.mode === 'fit' ? ' admin-chart-bars--fit' : ''}`}
                style={gridStyle}
                role="img"
                aria-label={`${title} over time`}
              >
                {rows.map((row) => {
                  const value = seriesValue(row, series);
                  const heightPct = yPercent(value);
                  const isHovered = hoveredDay === row.day;
                  const label = `${formatDayTooltip(row.day)}: ${formatChartValue(value)}`;

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
                      aria-label={label}
                    >
                      {isHovered && (
                        <div className="admin-chart-tooltip">
                          <span className="admin-chart-tooltip-value">{formatChartValue(value)}</span>
                          <span className="admin-chart-tooltip-date">{formatDayTooltip(row.day)}</span>
                        </div>
                      )}
                      {variant === 'line' ? (
                        isHovered || rows.length === 1 ? (
                          <span
                            className="admin-chart-line-dot"
                            style={{ bottom: `${heightPct}%`, background: color }}
                          />
                        ) : null
                      ) : (
                        <div
                          className="admin-chart-bar"
                          style={{ height: `${heightPct}%`, background: color }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="admin-chart-xaxis" aria-hidden>
              {ticks.map((tick) => {
                const row = rows[tick.index];
                return (
                  <div
                    key={`${row.day}-tick`}
                    className={`admin-chart-xaxis-tick admin-chart-xaxis-tick--${tick.align}`}
                    style={tick.align === 'end' ? { right: 0 } : { left: `${tick.position}%` }}
                  >
                    <span className={`admin-chart-xaxis-label admin-chart-xaxis-label--${tick.align}`}>
                      {formatAxisLabel(row.day, tick.withYear)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="admin-chart-bars admin-chart-bars--skeleton" aria-hidden />
        )}
        </div>
      </div>
    </section>
  );
}
