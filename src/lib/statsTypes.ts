import type { SleepPost } from './types';
import type { PeriodStats } from './compareStats';

export type PR = { value: number; date: string; postId: string | null } | null;

export type UserStats = {
  currentStreak: number;
  longestStreak: number;
  weeklyPosts: SleepPost[];
  avgAsleepMinutes: number;
  prLongestSleep: PR;
  prShortestSleep: PR;
  prMostWakes: PR;
  prMostDeep: PR;
  prMostRem: PR;
  prMostCore: PR;
  prHighestDeepPct: PR;
  prHighestRemPct: PR;
  prHighestCorePct: PR;
  prLowestDeepPct: PR;
  prLowestRemPct: PR;
  prLowestCorePct: PR;
};

export type TopNight = {
  postId: string;
  sleepDate: string;
  asleepMinutes: number;
  deepMinutes: number;
  remMinutes: number;
  coreMinutes: number;
  awakeEvents: number;
};

export type MonthNightBar = {
  sleepDate: string;
  asleepMinutes: number;
};

export type MonthBest = {
  month: string;
  label: string;
  /** Wearable nights in the month. */
  nightCount: number;
  /** Average asleep minutes per night. */
  avgAsleepMinutes: number;
  /** Stage mix of monthly totals (share of asleep). */
  avgDeepPct: number | null;
  avgRemPct: number | null;
  avgCorePct: number | null;
  /** One bar per wake day (naps merged into that date). */
  nights: MonthNightBar[];
  /** Best night asleep minutes. */
  asleepMinutes: number;
  deepMinutes: number;
  remMinutes: number;
  coreMinutes: number;
  /** Stage share on the night that set that stage best. */
  deepPct: number | null;
  remPct: number | null;
  corePct: number | null;
  avgAwakeEvents: number | null;
  avgBedtime: string | null;
  avgWakeTime: string | null;
};

export type LifetimeStats = {
  totalNights: number;
  avgAsleepMinutes: number;
  avgBedtime: string | null;
  avgWakeTime: string | null;
  bestNights: TopNight[];
  shortestNights: TopNight[];
  mostWakesNights: TopNight[];
  mostDeepNights: TopNight[];
  mostRemNights: TopNight[];
  mostCoreNights: TopNight[];
  highestDeepPctNights: TopNight[];
  highestRemPctNights: TopNight[];
  highestCorePctNights: TopNight[];
  lowestDeepPctNights: TopNight[];
  lowestRemPctNights: TopNight[];
  lowestCorePctNights: TopNight[];
  /** Recent wearable nights with stages — used for monthly PR diffs. */
  stageNights: TopNight[];
  monthlyBests: MonthBest[];
};

export type StatsMetric = {
  label: string;
  value: string;
  accent?: string;
};

export type InsightChip = {
  emoji: string;
  label: string;
  detail?: string;
};

export type MonthPeriod = NonNullable<PeriodStats>;
