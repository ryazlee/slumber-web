import { useCallback, useMemo, useRef, useState } from 'react';
import type { SleepSessionData, StageSegment } from '../lib/types';
import {
  buildTimelineItems,
  STAGE_LANE,
  stageSegmentClass,
  timelineClockAtFraction,
  type TimelineItem,
} from '../lib/timeline';

type SleepTimelineBarProps = {
  segments: StageSegment[];
  bedtime: string;
  wakeTime: string;
  sessionBreakdown?: SleepSessionData[];
  variant?: 'card' | 'detail';
};

const CARD_HEIGHT = 14;
const DETAIL_HYPNO_HEIGHT = 80;
const HYPO_LANES = 4;
const LANE_INSET = 3;

const SCRUB_TOOLTIP_HEIGHT = 26;
const SCRUB_TOOLTIP_GAP = 6;
/** Space reserved above the chart for the hover time pill (matches iOS scrub-above layout). */
const SCRUB_TOOLTIP_RESERVE = SCRUB_TOOLTIP_HEIGHT + SCRUB_TOOLTIP_GAP;
const SCRUB_TOOLTIP_WIDTH = 80;

const LANE_LABELS = [
  { label: 'Awake', className: 'awake' },
  { label: 'REM', className: 'rem' },
  { label: 'Core', className: 'core' },
  { label: 'Deep', className: 'deep' },
] as const;

function totalTimelineMinutes(items: TimelineItem[]): number {
  return items.reduce(
    (sum, item) => sum + (item.kind === 'gap' ? item.minutes : item.segment.minutes),
    0,
  );
}

type ScrubOverlayProps = {
  scrubX: number;
  scrubTime: string;
  graphWidth: number;
  chartHeight: number;
  variant: 'card' | 'detail';
};

function ScrubOverlay({ scrubX, scrubTime, graphWidth, chartHeight, variant }: ScrubOverlayProps) {
  const tooltipLeft = Math.max(
    0,
    Math.min(scrubX - SCRUB_TOOLTIP_WIDTH / 2, graphWidth - SCRUB_TOOLTIP_WIDTH),
  );

  const chartTop = variant === 'detail' ? SCRUB_TOOLTIP_RESERVE : 0;
  const tooltipTop = variant === 'detail'
    ? SCRUB_TOOLTIP_GAP
    : SCRUB_TOOLTIP_GAP - SCRUB_TOOLTIP_RESERVE;

  return (
    <>
      <div
        className="sleep-scrub-line"
        style={{
          left: scrubX,
          top: chartTop,
          height: chartHeight,
        }}
        aria-hidden="true"
      />
      <div
        className="sleep-scrub-tooltip"
        style={{
          left: tooltipLeft,
          width: SCRUB_TOOLTIP_WIDTH,
          top: tooltipTop,
          height: SCRUB_TOOLTIP_HEIGHT,
        }}
        aria-hidden="true"
      >
        {scrubTime}
      </div>
    </>
  );
}

export default function SleepTimelineBar({
  segments,
  bedtime,
  wakeTime,
  sessionBreakdown,
  variant = 'card',
}: SleepTimelineBarProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const scrubbingRef = useRef(false);
  const [scrubX, setScrubX] = useState<number | null>(null);
  const [graphWidth, setGraphWidth] = useState(0);

  const isDetail = variant === 'detail';
  const chartHeight = isDetail ? DETAIL_HYPNO_HEIGHT : CARD_HEIGHT;

  const timelineItems = useMemo(
    () => buildTimelineItems(segments, sessionBreakdown),
    [segments, sessionBreakdown],
  );

  const scrubEnabled = bedtime !== '—' && timelineItems.length > 0;

  const updateScrub = useCallback((clientX: number) => {
    const el = chartRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const width = rect.width;
    setGraphWidth(width);
    const x = clientX - rect.left;
    setScrubX(Math.max(0, Math.min(x, width)));
  }, []);

  const clearScrub = useCallback(() => {
    setScrubX(null);
  }, []);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!scrubEnabled) return;
    e.stopPropagation();
    scrubbingRef.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    updateScrub(e.clientX);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!scrubEnabled) return;
    e.stopPropagation();
    updateScrub(e.clientX);
  };

  const endScrub = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    if (!scrubbingRef.current) return;
    scrubbingRef.current = false;
    clearScrub();
  };

  const onPointerLeave = () => {
    if (scrubbingRef.current) return;
    clearScrub();
  };

  const scrubTime = scrubX !== null && graphWidth > 0 && scrubEnabled
    ? timelineClockAtFraction(scrubX / graphWidth, timelineItems, bedtime)
    : null;

  const scrubHostClass = [
    'sleep-timeline-scrub-host',
    isDetail ? 'sleep-hypnogram-scrub-host' : 'sleep-timeline-scrub-host--card',
    scrubEnabled ? 'sleep-timeline-scrub-host--active' : '',
  ].filter(Boolean).join(' ');

  const scrubHandlers = scrubEnabled
    ? {
        onPointerDown,
        onPointerMove,
        onPointerLeave,
        onPointerUp: endScrub,
        onPointerCancel: endScrub,
      }
    : {};

  const scrubOverlay = scrubX !== null && scrubTime ? (
    <ScrubOverlay
      scrubX={scrubX}
      scrubTime={scrubTime}
      graphWidth={graphWidth}
      chartHeight={chartHeight}
      variant={isDetail ? 'detail' : 'card'}
    />
  ) : null;

  if (timelineItems.length === 0) {
    return (
      <div className={`sleep-timeline sleep-timeline--${variant}`}>
        {!isDetail ? (
          <div className="hypno-labels">
            <span>{bedtime}</span>
            <span>{wakeTime}</span>
          </div>
        ) : null}
        <div className={scrubHostClass}>
          <div className="hypno-bar" style={{ height: chartHeight, borderRadius: isDetail ? 8 : 6 }}>
            <div className="hypno-seg core" style={{ flex: 1 }} />
          </div>
        </div>
        {isDetail ? (
          <div className="sleep-hypnogram-axis-labels">
            <span>{bedtime}</span>
            <span>{wakeTime}</span>
          </div>
        ) : null}
      </div>
    );
  }

  if (!isDetail) {
    return (
      <div className={`sleep-timeline sleep-timeline--${variant}`}>
        <div className="hypno-labels">
          <span>{bedtime}</span>
          <span>{wakeTime}</span>
        </div>

        <div
          className={scrubHostClass}
          {...scrubHandlers}
          data-post-interactive={scrubEnabled ? true : undefined}
          role="presentation"
        >
          {scrubOverlay}
          <div
            ref={chartRef}
            className="hypno-bar sleep-timeline-chart"
            style={{ height: chartHeight, borderRadius: 6 }}
          >
            {timelineItems.map((item, idx) => {
              if (item.kind === 'gap') {
                return (
                  <div
                    key={`gap-${idx}`}
                    className="hypno-seg gap"
                    style={{ flex: Math.max(item.minutes, 1) }}
                    title="Awake gap"
                  >
                    {item.minutes >= 45 && (
                      <span className="hypno-gap-icon" aria-hidden="true">
                        {item.isAfterNap ? '☀️' : '·'}
                      </span>
                    )}
                  </div>
                );
              }

              const seg = item.segment;
              return (
                <div
                  key={`seg-${idx}`}
                  className={`hypno-seg ${stageSegmentClass(seg.type)}`}
                  style={{ flex: seg.minutes }}
                />
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  const totalMinutes = totalTimelineMinutes(timelineItems);
  const laneHeight = chartHeight / HYPO_LANES;
  let cumulative = 0;

  return (
    <div className={`sleep-timeline sleep-timeline--${variant}`}>
      <div className="sleep-hypnogram-wrap">
        <div
          className="sleep-hypnogram-axis-col"
          style={{ paddingTop: SCRUB_TOOLTIP_RESERVE }}
        >
          <div className="sleep-hypnogram-axis" style={{ height: chartHeight }} aria-hidden="true">
            {LANE_LABELS.map((lane) => (
              <div key={lane.label} className="sleep-hypnogram-axis-row" style={{ height: laneHeight }}>
                <span className={`sleep-hypnogram-axis-dot sleep-hypnogram-axis-dot--${lane.className}`} />
                <span className="sleep-hypnogram-axis-label">{lane.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={scrubHostClass} {...scrubHandlers} role="presentation">
          {scrubOverlay}
          <div
            ref={chartRef}
            className="sleep-hypnogram-chart"
            style={{ height: chartHeight, borderRadius: 8 }}
          >
            {Array.from({ length: HYPO_LANES - 1 }, (_, idx) => (
              <div
                key={`lane-${idx}`}
                className="sleep-hypnogram-lane-divider"
                style={{ top: (idx + 1) * laneHeight }}
              />
            ))}

            {timelineItems.map((item, idx) => {
              const itemMinutes = item.kind === 'gap' ? item.minutes : item.segment.minutes;
              const left = totalMinutes > 0 ? (cumulative / totalMinutes) * 100 : 0;
              const width = totalMinutes > 0 ? (itemMinutes / totalMinutes) * 100 : 0;
              cumulative += itemMinutes;

              if (item.kind === 'gap') {
                const showGapLabel = width >= 6;
                return (
                  <div
                    key={`gap-${idx}`}
                    className="sleep-hypnogram-gap"
                    style={{ left: `${left}%`, width: `${width}%`, height: chartHeight }}
                    title="Awake gap"
                  >
                    {showGapLabel ? (
                      <span className="sleep-hypnogram-gap-label">
                        {item.isAfterNap ? '☀️ ' : ''}{Math.round(item.minutes)}m awake
                      </span>
                    ) : null}
                  </div>
                );
              }

              const seg = item.segment;
              const lane = STAGE_LANE[seg.type];
              return (
                <div
                  key={`seg-${idx}`}
                  className={`sleep-hypnogram-seg hypno-seg ${stageSegmentClass(seg.type)}`}
                  style={{
                    left: `${left}%`,
                    width: `${width}%`,
                    top: lane * laneHeight + LANE_INSET,
                    height: laneHeight - LANE_INSET * 2,
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>

      <div className="sleep-hypnogram-axis-labels">
        <span>{bedtime}</span>
        <span>{wakeTime}</span>
      </div>
    </div>
  );
}
