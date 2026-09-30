import { useMemo } from 'react';
import {
  type AdminTagRow,
  type AnalyticsFilters,
  type AnalyticsMetrics,
} from '../../lib/admin';
import { formatRangeLabel } from '../../lib/analyticsRange';
import { Link } from 'react-router-dom';
import { useAdmin } from '../../context/AdminContext';
import { useAdminAnalyticsBundle, useAppVersions } from '../../hooks/useAdmin';
import type { AdminAnalyticsScreenProps } from './adminAnalyticsTypes';
import AdminAnalyticsFilters from './AdminAnalyticsFilters';
import AdminMetricCard from './AdminMetricCard';
import AdminSection, { AdminTableSummary } from './AdminSection';
import { formatNumber } from './format';

export type AdminAnalyticsView = 'tags' | 'dreams';

type Props = AdminAnalyticsScreenProps & {
  view: AdminAnalyticsView;
};

const VIEW_LEAD: Record<AdminAnalyticsView, string> = {
  tags: 'Which factor tags people put on nights in this range.',
  dreams: 'How often sleep posts include a dream log.',
};

function FilterSummary({
  rangeLabel,
  versionLabel,
  metrics,
}: {
  rangeLabel: string;
  versionLabel: string;
  metrics: AnalyticsMetrics | null;
}) {
  if (!metrics) return null;
  return (
    <AdminTableSummary>
      {rangeLabel} · {versionLabel}
      {metrics.version_user_count != null ? ` · ${metrics.version_user_count} users on this version` : ''}
    </AdminTableSummary>
  );
}

export default function AdminAnalytics({
  view,
  range,
  preset,
  appVersion,
  onPresetChange,
  onRangeChange,
  onAppVersionChange,
}: Props) {
  const { refreshing } = useAdmin();

  const filters = useMemo<AnalyticsFilters>(() => ({
    start: range.start,
    end: range.end,
    appVersion: appVersion || null,
  }), [range.start, range.end, appVersion]);

  const versionsQuery = useAppVersions();
  const versions = versionsQuery.data ?? [];
  const versionsLoading = versionsQuery.isLoading;

  const {
    metrics,
    tags,
    loading,
    fetching,
    error,
  } = useAdminAnalyticsBundle(filters);

  const rangeLabel = formatRangeLabel(range);
  const versionLabel = appVersion ? `v${appVersion}` : 'all versions';
  const dreamRate = metrics && metrics.posts > 0
    ? `${Math.round((metrics.posts_with_dreams / metrics.posts) * 1000) / 10}%`
    : '—';

  return (
    <AdminSection className="admin-overview" lead={VIEW_LEAD[view]}>
      <AdminAnalyticsFilters
        range={range}
        preset={preset}
        appVersion={appVersion}
        versions={versions}
        versionsLoading={versionsLoading}
        loading={(loading || fetching || refreshing) && !metrics}
        onPresetChange={onPresetChange}
        onRangeChange={onRangeChange}
        onAppVersionChange={onAppVersionChange}
      />

      {error ? <p className="admin-error admin-error-banner">{error}</p> : null}

      {loading && !metrics ? <p className="admin-muted">Loading analytics…</p> : null}

      {metrics ? (
        <div className={fetching || refreshing ? 'admin-analytics-panel-wrap--refreshing' : undefined}>
          {view === 'tags' && (
            <TagsPanel tags={tags} rangeLabel={rangeLabel} versionLabel={versionLabel} />
          )}

          {view === 'dreams' && (
            <DreamsPanel
              metrics={metrics}
              dreamRate={dreamRate}
              rangeLabel={rangeLabel}
              versionLabel={versionLabel}
            />
          )}
        </div>
      ) : null}
    </AdminSection>
  );
}

function TagsPanel({
  tags,
  rangeLabel,
  versionLabel,
}: {
  tags: AdminTagRow[];
  rangeLabel: string;
  versionLabel: string;
}) {
  const usedTags = tags.filter((tag) => tag.usage_count > 0);
  const maxUsage = usedTags[0]?.usage_count ?? 1;

  return (
    <div className="admin-analytics-panel">
      <p className="admin-muted admin-panel-lead">
        Tag usage on posts created {rangeLabel} · {versionLabel}
        {' · '}
        <Link to="/admin/configure/tags">Edit catalog</Link>
      </p>
      {usedTags.length === 0 ? (
        <p className="admin-muted">No tagged posts in this range.</p>
      ) : (
        <div className="admin-tag-usage-list">
          {usedTags.map((tag) => (
            <div key={tag.value} className="admin-tag-usage-row">
              <span className="admin-tag-usage-label">{tag.emoji} {tag.label}</span>
              <span className="admin-tag-usage-bar-wrap">
                <span
                  className="admin-tag-usage-bar"
                  style={{ width: `${Math.max(8, (tag.usage_count / maxUsage) * 100)}%` }}
                />
              </span>
              <span className="admin-tag-usage-count">{tag.usage_count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DreamsPanel({
  metrics,
  dreamRate,
  rangeLabel,
  versionLabel,
}: {
  metrics: AnalyticsMetrics;
  dreamRate: string;
  rangeLabel: string;
  versionLabel: string;
}) {
  return (
    <div className="admin-analytics-panel">
      <FilterSummary rangeLabel={rangeLabel} versionLabel={versionLabel} metrics={metrics} />
      <div className="admin-metric-grid admin-metric-grid--hero">
        <AdminMetricCard
          label="Dream log rate"
          value={dreamRate}
          sub={`${formatNumber(metrics.posts_with_dreams)} of ${formatNumber(metrics.posts)} posts`}
          to="/admin/posts"
        />
        <AdminMetricCard
          label="Posts with dreams"
          value={metrics.posts_with_dreams}
          sub={rangeLabel}
          to="/admin/posts"
        />
        <AdminMetricCard
          label="Sleep posts"
          value={metrics.posts}
          sub={rangeLabel}
          to="/admin/posts"
        />
      </div>
    </div>
  );
}
