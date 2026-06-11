import type { FormEvent } from 'react';
import type { AppVersionRow } from '../../lib/admin';
import {
  formatRangeLabel,
  rangeForPreset,
  todayISO,
  type DateRange,
  type RangePreset,
} from '../../lib/analyticsRange';
import AdminFilterBar, { AdminFilterField } from './AdminFilterBar';

type Props = {
  range: DateRange;
  preset: RangePreset;
  appVersion: string;
  versions: AppVersionRow[];
  versionsLoading: boolean;
  onPresetChange: (preset: RangePreset) => void;
  onRangeChange: (range: DateRange) => void;
  onAppVersionChange: (version: string) => void;
  onApply: () => void;
  applying?: boolean;
};

const PRESETS: { id: RangePreset; label: string }[] = [
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
  onPresetChange,
  onRangeChange,
  onAppVersionChange,
  onApply,
  applying,
}: Props) {
  const handlePreset = (next: RangePreset) => {
    onPresetChange(next);
    if (next !== 'custom') {
      onRangeChange(rangeForPreset(next, todayISO()));
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onApply();
  };

  return (
    <form className="admin-analytics-filters" onSubmit={handleSubmit}>
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

      <AdminFilterBar>
        <AdminFilterField label="Start" htmlFor="analytics-start">
          <input
            id="analytics-start"
            className="admin-input"
            type="date"
            value={range.start}
            max={range.end}
            onChange={(e) => {
              onPresetChange('custom');
              onRangeChange({ ...range, start: e.target.value });
            }}
          />
        </AdminFilterField>
        <AdminFilterField label="End" htmlFor="analytics-end">
          <input
            id="analytics-end"
            className="admin-input"
            type="date"
            value={range.end}
            min={range.start}
            max={todayISO()}
            onChange={(e) => {
              onPresetChange('custom');
              onRangeChange({ ...range, end: e.target.value });
            }}
          />
        </AdminFilterField>
        <AdminFilterField label="App version" htmlFor="analytics-version">
          <select
            id="analytics-version"
            className="admin-input admin-input-select"
            value={appVersion}
            onChange={(e) => onAppVersionChange(e.target.value)}
            disabled={versionsLoading}
          >
            <option value="">All versions</option>
            {versions.map((row) => (
              <option key={row.version} value={row.version}>
                v{row.version} ({row.user_count})
              </option>
            ))}
          </select>
        </AdminFilterField>
      </AdminFilterBar>

      <div className="admin-filter-actions admin-analytics-filter-actions">
        <p className="admin-muted admin-filter-note">
          {formatRangeLabel(range)}
          {appVersion ? ` · v${appVersion}` : ''}
          {versions.length === 0 && !versionsLoading ? ' · No app versions reported yet' : ''}
        </p>
        <button className="admin-button" type="submit" disabled={applying}>
          {applying ? 'Applying…' : 'Apply'}
        </button>
      </div>
    </form>
  );
}
