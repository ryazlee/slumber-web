import type { AppVersionRow } from '../../lib/admin';
import {
  presetForRange,
  rangeForPreset,
  todayISO,
  type DateRange,
  type RangePreset,
} from '../../lib/analyticsRange';

type Props = {
  range: DateRange;
  preset: RangePreset;
  appVersion: string;
  versions: AppVersionRow[];
  versionsLoading: boolean;
  loading?: boolean;
  onPresetChange: (preset: RangePreset) => void;
  onRangeChange: (range: DateRange) => void;
  onAppVersionChange: (version: string) => void;
};

const CHIP_PRESETS: { id: Exclude<RangePreset, 'custom'>; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: '7', label: '7d' },
  { id: '14', label: '14d' },
  { id: '30', label: '30d' },
  { id: '90', label: '90d' },
];

export default function AdminAnalyticsFilters({
  range,
  preset,
  appVersion,
  versions,
  versionsLoading,
  loading,
  onPresetChange,
  onRangeChange,
  onAppVersionChange,
}: Props) {
  const showVersion = versions.length > 0;

  const handlePreset = (next: Exclude<RangePreset, 'custom'>) => {
    onPresetChange(next);
    onRangeChange(rangeForPreset(next, todayISO()));
  };

  const handleDateChange = (part: 'start' | 'end', value: string) => {
    const nextRange = { ...range, [part]: value };
    onRangeChange(nextRange);
    onPresetChange(presetForRange(nextRange));
  };

  return (
    <div
      className={`admin-analytics-bar${loading ? ' admin-analytics-bar--loading' : ''}`}
      aria-busy={loading || undefined}
    >
      <div className="admin-tabs admin-tabs-sub" role="group" aria-label="Date range presets">
        {CHIP_PRESETS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={preset === item.id ? 'admin-tab active' : 'admin-tab'}
            onClick={() => handlePreset(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="admin-analytics-dates">
        <input
          className="admin-input admin-analytics-date"
          type="date"
          value={range.start}
          max={range.end}
          aria-label="Start date"
          onChange={(e) => handleDateChange('start', e.target.value)}
        />
        <span className="admin-analytics-date-sep" aria-hidden>–</span>
        <input
          className="admin-input admin-analytics-date"
          type="date"
          value={range.end}
          min={range.start}
          max={todayISO()}
          aria-label="End date"
          onChange={(e) => handleDateChange('end', e.target.value)}
        />
      </div>

      {showVersion ? (
        <select
          id="analytics-version"
          className="admin-input admin-input-select admin-analytics-version"
          value={appVersion}
          onChange={(e) => onAppVersionChange(e.target.value)}
          disabled={versionsLoading}
          aria-label="App version"
        >
          <option value="">All versions</option>
          {versions.map((row) => (
            <option key={row.version} value={row.version}>
              v{row.version} ({row.user_count})
            </option>
          ))}
        </select>
      ) : null}
    </div>
  );
}
