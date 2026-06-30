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
const DETAIL_HYPNO_HEIGHT = 72;
const CARD_TOOLTIP_OFFSET = -36;
const DETAIL_TOOLTIP_OFFSET = -28;
const TOOLTIP_WIDTH = 76;
const HYPO_LANES = 4;

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

export default function SleepTimelineBar({
  segments,
  bedtime,
  wakeTime,
  sessionBreakdown,
  variant = 'card',
}: SleepTimelineBarProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [scrubX, setScrubX] = useState<number | null>(null);
  const [graphWidth, setGraphWidth] = useState(0);

  const isDetail = variant === 'detail';
  const height = isDetail ? DETAIL_HYPNO_HEIGHT : CARD_HEIGHT;
  const tooltipOffset = isDetail ? DETAIL_TOOLTIP_OFFSET : CARD_TOOLTIP_OFFSET;

  const timelineItems = useMemo(
    () => buildTimelineItems(segments, sessionBreakdown),
    [segments, sessionBreakdown],
  );

  const scrubEnabled = bedtime !== '—' && timelineItems.length > 0;

  const updateScrub = useCallback((clientX: number) => {
    const el = hostRef.current;
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

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!scrubEnabled || e.pointerType === 'touch') return;
    e.stopPropagation();
    updateScrub(e.clientX);
  };

  const onPointerLeave = () => {
    clearScrub();
  };

  const scrubTime = scrubX !== null && graphWidth > 0 && scrubEnabled
    ? timelineClockAtFraction(scrubX / graphWidth, timelineItems, bedtime)
    : null;

  const tooltipLeft = scrubX !== null && graphWidth > 0
    ? Math.max(0, Math.min(scrubX - TOOLTIP_WIDTH / 2, graphWidth - TOOLTIP_WIDTH))
    : 0;

  const scrubOverlay = scrubX !== null && scrubTime ? (
    <>
      <div
        className="sleep-scrub-line"
        style={{
          left: scrubX,
          top: tooltipOffset + 22,
          height: height - tooltipOffset - 22,
        }}
        aria-hidden="true"
      />
      <div
        className="sleep-scrub-tooltip"
        style={{ left: tooltipLeft, width: TOOLTIP_WIDTH, top: tooltipOffset }}
        aria-hidden="true"
      >
        {scrubTime}
      </div>
    </>
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
        <div className="hypno-bar">
          <div className="hypno-seg core" style={{ flex: 1 }} />
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
          ref={hostRef}
          className={`sleep-timeline-scrub-host${scrubEnabled ? ' sleep-timeline-scrub-host--active' : ''}`}
          style={{ height, borderRadius: 6 }}
          onPointerMove={onPointerMove}
          onPointerLeave={onPointerLeave}
          data-post-interactive={scrubEnabled ? true : undefined}
          role="presentation"
        >
          <div className="hypno-bar" style={{ height, borderRadius: 6 }}>
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
          {scrubOverlay}
        </div>
      </div>
    );
  }

  const totalMinutes = totalTimelineMinutes(timelineItems);
  const laneHeight = height / HYPO_LANES;
  let cumulative = 0;

  return (
    <div className={`sleep-timeline sleep-timeline--${variant}`}>
      <div className="sleep-hypnogram-wrap">
        <div className="sleep-hypnogram-axis" style={{ height }} aria-hidden="true">
          {LANE_LABELS.map((lane) => (
            <div key={lane.label} className="sleep-hypnogram-axis-row" style={{ height: laneHeight }}>
              <span className={`sleep-hypnogram-axis-dot sleep-hypnogram-axis-dot--${lane.className}`} />
              <span className="sleep-hypnogram-axis-label">{lane.label}</span>
            </div>
          ))}
        </div>

        <div
          ref={hostRef}
          className={`sleep-hypnogram-chart${scrubEnabled ? ' sleep-timeline-scrub-host--active' : ''}`}
          style={{ height, borderRadius: 8 }}
          onPointerMove={onPointerMove}
          onPointerLeave={onPointerLeave}
          role="presentation"
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
                  style={{ left: `${left}%`, width: `${width}%`, height }}
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
                  top: lane * laneHeight + 2,
                  height: laneHeight - 4,
                }}
              />
            );
          })}

          {scrubOverlay}
        </div>
      </div>

      <div className="sleep-hypnogram-axis-labels">
        <span>{bedtime}</span>
        <span>{wakeTime}</span>
      </div>
    </div>
  );
}
