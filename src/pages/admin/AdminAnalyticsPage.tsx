import { useState } from 'react';
import AdminAnalytics from '../../components/admin/AdminAnalytics';
import { rangeForPreset, type DateRange, type RangePreset } from '../../lib/analyticsRange';

export default function AdminAnalyticsPage() {
  const [preset, setPreset] = useState<RangePreset>('30');
  const [range, setRange] = useState<DateRange>(() => rangeForPreset('30'));
  const [appVersion, setAppVersion] = useState('');

  return (
    <AdminAnalytics
      range={range}
      preset={preset}
      appVersion={appVersion}
      onPresetChange={setPreset}
      onRangeChange={setRange}
      onAppVersionChange={setAppVersion}
      listLimit={50}
    />
  );
}
