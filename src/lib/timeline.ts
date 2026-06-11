import type { SleepSessionData, StageSegment } from './types';

export function parseClockToMinutes(label: string): number | null {
  const match = label.trim().match(/^(\d{1,2}):(\d{2})\s*([AaPp][Mm])$/);
  if (!match) return null;

  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const ampm = match[3].toUpperCase();
  if (Number.isNaN(hour) || Number.isNaN(minute) || minute > 59) return null;

  if (hour === 12) hour = 0;
  if (ampm === 'PM') hour += 12;
  return hour * 60 + minute;
}

export function formatClockMinutes(minsOfDay: number): string {
  const wrapped = Math.round(((minsOfDay % 1440) + 1440) % 1440);
  const h24 = Math.floor(wrapped / 60);
  const m = wrapped % 60;
  const ampm = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
}

const NAP_SESSION_MAX_MINUTES = 120;

function isNapSession(session: SleepSessionData): boolean {
  return session.asleepMinutes < NAP_SESSION_MAX_MINUTES;
}

function gapMinutesBetweenSessions(wakeTime: string, bedtime: string): number {
  const wake = parseClockToMinutes(wakeTime);
  const bed = parseClockToMinutes(bedtime);
  if (wake === null || bed === null) return 0;
  let gap = bed - wake;
  if (gap < 0) gap += 1440;
  return gap;
}

export type TimelineItem =
  | { kind: 'segment'; segment: StageSegment; sessionIndex: number }
  | { kind: 'gap'; minutes: number; afterSessionIndex: number; isAfterNap: boolean };

export function buildTimelineItems(
  segments: StageSegment[],
  sessionBreakdown?: SleepSessionData[],
): TimelineItem[] {
  if (!sessionBreakdown || sessionBreakdown.length < 2) {
    return segments.map((segment) => ({ kind: 'segment' as const, segment, sessionIndex: 0 }));
  }

  const items: TimelineItem[] = [];
  for (let si = 0; si < sessionBreakdown.length; si++) {
    const session = sessionBreakdown[si];
    for (const segment of session.segments) {
      items.push({ kind: 'segment', segment, sessionIndex: si });
    }
    if (si < sessionBreakdown.length - 1) {
      const gap = gapMinutesBetweenSessions(session.wakeTime, sessionBreakdown[si + 1].bedtime);
      items.push({
        kind: 'gap',
        minutes: gap,
        afterSessionIndex: si,
        isAfterNap: isNapSession(session),
      });
    }
  }
  return items;
}

export function timelineClockAtFraction(
  fraction: number,
  items: TimelineItem[],
  startLabel: string,
): string | null {
  const startMins = parseClockToMinutes(startLabel);
  if (startMins === null) return null;

  const totalMinutes = items.reduce(
    (sum, item) => sum + (item.kind === 'gap' ? item.minutes : item.segment.minutes),
    0,
  );
  if (totalMinutes <= 0) return null;

  const target = Math.max(0, Math.min(1, fraction)) * totalMinutes;
  let cumulative = 0;
  let clock = startMins;

  for (const item of items) {
    const mins = item.kind === 'gap' ? item.minutes : item.segment.minutes;
    if (cumulative + mins >= target) {
      const offset = target - cumulative;
      return formatClockMinutes(clock + offset);
    }
    cumulative += mins;
    clock += mins;
  }

  return formatClockMinutes(clock);
}

export function segmentsForPost(input: {
  stageSegments: StageSegment[];
  coreMinutes: number;
  deepMinutes: number;
  remMinutes: number;
  awakeMinutes: number;
}): StageSegment[] {
  if (input.stageSegments.length > 0) return input.stageSegments;

  const parts: StageSegment[] = [];
  if (input.coreMinutes > 0) parts.push({ type: 'CORE', minutes: input.coreMinutes });
  if (input.deepMinutes > 0) parts.push({ type: 'DEEP', minutes: input.deepMinutes });
  if (input.remMinutes > 0) parts.push({ type: 'REM', minutes: input.remMinutes });
  if (input.awakeMinutes > 0) parts.push({ type: 'AWAKE', minutes: input.awakeMinutes });
  return parts;
}

export function stageSegmentClass(type: StageSegment['type']): string {
  return type.toLowerCase();
}
