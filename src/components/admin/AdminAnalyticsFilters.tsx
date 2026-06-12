import type { AppVersionRow } from '../../lib/admin';
import {
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

const PRESETS: { id: RangePreset; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: '7', label: '7d' },
  { id: '14', label: '14d' },
  { id: '30', label: '30d' },
  { id: '90', label: '90d' },
  { id: 'custom', label: 'Custom' },
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
  const handlePreset = (next: RangePreset) => {
    onPresetChange(next);
    if (next !== 'custom') {
      onRangeChange(rangeForPreset(next, todayISO()));
    }
  };

  return (
    <div className="admin-analytics-filters admin-analytics-filters--compact">
      <div className="admin-analytics-toolbar">
        <div className="admin-tabs admin-tabs-sub" role="group" aria-label="Date range presets">
          {PRESETS.map((item) => (
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

        {preset === 'custom' && (
          <div className="admin-analytics-custom-dates">
            <input
              id="analytics-start"
              className="admin-input admin-analytics-date"
              type="date"
              value={range.start}
              max={range.end}
              aria-label="Start date"
              onChange={(e) => {
                onPresetChange('custom');
                onRangeChange({ ...range, start: e.target.value });
              }}
            />
            <span className="admin-analytics-date-sep" aria-hidden>–</span>
            <input
              id="analytics-end"
              className="admin-input admin-analytics-date"
              type="date"
              value={range.end}
              min={range.start}
              max={todayISO()}
              aria-label="End date"
              onChange={(e) => {
                onPresetChange('custom');
                onRangeChange({ ...range, end: e.target.value });
              }}
            />
          </div>
        )}

        {loading ? <span className="admin-muted admin-analytics-loading">Updating…</span> : null}
      </div>
    </div>
  );
}
