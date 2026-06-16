import type { SleepPost } from './types';
import type { PeriodStats } from './compareStats';

export type PR = { value: number; date: string; postId: string | null } | null;

export type UserStats = {
  currentStreak: number;
  longestStreak: number;
  weeklyPosts: SleepPost[];
  avgAsleepMinutes: number;
  prLongestSleep: PR;
  prMostDeep: PR;
  prMostRem: PR;
  prMostCore: PR;
};

export type TopNight = {
  postId: string;
  sleepDate: string;
  asleepMinutes: number;
  deepMinutes: number;
  remMinutes: number;
  coreMinutes: number;
};

export type MonthBest = {
  month: string;
  label: string;
  asleepMinutes: number;
  deepMinutes: number;
  remMinutes: number;
  coreMinutes: number;
  avgBedtime: string | null;
  avgWakeTime: string | null;
};

export type LifetimeStats = {
  totalNights: number;
  avgAsleepMinutes: number;
  avgBedtime: string | null;
  avgWakeTime: string | null;
  bestNights: TopNight[];
  mostDeepNights: TopNight[];
  mostRemNights: TopNight[];
  mostCoreNights: TopNight[];
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
