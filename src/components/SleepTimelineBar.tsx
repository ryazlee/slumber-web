import { useCallback, useMemo, useRef, useState } from 'react';
import type { SleepSessionData, StageSegment } from '../lib/types';
import {
  buildTimelineItems,
  stageSegmentClass,
  timelineClockAtFraction,
} from '../lib/timeline';

type SleepTimelineBarProps = {
  segments: StageSegment[];
  bedtime: string;
  wakeTime: string;
  sessionBreakdown?: SleepSessionData[];
  variant?: 'card' | 'detail';
};

const CARD_HEIGHT = 14;
const DETAIL_HEIGHT = 36;
const CARD_TOOLTIP_OFFSET = -36;
const DETAIL_TOOLTIP_OFFSET = -28;
const TOOLTIP_WIDTH = 76;

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
  const scrubbingRef = useRef(false);

  const height = variant === 'detail' ? DETAIL_HEIGHT : CARD_HEIGHT;
  const tooltipOffset = variant === 'detail' ? DETAIL_TOOLTIP_OFFSET : CARD_TOOLTIP_OFFSET;

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

  const endScrub = useCallback(() => {
    scrubbingRef.current = false;
    setScrubX(null);
  }, []);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!scrubEnabled) return;
    e.preventDefault();
    e.stopPropagation();
    scrubbingRef.current = true;
    hostRef.current?.setPointerCapture(e.pointerId);
    updateScrub(e.clientX);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!scrubbingRef.current) return;
    e.stopPropagation();
    updateScrub(e.clientX);
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!scrubbingRef.current) return;
    e.stopPropagation();
    if (hostRef.current?.hasPointerCapture(e.pointerId)) {
      hostRef.current.releasePointerCapture(e.pointerId);
    }
    endScrub();
  };

  const scrubTime = scrubX !== null && graphWidth > 0 && scrubEnabled
    ? timelineClockAtFraction(scrubX / graphWidth, timelineItems, bedtime)
    : null;

  const tooltipLeft = scrubX !== null && graphWidth > 0
    ? Math.max(0, Math.min(scrubX - TOOLTIP_WIDTH / 2, graphWidth - TOOLTIP_WIDTH))
    : 0;

  if (timelineItems.length === 0) {
    return (
      <div className={`sleep-timeline sleep-timeline--${variant}`}>
        <div className="hypno-labels">
          <span>{bedtime}</span>
          <span>{wakeTime}</span>
        </div>
        <div className="hypno-bar">
          <div className="hypno-seg core" style={{ flex: 1 }} />
        </div>
      </div>
    );
  }

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
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClick={(e) => e.stopPropagation()}
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

        {scrubX !== null && scrubTime && (
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
        )}
      </div>
    </div>
  );
}
