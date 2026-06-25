import type { SleepSessionData } from './types';

export const NAP_SESSION_MAX_MINUTES = 120;
export const SPLIT_GAP_THRESHOLD_MINUTES = 90;

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

export function inferSplitGapMinutes(
  bedtime: string,
  wakeTime: string,
  inBedMinutes: number,
): number | null {
  const start = parseClockToMinutes(bedtime);
  const end = parseClockToMinutes(wakeTime);
  if (start === null || end === null || inBedMinutes <= 0) return null;

  let span = end - start;
  if (span < 0) span += 1440;

  const gap = span - inBedMinutes;
  return gap > 0 ? gap : 0;
}

export function hasNapDay(input: {
  bedtime: string;
  wakeTime: string;
  inBedMinutes: number;
  sessionBreakdown?: SleepSessionData[];
}): boolean {
  if (input.sessionBreakdown && input.sessionBreakdown.length > 1) return true;
  const gap = inferSplitGapMinutes(input.bedtime, input.wakeTime, input.inBedMinutes);
  return gap !== null && gap >= SPLIT_GAP_THRESHOLD_MINUTES;
}

export function isNapSession(session: SleepSessionData): boolean {
  return session.asleepMinutes <= NAP_SESSION_MAX_MINUTES;
}

export function countNaps(sessions?: SleepSessionData[]): number {
  if (!sessions?.length) return 0;
  return sessions.filter(isNapSession).length;
}

export function getSessionLabel(
  session: SleepSessionData,
  index: number,
  sessions: SleepSessionData[],
): string {
  if (sessions.length === 1) return 'Sleep';
  if (isNapSession(session)) {
    const napIndex = sessions.slice(0, index + 1).filter(isNapSession).length;
    const totalNaps = sessions.filter(isNapSession).length;
    return totalNaps === 1 ? 'Nap' : `Nap ${napIndex}`;
  }
  return 'Overnight';
}
