import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdmin } from '../../context/AdminContext';
import {
  useHealthMetrics,
  useRepairInflatedStages,
} from '../../hooks/useAdmin';
import {
  dayCount,
  formatRangeLabel,
  presetForRange,
  rangeForPreset,
  toISODate,
  todayISO,
  type DateRange,
  type RangePreset,
} from '../../lib/analyticsRange';
import AdminMetricCard from './AdminMetricCard';
import AdminSubsection from './AdminSubsection';
import { formatNumber, metricDelta } from './format';

const MAX_HEALTH_DAYS = 90;

type HealthChipPreset = 'today' | '7' | '30';

const HEALTH_WINDOW_CHIPS: { id: HealthChipPreset; label: string }[] = [
  { id: 'today', label: 'Day' },
  { id: '7', label: 'Week' },
  { id: '30', label: 'Month' },
];

function clampHealthRange(range: DateRange): DateRange {
  const today = todayISO();
  let { start, end } = range;
  if (!start || !end) return rangeForPreset('today');
  if (end > today) end = today;
  if (start > end) start = end;
  if (dayCount({ start, end }) > MAX_HEALTH_DAYS) {
    const endDate = new Date(`${end}T12:00:00`);
    endDate.setDate(endDate.getDate() - (MAX_HEALTH_DAYS - 1));
    start = toISODate(endDate);
  }
  return { start, end };
}

function healthPresetForRange(range: DateRange): RangePreset {
  const matched = presetForRange(range);
  if (matched === 'today' || matched === '7' || matched === '30') return matched;
  return 'custom';
}

function healthWindowLabel(range: DateRange, days: number): string {
  if (days === 1) {
    return range.start === todayISO() ? 'Today' : formatRangeLabel(range);
  }
  if (healthPresetForRange(range) !== 'custom' && (days === 7 || days === 30)) {
    return `${days} days`;
  }
  return formatRangeLabel(range);
}

function healthRangeNote(range: DateRange, days: number): string {
  const preset = healthPresetForRange(range);
  if (preset === 'today' && range.start === todayISO()) {
    return 'Today, compared with the previous day.';
  }
  if (preset === '7') {
    return 'Last 7 days, compared with the previous 7 days.';
  }
  if (preset === '30') {
    return 'Last 30 days, compared with the previous 30 days.';
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

type EngageCard = {
  key: string;
  label: string;
  value: number | string;
  sub?: string;
  to?: string;
  current?: number;
  previous?: number;
  invertDelta?: boolean;
};

function deltaProps(card: EngageCard) {
  if (card.current == null) return {};
  const delta = metricDelta(card.current, card.previous);
  if (delta == null || card.previous == null) return {};
  return { delta, previous: card.previous, invertDelta: card.invertDelta, compactDelta: true as const };
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

function EngageBlock({
  title,
  meta,
  windowCards,
  nowCards,
}: {
  title: string;
  meta: string;
  windowCards: EngageCard[];
  nowCards: EngageCard[];
}) {
  return (
    <AdminSubsection title={title} meta={meta} className="admin-engage-section">
      <EngageGrid cards={windowCards} />
      {nowCards.length > 0 ? (
        <div className="admin-engage-now">
          <p className="admin-engage-now-label">Right now</p>
          <EngageGrid cards={nowCards} />
        </div>
      ) : null}
    </AdminSubsection>
  );
}

export default function AdminHealthSnapshot() {
  const { metrics } = useAdmin();
  const [range, setRange] = useState<DateRange>(() => rangeForPreset('today'));
  const preset = healthPresetForRange(range);
  const healthQuery = useHealthMetrics(range);
  const repairMutation = useRepairInflatedStages();

  const health = healthQuery.data ?? null;
  const pendingReports = (metrics?.pending_post_reports ?? 0) + (metrics?.pending_comment_reports ?? 0);
  const days = health?.days ?? dayCount(range);
  const windowLabel = healthWindowLabel(range, days);
  const rangeNote = healthRangeNote(range, days);

  const onPresetChange = (next: HealthChipPreset) => {
    setRange(rangeForPreset(next));
  };

  const onRangeChange = (next: DateRange) => {
    setRange(clampHealthRange(next));
  };

  const dreamRate = health && health.engagement.posts > 0
    ? pct(health.engagement.posts_with_dreams, health.engagement.posts)
    : '—';
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
  const privateRate = health
    && typeof health.engagement.private_posts === 'number'
    && health.engagement.posts > 0
    ? pct(health.engagement.private_posts, health.engagement.posts)
    : null;
  const postsPerActive = health && health.engagement.active_posters > 0
    ? (health.engagement.posts / health.engagement.active_posters).toFixed(1)
    : '—';
  const wauMau = health && health.retention.mau > 0
    ? pct(health.retention.wau, health.retention.mau)
    : '—';
  const inflatedWindow = health?.data_quality.inflated_stage_posts_window ?? 0;
  const inflatedTotal = health?.data_quality.inflated_stage_posts_total ?? 0;
  const previous = health?.previous;

  const activationWindow = useMemo<EngageCard[]>(() => {
    if (!health) return [];
    return [
      {
        key: 'signups',
        label: 'Signups',
        value: health.activation.signups,
        sub: `${formatNumber(health.activation.first_time_posters)} first-time posters`,
        to: '/admin/users?filter=new',
        current: health.activation.signups,
        previous: previous?.activation.signups,
      },
      {
        key: 'never-window',
        label: 'Never logged sleep',
        value: health.activation.never_posted_in_window,
        sub: health.activation.never_posted_in_window > 0 ? 'View users' : 'In signup window',
        to: '/admin/users?filter=never-posted',
        current: health.activation.never_posted_in_window,
        previous: previous?.activation.never_posted_in_window,
        invertDelta: true,
      },
    ];
  }, [health, previous]);

  const engagementWindow = useMemo<EngageCard[]>(() => {
    if (!health) return [];
    const cards: EngageCard[] = [
      {
        key: 'posts',
        label: 'Sleep posts',
        value: health.engagement.posts,
        sub: `${formatNumber(health.engagement.wearable_posts)} wearable · ${formatNumber(health.engagement.manual_posts)} manual`,
        to: '/admin/posts',
        current: health.engagement.posts,
        previous: previous?.engagement.posts,
      },
      {
        key: 'posters',
        label: 'Active posters',
        value: health.engagement.active_posters,
        sub: `${postsPerActive} posts per poster`,
        to: '/admin/users',
        current: health.engagement.active_posters,
        previous: previous?.engagement.active_posters,
      },
      {
        key: 'dreams',
        label: 'Dream log rate',
        value: dreamRate,
        sub: `${formatNumber(health.engagement.posts_with_dreams)} with dream text`,
        to: '/admin/dreams',
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
        current: health.engagement.comments,
        previous: previous?.engagement.comments,
      },
      {
        key: 'kudos',
        label: 'Kudos',
        value: health.engagement.kudos,
        sub: kudosRate ? `${kudosRate} of nights got kudos` : windowLabel,
        current: health.engagement.kudos,
        previous: previous?.engagement.kudos,
      },
    ];
    if (typeof health.engagement.nap_posts === 'number') {
      cards.push({
        key: 'naps',
        label: 'Naps',
        value: health.engagement.nap_posts,
        sub: typeof health.engagement.overnight_posts === 'number'
          ? `${formatNumber(health.engagement.overnight_posts)} overnight`
          : windowLabel,
        current: health.engagement.nap_posts,
        previous: previous?.engagement.nap_posts,
      });
    }
    if (typeof health.engagement.private_posts === 'number') {
      cards.push({
        key: 'private',
        label: 'Private logs',
        value: health.engagement.private_posts,
        sub: privateRate ? `${privateRate} of nights` : windowLabel,
        current: health.engagement.private_posts,
        previous: previous?.engagement.private_posts,
      });
    }
    return cards;
  }, [commentedRate, dreamRate, health, kudosRate, postsPerActive, previous, privateRate, windowLabel]);

  const socialWindow = useMemo<EngageCard[]>(() => {
    if (!health) return [];
    const cards: EngageCard[] = [];
    if (typeof health.engagement.friendships_accepted === 'number') {
      cards.push({
        key: 'friendships-new',
        label: 'New friendships',
        value: health.engagement.friendships_accepted,
        sub: 'Accepted in this window',
        current: health.engagement.friendships_accepted,
        previous: previous?.engagement.friendships_accepted,
      });
    }
    if (typeof health.engagement.friend_requests === 'number') {
      cards.push({
        key: 'requests',
        label: 'Friend requests',
        value: health.engagement.friend_requests,
        sub: 'Still waiting, sent in this window',
        current: health.engagement.friend_requests,
        previous: previous?.engagement.friend_requests,
      });
    }
    if (typeof health.engagement.club_joins === 'number') {
      cards.push({
        key: 'joins',
        label: 'Club joins',
        value: health.engagement.club_joins,
        sub: typeof health.engagement.clubs_created === 'number'
          ? `${formatNumber(health.engagement.clubs_created)} new clubs`
          : windowLabel,
        to: '/admin/community',
        current: health.engagement.club_joins,
        previous: previous?.engagement.club_joins,
      });
    }
    if (typeof health.engagement.challenges_created === 'number') {
      cards.push({
        key: 'challenges-new',
        label: 'New challenges',
        value: health.engagement.challenges_created,
        sub: 'Created in this window',
        to: '/admin/challenges',
        current: health.engagement.challenges_created,
        previous: previous?.engagement.challenges_created,
      });
    }
    if (typeof health.engagement.buddy_tags === 'number') {
      cards.push({
        key: 'buddies',
        label: 'Sleep buddy tags',
        value: health.engagement.buddy_tags,
        sub: 'Friends tagged on a night',
        current: health.engagement.buddy_tags,
        previous: previous?.engagement.buddy_tags,
      });
    }
    return cards;
  }, [health, previous, windowLabel]);

  const socialNow = useMemo<EngageCard[]>(() => {
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

  const repairAllInflated = async () => {
    if (!window.confirm(
      `Repair up to 50 inflated wearable posts${inflatedWindow ? ` from ${windowLabel}` : ''}?`,
    )) return;
    try {
      const result = await repairMutation.mutateAsync({ limit: 50, days });
      const failed = result.errors.length;
      window.alert(
        failed
          ? `Repaired ${result.fixed}, unchanged ${result.skipped}, failed ${failed}.`
          : `Repaired ${result.fixed} post(s)${result.skipped ? ` · ${result.skipped} unchanged` : ''}.`,
      );
    } catch (err: unknown) {
      window.alert(err instanceof Error ? err.message : 'Repair failed.');
    }
  };

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

      {inflatedWindow > 0 ? (
        <div className="admin-attention-banner admin-attention-banner--inline">
          <span className="admin-attention-banner-title">
            {inflatedWindow} wearable post{inflatedWindow === 1 ? '' : 's'} in {windowLabel} have inflated stage minutes
            {inflatedTotal > inflatedWindow ? ` (${inflatedTotal} total)` : ''}
          </span>
          <span className="admin-attention-banner-actions">
            <Link to="/admin/posts" className="admin-attention-banner-action">Browse posts</Link>
            <button
              type="button"
              className="admin-button admin-button-sm admin-button-ghost"
              disabled={repairMutation.isPending}
              onClick={() => void repairAllInflated()}
            >
              {repairMutation.isPending ? 'Repairing…' : 'Repair 50'}
            </button>
          </span>
        </div>
      ) : null}

      {health ? (
        <div className="admin-engage">
          <EngageBlock
            title="Activation"
            meta={windowLabel}
            windowCards={activationWindow}
            nowCards={[]}
          />
          <EngageBlock
            title="Engagement"
            meta={windowLabel}
            windowCards={engagementWindow}
            nowCards={[]}
          />
          <EngageBlock
            title="Retention & social"
            meta={windowLabel}
            windowCards={socialWindow}
            nowCards={socialNow}
          />
        </div>
      ) : (
        <p className="admin-muted">Loading engagement…</p>
      )}
    </div>
  );
}
