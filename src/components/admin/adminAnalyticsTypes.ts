import type { DateRange, RangePreset } from '../../lib/analyticsRange';

/** Shared props for admin screens with date-range + app-version filters. */
export type AdminAnalyticsScreenProps = {
  range: DateRange;
  preset: RangePreset;
  appVersion: string;
  onPresetChange: (preset: RangePreset) => void;
  onRangeChange: (range: DateRange) => void;
  onAppVersionChange: (version: string) => void;
};
