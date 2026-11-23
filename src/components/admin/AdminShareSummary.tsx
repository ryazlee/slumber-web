import { useMemo, useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { useAdmin } from '../../context/AdminContext';
import { useDailyActivity, useHealthMetrics } from '../../hooks/useAdmin';
import type { AnalyticsFilters, DailyActivityRow, HealthMetrics } from '../../lib/admin';
import {
  ALL_TIME_START,
  dayCount,
  formatRangeLabel,
  presetForRange,
  rangeForPreset,
  toISODate,
  todayISO,
  type DateRange,
  type RangePreset,
} from '../../lib/analyticsRange';
import AdminActivityChart from './AdminActivityChart';
import AdminMetricCard from './AdminMetricCard';
import { formatNumber, metricDelta } from './format';
import { withCumulativeUsers } from './userGrowth';

const MAX_DAYS = 90;

type WindowPreset = 'today' | '7' | '30' | '90' | 'all';

const WINDOW_CHIPS: { id: WindowPreset; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: '7', label: 'Last week' },
  { id: '30', label: 'Last 30 days' },
  { id: '90', label: '90d' },
  { id: 'all', label: 'All time' },
];

function clampRange(range: DateRange): DateRange {
  const today = todayISO();
  let { start, end } = range;
  if (!start || !end) return rangeForPreset('30');
  if (end > today) end = today;
  if (start > end) start = end;
  if (presetForRange({ start, end }, today) === 'all') return { start, end };
  if (dayCount({ start, end }) > MAX_DAYS) {
    const endDate = new Date(`${end}T12:00:00`);
    endDate.setDate(endDate.getDate() - (MAX_DAYS - 1));
    start = toISODate(endDate);
  }
  return { start, end };
}

function windowPreset(range: DateRange): RangePreset {
  const matched = presetForRange(range);
  if (matched === 'today' || matched === '7' || matched === '30' || matched === '90' || matched === 'all') {
    return matched;
  }
  return 'custom';
}

function windowTitle(range: DateRange): string {
  const preset = windowPreset(range);
  if (preset === 'today' && range.start === todayISO()) return 'Today';
  if (preset === '7') return 'Last week';
  if (preset === '30') return 'Last 30 days';
  if (preset === '90') return 'Last 90 days';
  if (preset === 'all') return 'All time';
  return formatRangeLabel(range);
}

function comparisonNote(range: DateRange, days: number): string {
  const preset = windowPreset(range);
  if (preset === 'all') return 'Full history. No previous window to compare.';
  if (preset === 'today' && range.start === todayISO()) return 'Compared with yesterday.';
  if (days === 1) return 'Compared with the previous day.';
  return `Compared with the previous ${days} days.`;
}

function rate(part: number, whole: number): number | null {
  if (!whole) return null;
  return Math.round((part / whole) * 1000) / 10;
}

function rateLabel(part: number, whole: number): string {
  const points = rate(part, whole);
  if (points == null) return '—';
  return `${points}%`;
}

function countDelta(current: number, previous: number | undefined) {
  if (previous == null) return {};
  const delta = metricDelta(current, previous);
  if (delta == null) return {};
  return { delta, previous, compactDelta: true as const };
}

type BarRow = {
  label: string;
  value: number;
  text: string;
};

type IncludeItem = {
  id: string;
  label: string;
  group: 'Numbers' | 'Charts' | 'Detail' | 'Right now';
  available: boolean;
  reason?: string;
};

const INCLUDE_GROUPS: IncludeItem['group'][] = ['Numbers', 'Charts', 'Detail', 'Right now'];

function IncludeBar({
  items,
  hidden,
  onToggle,
}: {
  items: IncludeItem[];
  hidden: ReadonlySet<string>;
  onToggle: (id: string) => void;
}) {
  return (
    <div className="admin-share-include">
      {INCLUDE_GROUPS.map((group) => {
        const groupItems = items.filter((item) => item.group === group);
        if (groupItems.length === 0) return null;
        return (
          <div key={group} className="admin-share-include-group">
            <p className="admin-share-include-label">{group}</p>
            <div className="admin-share-include-chips" role="group" aria-label={group}>
              {groupItems.map((item) => {
                const on = !hidden.has(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={on ? 'admin-tab active' : 'admin-tab'}
                    aria-pressed={on}
                    title={item.available || !on ? undefined : item.reason}
                    onClick={() => onToggle(item.id)}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ShareBars({ title, rows, max }: { title: string; rows: BarRow[]; max: number }) {
  const scale = Math.max(max, 1);
  return (
    <section className="admin-share-block">
      <h3 className="admin-share-block-title">{title}</h3>
      <div className="admin-share-bars">
        {rows.map((row) => (
          <div key={row.label} className="admin-share-bar-row">
            <span className="admin-share-bar-label">{row.label}</span>
            <span className="admin-share-bar-track" aria-hidden>
              <span
                className="admin-share-bar-fill"
                style={{ width: `${row.value <= 0 ? 0 : Math.max(2, (row.value / scale) * 100)}%` }}
              />
            </span>
            <span className="admin-share-bar-value">{row.text}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function rateRows(health: HealthMetrics): BarRow[] {
  const posts = health.engagement.posts;
  const rows: BarRow[] = [
    {
      label: 'Dream logs',
      value: rate(health.engagement.posts_with_dreams, posts) ?? 0,
      text: posts
        ? `${rateLabel(health.engagement.posts_with_dreams, posts)} · ${formatNumber(health.engagement.posts_with_dreams)}`
        : '—',
    },
  ];
  if (typeof health.engagement.posts_with_comments === 'number') {
    rows.push({
      label: 'Nights with a comment',
      value: rate(health.engagement.posts_with_comments, posts) ?? 0,
      text: rateLabel(health.engagement.posts_with_comments, posts),
    });
  }
  if (typeof health.engagement.posts_with_kudos === 'number') {
    rows.push({
      label: 'Nights with kudos',
      value: rate(health.engagement.posts_with_kudos, posts) ?? 0,
      text: rateLabel(health.engagement.posts_with_kudos, posts),
    });
  }
  rows.push({
    label: 'Wearable nights',
    value: rate(health.engagement.wearable_posts, posts) ?? 0,
    text: posts
      ? `${rateLabel(health.engagement.wearable_posts, posts)} · ${formatNumber(health.engagement.wearable_posts)}`
      : '—',
  });
  return rows;
}

function activityRows(health: HealthMetrics): BarRow[] {
  const engagement = health.engagement;
  const rows: BarRow[] = [
    { label: 'First-time posters', value: health.activation.first_time_posters, text: formatNumber(health.activation.first_time_posters) },
    { label: 'New friendships', value: engagement.friendships_accepted ?? 0, text: formatNumber(engagement.friendships_accepted ?? 0) },
    { label: 'Friend requests', value: engagement.friend_requests ?? 0, text: formatNumber(engagement.friend_requests ?? 0) },
    { label: 'Club joins', value: engagement.club_joins ?? 0, text: formatNumber(engagement.club_joins ?? 0) },
    { label: 'New clubs', value: engagement.clubs_created ?? 0, text: formatNumber(engagement.clubs_created ?? 0) },
    { label: 'New challenges', value: engagement.challenges_created ?? 0, text: formatNumber(engagement.challenges_created ?? 0) },
    { label: 'Sleep buddy tags', value: engagement.buddy_tags ?? 0, text: formatNumber(engagement.buddy_tags ?? 0) },
  ];
  if (typeof engagement.invite_signups === 'number') {
    rows.push(
      { label: 'Invited accounts', value: engagement.invite_signups, text: formatNumber(engagement.invite_signups) },
      { label: 'People inviting', value: engagement.inviters ?? 0, text: formatNumber(engagement.inviters ?? 0) },
    );
  }
  return rows;
}

export default function AdminShareSummary() {
  const { metrics } = useAdmin();
  const sheetRef = useRef<HTMLElement>(null);
  const [range, setRange] = useState<DateRange>(() => rangeForPreset('30'));
  const [hidden, setHidden] = useState<ReadonlySet<string>>(() => new Set());
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const visible = (id: string) => !hidden.has(id);
  const toggle = (id: string) => {
    setHidden((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const preset = windowPreset(range);
  const healthQuery = useHealthMetrics(range);
  const health = healthQuery.data ?? null;
  const days = health?.days ?? dayCount(range);
  const singleDay = days <= 1;
  const compare = preset === 'all' ? undefined : health?.previous;

  const filters = useMemo<AnalyticsFilters>(() => ({
    start: range.start,
    end: range.end,
    appVersion: null,
  }), [range.start, range.end]);
  const activityQuery = useDailyActivity(filters, !singleDay);
  const activity: DailyActivityRow[] = activityQuery.data ?? [];
  const seriesEndsToday = range.end === todayISO()
    && activity.length > 0
    && activity[activity.length - 1].day.slice(0, 10) === todayISO();
  const cumulative = seriesEndsToday ? withCumulativeUsers(activity, metrics?.total_users ?? null) : null;
  const edgeYear = range.start === ALL_TIME_START
    || range.start.slice(0, 4) !== range.end.slice(0, 4);

  const rates = health ? rateRows(health) : [];
  const activityBars = health ? activityRows(health) : [];
  const activityMax = activityBars.reduce((max, row) => Math.max(max, row.value), 0);

  const dreamCurrent = health ? rate(health.engagement.posts_with_dreams, health.engagement.posts) : null;
  const dreamPrevious = compare
    ? rate(compare.engagement.posts_with_dreams, compare.engagement.posts)
    : null;
  const chartsReady = !singleDay && !activityQuery.isError && activity.length > 0;
  const includeItems: IncludeItem[] = [
    { id: 'users', label: 'Total users', group: 'Numbers', available: metrics != null, reason: 'Still loading accounts' },
    { id: 'signups', label: 'New users', group: 'Numbers', available: true },
    { id: 'posters', label: 'Active posters', group: 'Numbers', available: true },
    { id: 'posts', label: 'Sleep posts', group: 'Numbers', available: true },
    { id: 'comments', label: 'Comments', group: 'Numbers', available: true },
    { id: 'kudos', label: 'Kudos', group: 'Numbers', available: true },
    { id: 'dreams', label: 'Dream log rate', group: 'Numbers', available: true },
    {
      id: 'chart-users',
      label: 'Total users',
      group: 'Charts',
      available: chartsReady && cumulative != null,
      reason: singleDay ? 'Needs more than one day' : 'Available when the range ends today',
    },
    { id: 'chart-signups', label: 'New users', group: 'Charts', available: chartsReady, reason: singleDay ? 'Needs more than one day' : 'No daily activity in this window' },
    { id: 'chart-active', label: 'People posting', group: 'Charts', available: chartsReady, reason: singleDay ? 'Needs more than one day' : 'No daily activity in this window' },
    { id: 'chart-posts', label: 'Sleep posts', group: 'Charts', available: chartsReady, reason: singleDay ? 'Needs more than one day' : 'No daily activity in this window' },
    { id: 'chart-comments', label: 'Comments', group: 'Charts', available: chartsReady, reason: singleDay ? 'Needs more than one day' : 'No daily activity in this window' },
    { id: 'bars-nights', label: 'How nights landed', group: 'Detail', available: true },
    { id: 'bars-app', label: 'Around the app', group: 'Detail', available: true },
    { id: 'now-wau', label: 'Weekly posters', group: 'Right now', available: true },
    { id: 'now-mau', label: 'Monthly posters', group: 'Right now', available: true },
    { id: 'now-ratio', label: 'WAU / MAU', group: 'Right now', available: true },
    { id: 'now-friends', label: 'Friendships', group: 'Right now', available: metrics != null, reason: 'Still loading accounts' },
    { id: 'now-challenges', label: 'Active challenges', group: 'Right now', available: metrics != null, reason: 'Still loading accounts' },
    { id: 'now-premium', label: 'Premium', group: 'Right now', available: metrics != null, reason: 'Still loading accounts' },
  ];
  const showNumbers = ['users', 'signups', 'posters', 'posts', 'comments', 'kudos', 'dreams'].some((id) => visible(id) && (id !== 'users' || metrics != null));
  const showCharts = ['chart-users', 'chart-signups', 'chart-active', 'chart-posts', 'chart-comments'].some((id) => visible(id));
  const showNights = visible('bars-nights');
  const showApp = visible('bars-app');
  const showNow = ['now-wau', 'now-mau', 'now-ratio'].some(visible)
    || (metrics != null && ['now-friends', 'now-challenges', 'now-premium'].some(visible));

  const exportPng = async () => {
    const node = sheetRef.current;
    if (!node || exporting) return;
    setExporting(true);
    setExportError(null);
    try {
      const backgroundColor = getComputedStyle(node).backgroundColor;
      const dataUrl = await toPng(node, {
        pixelRatio: 2,
        backgroundColor,
        cacheBust: true,
        skipFonts: true,
      });
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `slumber-summary-${range.start}-to-${range.end}.png`;
      link.click();
    } catch {
      setExportError('Could not export the image.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="admin-share">
      <div className="admin-analytics-bar" aria-busy={healthQuery.isFetching || undefined}>
        <div className="admin-tabs admin-tabs-sub" role="group" aria-label="Summary window">
          {WINDOW_CHIPS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={preset === item.id ? 'admin-tab active' : 'admin-tab'}
              aria-pressed={preset === item.id}
              onClick={() => setRange(rangeForPreset(item.id))}
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
            onChange={(event) => setRange(clampRange({ ...range, start: event.target.value }))}
          />
          <span className="admin-analytics-date-sep" aria-hidden>–</span>
          <input
            className="admin-input admin-analytics-date"
            type="date"
            value={range.end}
            min={range.start}
            max={todayISO()}
            aria-label="End date"
            onChange={(event) => setRange(clampRange({ ...range, end: event.target.value }))}
          />
        </div>
      </div>

      <div className="admin-share-tools">
        <IncludeBar items={includeItems} hidden={hidden} onToggle={toggle} />
        <button
          type="button"
          className="admin-button"
          onClick={() => { void exportPng(); }}
          disabled={!health || exporting}
        >
          {exporting ? 'Exporting…' : 'Export PNG'}
        </button>
      </div>
      {exportError ? <p className="admin-error">{exportError}</p> : null}

      {healthQuery.isError ? <p className="admin-error admin-error-banner">Could not load this window.</p> : null}
      {!health && healthQuery.isLoading ? <p className="admin-muted">Loading summary…</p> : null}

      {health ? (
        <article ref={sheetRef} className="admin-share-sheet">
          <header className="admin-share-head">
            <p className="admin-share-kicker">Slumber</p>
            <h2 className="admin-share-title">{windowTitle(range)}</h2>
            <p className="admin-share-range">
              {formatRangeLabel(range)}
              {' · '}
              {comparisonNote(range, days)}
            </p>
          </header>

          {showNumbers ? (
            <div className="admin-engage-grid">
              {metrics && visible('users') ? (
                <AdminMetricCard
                  label="Total users"
                  value={metrics.total_users}
                  sub="Accounts right now"
                />
              ) : null}
              {visible('signups') ? (
                <AdminMetricCard
                  label="New users"
                  value={health.activation.signups}
                  sub={`${formatNumber(health.activation.first_time_posters)} posted for the first time`}
                  {...countDelta(health.activation.signups, compare?.activation.signups)}
                />
              ) : null}
              {visible('posters') ? (
                <AdminMetricCard
                  label="Active posters"
                  value={health.engagement.active_posters}
                  sub={health.engagement.active_posters
                    ? `${(health.engagement.posts / health.engagement.active_posters).toFixed(1)} posts each`
                    : 'No posts in this window'}
                  {...countDelta(health.engagement.active_posters, compare?.engagement.active_posters)}
                />
              ) : null}
              {visible('posts') ? (
                <AdminMetricCard
                  label="Sleep posts"
                  value={health.engagement.posts}
                  sub={`${formatNumber(health.engagement.wearable_posts)} wearable · ${formatNumber(health.engagement.manual_posts)} manual`}
                  {...countDelta(health.engagement.posts, compare?.engagement.posts)}
                />
              ) : null}
              {visible('comments') ? (
                <AdminMetricCard
                  label="Comments"
                  value={health.engagement.comments}
                  sub={typeof health.engagement.commenters === 'number'
                    ? `${formatNumber(health.engagement.commenters)} people`
                    : undefined}
                  {...countDelta(health.engagement.comments, compare?.engagement.comments)}
                />
              ) : null}
              {visible('kudos') ? (
                <AdminMetricCard
                  label="Kudos"
                  value={health.engagement.kudos}
                  {...countDelta(health.engagement.kudos, compare?.engagement.kudos)}
                />
              ) : null}
              {visible('dreams') ? (
                <AdminMetricCard
                  label="Dream log rate"
                  value={dreamCurrent == null ? '—' : `${dreamCurrent}%`}
                  sub={`${formatNumber(health.engagement.posts_with_dreams)} with a dream`}
                  {...(dreamCurrent != null && dreamPrevious != null
                    ? {
                      delta: Math.round((dreamCurrent - dreamPrevious) * 10) / 10,
                      pointsDelta: true as const,
                      compactDelta: true as const,
                    }
                    : {})}
                />
              ) : null}
            </div>
          ) : null}

          {showCharts ? (
            singleDay ? (
              <p className="admin-muted admin-share-note">Pick more than one day to see the daily charts.</p>
            ) : activityQuery.isError ? (
              <p className="admin-error">Could not load the daily charts.</p>
            ) : activity.length === 0 ? (
              <p className="admin-muted">{activityQuery.isLoading ? 'Loading charts…' : 'No daily activity in this window.'}</p>
            ) : (
              <div className="admin-chart-grid admin-chart-grid--pair admin-share-charts">
                {cumulative && visible('chart-users') ? (
                  <div className="admin-chart-span">
                    <AdminActivityChart
                      title="Total users"
                      rows={cumulative}
                      series="total_users"
                      variant="line"
                      edgeYear={edgeYear}
                      summary={formatNumber(cumulative[cumulative.length - 1]?.total_users ?? 0)}
                    />
                  </div>
                ) : null}
                {visible('chart-signups') ? (
                  <AdminActivityChart
                    title="New users each day"
                    rows={activity}
                    series="signups"
                    color="var(--rem)"
                    edgeYear={edgeYear}
                    summary={formatNumber(health.activation.signups)}
                  />
                ) : null}
                {visible('chart-active') ? (
                  <AdminActivityChart
                    title="People who logged sleep"
                    rows={activity}
                    series="active_users"
                    color="var(--accent)"
                    edgeYear={edgeYear}
                    summary={formatNumber(health.engagement.active_posters)}
                  />
                ) : null}
                {visible('chart-posts') ? (
                  <AdminActivityChart
                    title="Sleep posts each day"
                    rows={activity}
                    series="posts"
                    color="var(--deep)"
                    edgeYear={edgeYear}
                    summary={formatNumber(health.engagement.posts)}
                  />
                ) : null}
                {visible('chart-comments') ? (
                  <AdminActivityChart
                    title="Comments each day"
                    rows={activity}
                    series="comments"
                    color="var(--core)"
                    edgeYear={edgeYear}
                    summary={formatNumber(health.engagement.comments)}
                  />
                ) : null}
              </div>
            )
          ) : null}

          {showNights || showApp ? (
            <div className="admin-share-blocks">
              {showNights ? <ShareBars title="How nights landed" rows={rates} max={100} /> : null}
              {showApp ? <ShareBars title="Around the app" rows={activityBars} max={activityMax} /> : null}
            </div>
          ) : null}

          {showNow ? (
            <section className="admin-share-block">
              <h3 className="admin-share-block-title">Right now</h3>
              <div className="admin-engage-grid">
                {visible('now-wau') ? (
                  <AdminMetricCard
                    label="Weekly posters"
                    value={health.retention.wau}
                    sub="Posted in the last 7 days"
                  />
                ) : null}
                {visible('now-mau') ? (
                  <AdminMetricCard
                    label="Monthly posters"
                    value={health.retention.mau}
                    sub="Posted in the last 30 days"
                  />
                ) : null}
                {visible('now-ratio') ? (
                  <AdminMetricCard
                    label="WAU / MAU"
                    value={health.retention.mau ? rateLabel(health.retention.wau, health.retention.mau) : '—'}
                    sub="Weekly posters among monthly posters"
                  />
                ) : null}
                {metrics && visible('now-friends') ? (
                  <AdminMetricCard
                    label="Friendships"
                    value={metrics.friendships}
                    sub={`${formatNumber(metrics.pending_friend_requests)} requests waiting`}
                  />
                ) : null}
                {metrics && visible('now-challenges') ? (
                  <AdminMetricCard
                    label="Active challenges"
                    value={metrics.active_challenges}
                    sub={`${formatNumber(metrics.pending_challenges)} pending`}
                  />
                ) : null}
                {metrics && visible('now-premium') ? (
                  <AdminMetricCard
                    label="Premium"
                    value={metrics.premium_users}
                    sub={metrics.total_users
                      ? `${rateLabel(metrics.premium_users, metrics.total_users)} of users`
                      : undefined}
                  />
                ) : null}
              </div>
            </section>
          ) : null}
        </article>
      ) : null}
    </div>
  );
}
