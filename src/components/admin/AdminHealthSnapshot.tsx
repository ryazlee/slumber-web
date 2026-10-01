import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdmin } from '../../context/AdminContext';
import {
  useAdminTagSuggestions,
  useDailyActivity,
  useHealthMetrics,
} from '../../hooks/useAdmin';
import type { AnalyticsFilters, DailyActivityRow } from '../../lib/admin';
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
import AdminSubsection from './AdminSubsection';
import { formatNumber, metricDelta } from './format';
import { withCumulativeUsers } from './userGrowth';

const MAX_HEALTH_DAYS = 90;

type HealthChipPreset = 'today' | '7' | '30' | '90' | 'all';

const HEALTH_WINDOW_CHIPS: { id: HealthChipPreset; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: '7', label: 'Last week' },
  { id: '30', label: 'Last 30 days' },
  { id: '90', label: '90d' },
  { id: 'all', label: 'All time' },
];

function clampHealthRange(range: DateRange): DateRange {
  const today = todayISO();
  let { start, end } = range;
  if (!start || !end) return rangeForPreset('today');
  if (end > today) end = today;
  if (start > end) start = end;
  // Custom ranges stay within 90 days. All time is the one unbounded preset.
  if (presetForRange({ start, end }, today) === 'all') {
    return { start, end };
  }
  if (dayCount({ start, end }) > MAX_HEALTH_DAYS) {
    const endDate = new Date(`${end}T12:00:00`);
    endDate.setDate(endDate.getDate() - (MAX_HEALTH_DAYS - 1));
    start = toISODate(endDate);
  }
  return { start, end };
}

function healthPresetForRange(range: DateRange): RangePreset {
  const matched = presetForRange(range);
  if (
    matched === 'today'
    || matched === '7'
    || matched === '30'
    || matched === '90'
    || matched === 'all'
  ) return matched;
  return 'custom';
}

function healthWindowLabel(range: DateRange, days: number): string {
  const preset = healthPresetForRange(range);
  if (preset === 'today' && range.start === todayISO()) return 'Today';
  if (preset === '7') return 'Last week';
  if (preset === '30') return 'Last 30 days';
  if (preset === '90') return 'Last 90 days';
  if (preset === 'all') return 'All time';
  if (days === 1) return formatRangeLabel(range);
  return formatRangeLabel(range);
}

function healthRangeNote(range: DateRange, days: number): string {
  const preset = healthPresetForRange(range);
  if (preset === 'today' && range.start === todayISO()) {
    return 'Today, compared with the previous day.';
  }
  if (preset === '7') {
    return 'Last week, compared with the previous 7 days.';
  }
  if (preset === '30') {
    return 'Last 30 days, compared with the previous 30 days.';
  }
  if (preset === '90') {
    return 'Last 90 days, compared with the previous 90 days.';
  }
  if (preset === 'all') {
    return 'All time is the full history, with no comparison.';
  }
  if (days === 1) {
    return `${formatRangeLabel(range)}, compared with the previous day.`;
  }
  return `${formatRangeLabel(range)}, compared with the previous ${days} days.`;
}

function pct(part: number, whole: number): string {
  if (!whole) return '0%';
  return `${Math.round((part / whole) * 1000) / 10}%`;
}

/** One-decimal percent, or null when the window has no posts. */
function ratePoints(part: number, whole: number): number | null {
  if (!whole) return null;
  return Math.round((part / whole) * 1000) / 10;
}

type EngageCard = {
  key: string;
  label: string;
  value: number | string;
  sub?: string;
  to?: string;
  current?: number;
  previous?: number;
  invertDelta?: boolean;
  pointsDelta?: boolean;
};

function countPair(current: number | undefined, previous: number | undefined): Pick<EngageCard, 'current' | 'previous'> {
  if (typeof current !== 'number') return {};
  return {
    current,
    previous: typeof previous === 'number' ? previous : undefined,
  };
}

function deltaProps(card: EngageCard) {
  if (card.current == null) return {};
  const delta = metricDelta(card.current, card.previous);
  if (delta == null || card.previous == null) return {};
  if (card.pointsDelta) {
    return {
      delta: Math.round(delta * 10) / 10,
      pointsDelta: true as const,
      compactDelta: true as const,
    };
  }
  return { delta, previous: card.previous, invertDelta: card.invertDelta, compactDelta: true as const };
}

function EngageCharts({
  range,
  totalUsers,
}: {
  range: DateRange;
  totalUsers: number | null;
}) {
  const singleDay = dayCount(range) <= 1;
  const edgeYear = range.start === ALL_TIME_START
    || range.start.slice(0, 4) !== range.end.slice(0, 4);
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
  const cumulative = seriesEndsToday ? withCumulativeUsers(activity, totalUsers) : null;

  if (singleDay) return null;

  if (activityQuery.isError) {
    return <p className="admin-error">Could not load daily charts.</p>;
  }
  if (activity.length === 0) {
    return activityQuery.isLoading ? <p className="admin-muted">Loading charts…</p> : null;
  }

  return (
    <div className="admin-chart-grid admin-chart-grid--pair admin-engage-charts">
      {cumulative ? (
        <div className="admin-chart-span">
          <AdminActivityChart
            title="Total users"
            rows={cumulative}
            series="total_users"
            variant="line"
            edgeYear={edgeYear}
          />
        </div>
      ) : null}
      <AdminActivityChart
        title="New users each day"
        rows={activity}
        series="signups"
        color="var(--rem)"
        edgeYear={edgeYear}
      />
      <AdminActivityChart
        title="People who logged sleep"
        rows={activity}
        series="active_users"
        color="var(--accent)"
        edgeYear={edgeYear}
      />
      <AdminActivityChart
        title="Sleep posts each day"
        rows={activity}
        series="posts"
        color="var(--deep)"
        edgeYear={edgeYear}
      />
    </div>
  );
}

function EngageGrid({ cards }: { cards: EngageCard[] }) {
  if (cards.length === 0) return null;
  return (
    <div className="admin-engage-grid">
      {cards.map((card) => (
        <AdminMetricCard
          key={card.key}
          label={card.label}
          value={card.value}
          sub={card.sub}
          to={card.to}
          {...deltaProps(card)}
        />
      ))}
    </div>
  );
}

export default function AdminHealthSnapshot() {
  const { metrics } = useAdmin();
  const [range, setRange] = useState<DateRange>(() => rangeForPreset('today'));
  const preset = healthPresetForRange(range);
  const healthQuery = useHealthMetrics(range);
  const suggestionsQuery = useAdminTagSuggestions();

  const health = healthQuery.data ?? null;
  const pendingReports = (metrics?.pending_post_reports ?? 0) + (metrics?.pending_comment_reports ?? 0);
  const pendingTags = suggestionsQuery.data?.length ?? 0;
  const days = health?.days ?? dayCount(range);
  const windowLabel = healthWindowLabel(range, days);
  const rangeNote = healthRangeNote(range, days);

  const onPresetChange = (next: HealthChipPreset) => {
    setRange(rangeForPreset(next));
  };

  const onRangeChange = (next: DateRange) => {
    setRange(clampHealthRange(next));
  };

  const commentedRate = health
    && typeof health.engagement.posts_with_comments === 'number'
    && health.engagement.posts > 0
    ? pct(health.engagement.posts_with_comments, health.engagement.posts)
    : null;
  const kudosRate = health
    && typeof health.engagement.posts_with_kudos === 'number'
    && health.engagement.posts > 0
    ? pct(health.engagement.posts_with_kudos, health.engagement.posts)
    : null;
  const postsPerActive = health && health.engagement.active_posters > 0
    ? (health.engagement.posts / health.engagement.active_posters).toFixed(1)
    : '—';
  const wauMau = health && health.retention.mau > 0
    ? pct(health.retention.wau, health.retention.mau)
    : '—';
  const previous = preset === 'all' ? undefined : health?.previous;

  const windowCards = useMemo<EngageCard[]>(() => {
    if (!health) return [];
    const prevEngagement = previous?.engagement;
    const dreamCurrent = ratePoints(health.engagement.posts_with_dreams, health.engagement.posts);
    const dreamPrevious = prevEngagement
      ? ratePoints(prevEngagement.posts_with_dreams, prevEngagement.posts)
      : null;
    const dreamValue = dreamCurrent == null ? '—' : `${dreamCurrent}%`;

    const cards: EngageCard[] = [
      {
        key: 'signups',
        label: 'New users',
        value: health.activation.signups,
        sub: `${formatNumber(health.activation.first_time_posters)} first-time posters`,
        to: '/admin/users?filter=new',
        ...countPair(health.activation.signups, previous?.activation.signups),
      },
      {
        key: 'posters',
        label: 'Active posters',
        value: health.engagement.active_posters,
        sub: `${postsPerActive} posts per poster`,
        to: '/admin/users',
        ...countPair(health.engagement.active_posters, prevEngagement?.active_posters),
      },
      {
        key: 'posts',
        label: 'Sleep posts',
        value: health.engagement.posts,
        sub: `${formatNumber(health.engagement.wearable_posts)} wearable · ${formatNumber(health.engagement.manual_posts)} manual`,
        to: '/admin/posts',
        ...countPair(health.engagement.posts, prevEngagement?.posts),
      },
      {
        key: 'dreams',
        label: 'Dream log rate',
        value: dreamValue,
        sub: `${formatNumber(health.engagement.posts_with_dreams)} with dream text`,
        to: '/admin/dreams',
        ...(dreamCurrent != null && dreamPrevious != null
          ? { current: dreamCurrent, previous: dreamPrevious, pointsDelta: true as const }
          : {}),
      },
      {
        key: 'comments',
        label: 'Comments',
        value: health.engagement.comments,
        sub: [
          commentedRate ? `${commentedRate} of nights` : null,
          typeof health.engagement.commenters === 'number'
            ? `${formatNumber(health.engagement.commenters)} people`
            : null,
        ].filter(Boolean).join(' · ') || windowLabel,
        ...countPair(health.engagement.comments, prevEngagement?.comments),
      },
      {
        key: 'kudos',
        label: 'Kudos',
        value: health.engagement.kudos,
        sub: kudosRate ? `${kudosRate} of nights got kudos` : windowLabel,
        ...countPair(health.engagement.kudos, prevEngagement?.kudos),
      },
      {
        key: 'friendships-new',
        label: 'New friendships',
        value: health.engagement.friendships_accepted ?? 0,
        sub: 'Accepted in this window',
        ...countPair(health.engagement.friendships_accepted, prevEngagement?.friendships_accepted),
      },
      {
        key: 'requests',
        label: 'Friend requests',
        value: health.engagement.friend_requests ?? 0,
        sub: 'Still waiting, sent in this window',
        ...countPair(health.engagement.friend_requests, prevEngagement?.friend_requests),
      },
      {
        key: 'joins',
        label: 'Club joins',
        value: health.engagement.club_joins ?? 0,
        sub: `${formatNumber(health.engagement.clubs_created ?? 0)} new clubs`,
        to: '/admin/community',
        ...countPair(health.engagement.club_joins, prevEngagement?.club_joins),
      },
      {
        key: 'challenges-new',
        label: 'New challenges',
        value: health.engagement.challenges_created ?? 0,
        sub: 'Created in this window',
        to: '/admin/challenges',
        ...countPair(health.engagement.challenges_created, prevEngagement?.challenges_created),
      },
      {
        key: 'buddies',
        label: 'Sleep buddy tags',
        value: health.engagement.buddy_tags ?? 0,
        sub: 'Friends tagged on a night',
        ...countPair(health.engagement.buddy_tags, prevEngagement?.buddy_tags),
      },
    ];
    return cards;
  }, [commentedRate, health, kudosRate, postsPerActive, previous, windowLabel]);

  const nowCards = useMemo<EngageCard[]>(() => {
    if (!health) return [];
    const cards: EngageCard[] = [
      {
        key: 'wau-mau',
        label: 'WAU / MAU',
        value: wauMau,
        sub: `${formatNumber(health.retention.wau)} weekly · ${formatNumber(health.retention.mau)} monthly posters`,
      },
    ];
    if (metrics) {
      cards.push(
        {
          key: 'friendships',
          label: 'Friendships',
          value: metrics.friendships,
          sub: `${formatNumber(metrics.pending_friend_requests)} pending requests`,
        },
        {
          key: 'challenges',
          label: 'Challenges',
          value: metrics.active_challenges,
          sub: `${formatNumber(metrics.pending_challenges)} pending`,
          to: '/admin/challenges',
        },
        {
          key: 'premium',
          label: 'Premium',
          value: metrics.premium_users,
          sub: `${metrics.total_users ? pct(metrics.premium_users, metrics.total_users) : '0%'} of ${formatNumber(metrics.total_users)} users`,
          to: '/admin/premium',
        },
      );
    }
    return cards;
  }, [health, metrics, wauMau]);

  return (
    <div className="admin-home admin-analytics-panel">
      {pendingReports > 0 ? (
        <Link to="/admin/reports" className="admin-attention-banner">
          <span className="admin-attention-banner-title">
            {pendingReports} report{pendingReports === 1 ? '' : 's'} need review
          </span>
          <span className="admin-attention-banner-action">Open reports →</span>
        </Link>
      ) : null}
      {pendingTags > 0 ? (
        <Link to="/admin/configure/tags" className="admin-attention-banner admin-attention-banner--accent">
          <span className="admin-attention-banner-title">
            {pendingTags} new tag{pendingTags === 1 ? '' : 's'} waiting for approval
          </span>
          <span className="admin-attention-banner-action">Review tags →</span>
        </Link>
      ) : null}

      <div
        className={`admin-analytics-bar${healthQuery.isFetching ? ' admin-analytics-bar--loading' : ''}`}
        aria-busy={healthQuery.isFetching || undefined}
      >
        <div className="admin-tabs admin-tabs-sub" role="group" aria-label="Engagement window">
          {HEALTH_WINDOW_CHIPS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={preset === item.id ? 'admin-tab active' : 'admin-tab'}
              aria-pressed={preset === item.id}
              onClick={() => onPresetChange(item.id)}
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
            onChange={(e) => onRangeChange({ ...range, start: e.target.value })}
          />
          <span className="admin-analytics-date-sep" aria-hidden>–</span>
          <input
            className="admin-input admin-analytics-date"
            type="date"
            value={range.end}
            min={range.start}
            max={todayISO()}
            aria-label="End date"
            onChange={(e) => onRangeChange({ ...range, end: e.target.value })}
          />
        </div>
      </div>
      <p className="admin-engage-range-note">{rangeNote}</p>

      {health ? (
        <div className="admin-engage">
          <AdminSubsection title="This window" meta={windowLabel} className="admin-engage-section">
            <EngageGrid cards={windowCards} />
          </AdminSubsection>
          <AdminSubsection title="Right now" className="admin-engage-section">
            <EngageGrid cards={nowCards} />
          </AdminSubsection>
        </div>
      ) : (
        <p className="admin-muted">Loading engagement…</p>
      )}

      <EngageCharts range={range} totalUsers={metrics?.total_users ?? null} />
    </div>
  );
}
