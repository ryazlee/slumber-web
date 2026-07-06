import type { SleepSessionData } from './types';

export const NAP_SESSION_MAX_MINUTES = 120;
export const SPLIT_GAP_THRESHOLD_MINUTES = 90;
export const MAIN_SLEEP_MIN_MINUTES = 240;
export const MORNING_WAKE_END_MINUTES = 12 * 60;
export const DAYTIME_WAKE_START_MINUTES = MORNING_WAKE_END_MINUTES;
export const DAYTIME_WAKE_END_MINUTES = 21 * 60;

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

export function isDaytimeWake(wakeTime: string): boolean {
  const mins = parseClockToMinutes(wakeTime);
  if (mins === null) return false;
  return mins >= DAYTIME_WAKE_START_MINUTES && mins <= DAYTIME_WAKE_END_MINUTES;
}

function isNighttimeBedtime(bedtime: string): boolean {
  const mins = parseClockToMinutes(bedtime);
  if (mins === null) return false;
  return mins >= 21 * 60 || mins < 6 * 60;
}

function isMorningWake(wakeTime: string): boolean {
  const mins = parseClockToMinutes(wakeTime);
  if (mins === null) return false;
  return mins < MORNING_WAKE_END_MINUTES;
}

export function matchesMainSleepPattern(session: SleepSessionData): boolean {
  if (isNighttimeBedtime(session.bedtime) && isMorningWake(session.wakeTime)) {
    return true;
  }
  if (session.asleepMinutes >= MAIN_SLEEP_MIN_MINUTES && isMorningWake(session.wakeTime)) {
    return true;
  }
  return false;
}

function classifyStandaloneIsNap(session: SleepSessionData): boolean {
  if (matchesMainSleepPattern(session)) return false;
  if (isDaytimeWake(session.wakeTime)) return true;
  return session.asleepMinutes <= NAP_SESSION_MAX_MINUTES;
}

export function classifySessionNaps(sessions: SleepSessionData[]): boolean[] {
  if (sessions.length === 0) return [];
  if (sessions.length === 1) return [classifyStandaloneIsNap(sessions[0])];

  const mainCandidates = sessions
    .map((s, i) => ({ i, s }))
    .filter(({ s }) => matchesMainSleepPattern(s));

  let mainIndex: number;
  if (mainCandidates.length >= 1) {
    mainIndex = mainCandidates.reduce((best, curr) =>
      (curr.s.asleepMinutes > best.s.asleepMinutes ? curr : best),
    ).i;
  } else {
    const nonDaytime = sessions
      .map((s, i) => ({ i, s }))
      .filter(({ s }) => !isDaytimeWake(s.wakeTime));
    if (nonDaytime.length === 0) {
      return sessions.map(() => true);
    }
    mainIndex = nonDaytime.reduce((best, curr) =>
      (curr.s.asleepMinutes > best.s.asleepMinutes ? curr : best),
    ).i;
  }

  return sessions.map((_, i) => i !== mainIndex);
}

export function isOvernightSession(session: SleepSessionData): boolean {
  return matchesMainSleepPattern(session);
}

export function isNapSession(
  session: SleepSessionData,
  sessionIndex?: number,
  allSessions?: SleepSessionData[],
): boolean {
  if (allSessions && allSessions.length > 1 && sessionIndex !== undefined) {
    return classifySessionNaps(allSessions)[sessionIndex];
  }
  return classifyStandaloneIsNap(session);
}

export function countNaps(sessions?: SleepSessionData[]): number {
  if (!sessions?.length) return 0;
  return classifySessionNaps(sessions).filter(Boolean).length;
}

export function getSessionLabel(
  session: SleepSessionData,
  index: number,
  sessions: SleepSessionData[],
): string {
  if (sessions.length === 1) return 'Sleep';
  if (isNapSession(session, index, sessions)) {
    const napFlags = classifySessionNaps(sessions);
    const napIndex = napFlags.slice(0, index + 1).filter(Boolean).length;
    const totalNaps = napFlags.filter(Boolean).length;
    return totalNaps === 1 ? 'Nap' : `Nap ${napIndex}`;
  }
  return 'Overnight';
}
