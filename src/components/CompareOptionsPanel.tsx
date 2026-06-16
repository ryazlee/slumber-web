import { useMemo } from 'react';
import Avatar from './Avatar';
import {
  ALL_COMPARE_METRICS,
  COMPARE_METRIC_CATEGORIES,
  DEFAULT_COMPARE_METRIC_IDS,
  type CompareMetricDef,
} from '../lib/compareMetrics';
import type { CompareParticipant } from '../lib/compareTypes';
import type { WebFriend } from '../lib/types';

export type CompareOptionsPanelProps = {
  me: CompareParticipant | null;
  friends: WebFriend[];
  people: string[];
  metrics: string[];
  onTogglePerson: (id: string) => void;
  onToggleMetric: (id: string) => void;
  onSelectAllMetrics: () => void;
  onResetMetrics: () => void;
  pickerTab?: 'people' | 'metrics';
  onPickerTabChange?: (tab: 'people' | 'metrics') => void;
};

function Checkbox({ checked }: { checked: boolean }) {
  return (
    <span className={`compare-checkbox${checked ? ' compare-checkbox--on' : ''}`} aria-hidden>
      {checked ? '✓' : null}
    </span>
  );
}

function PersonRow({
  id,
  username,
  avatarUrl,
  userRoles,
  primary,
  secondary,
  selected,
  onToggle,
}: {
  id: string;
  username: string;
  avatarUrl?: string;
  userRoles?: string[];
  primary: string;
  secondary?: string;
  selected: boolean;
  onToggle: (id: string) => void;
}) {
  return (
    <button type="button" className="compare-picker-row" onClick={() => onToggle(id)}>
      <Avatar
        userId={id}
        username={username}
        avatarUrl={avatarUrl}
        userRoles={userRoles}
        size="md"
      />
      <span className="compare-picker-row-main">
        <span className="compare-picker-row-title">{primary}</span>
        {secondary ? <span className="compare-picker-row-sub">{secondary}</span> : null}
      </span>
      <Checkbox checked={selected} />
    </button>
  );
}

function MetricRow({
  metric,
  selected,
  onToggle,
}: {
  metric: CompareMetricDef;
  selected: boolean;
  onToggle: (id: string) => void;
}) {
  return (
    <button type="button" className="compare-picker-row" onClick={() => onToggle(metric.id)}>
      {metric.colorVar ? (
        <span
          className="compare-metric-dot"
          style={{ background: metric.colorVar }}
          aria-hidden
        />
      ) : null}
      <span className="compare-picker-row-title">{metric.label}</span>
      <Checkbox checked={selected} />
    </button>
  );
}

function PeopleList({
  me,
  friends,
  people,
  onTogglePerson,
}: Pick<CompareOptionsPanelProps, 'me' | 'friends' | 'people' | 'onTogglePerson'>) {
  return (
    <>
      {me ? (
        <PersonRow
          id={me.id}
          username={me.username}
          avatarUrl={me.avatarUrl}
          userRoles={me.userRoles}
          primary="You"
          secondary={`@${me.username}`}
          selected={people.includes(me.id)}
          onToggle={onTogglePerson}
        />
      ) : null}
      {friends.length > 0 ? (
        <>
          <p className="compare-picker-section">Friends</p>
          {friends.map((friend) => (
            <PersonRow
              key={friend.id}
              id={friend.id}
              username={friend.username}
              avatarUrl={friend.avatarUrl}
              userRoles={friend.userRoles}
              primary={`@${friend.username}`}
              selected={people.includes(friend.id)}
              onToggle={onTogglePerson}
            />
          ))}
        </>
      ) : null}
      {!me && friends.length === 0 ? (
        <p className="app-muted compare-picker-empty">Add friends to compare sleep stats with others.</p>
      ) : null}
    </>
  );
}

function MetricsList({
  metrics,
  onToggleMetric,
  onSelectAllMetrics,
  onResetMetrics,
}: Pick<
  CompareOptionsPanelProps,
  'metrics' | 'onToggleMetric' | 'onSelectAllMetrics' | 'onResetMetrics'
>) {
  const metricsCustomized = useMemo(() => {
    if (metrics.length !== DEFAULT_COMPARE_METRIC_IDS.length) return true;
    return !DEFAULT_COMPARE_METRIC_IDS.every((id) => metrics.includes(id));
  }, [metrics]);

  const metricsByCategory = useMemo(() => {
    const map = new Map<string, CompareMetricDef[]>();
    for (const cat of COMPARE_METRIC_CATEGORIES) {
      map.set(cat.key, ALL_COMPARE_METRICS.filter((m) => m.category === cat.key));
    }
    return map;
  }, []);

  return (
    <>
      <div className="compare-metrics-toolbar">
        <span className="app-muted">
          {metrics.length} selected
          {metricsCustomized ? ' · customized' : ' · default'}
        </span>
        <span className="compare-metrics-actions">
          <button type="button" className="compare-link-btn" onClick={onSelectAllMetrics}>
            Select all
          </button>
          <button type="button" className="compare-link-btn" onClick={onResetMetrics}>
            Reset
          </button>
        </span>
      </div>
      {COMPARE_METRIC_CATEGORIES.map((cat) => {
        const items = metricsByCategory.get(cat.key) ?? [];
        if (!items.length) return null;
        return (
          <div key={cat.key}>
            <p className="compare-picker-section">{cat.label}</p>
            {items.map((metric) => (
              <MetricRow
                key={metric.id}
                metric={metric}
                selected={metrics.includes(metric.id)}
                onToggle={onToggleMetric}
              />
            ))}
          </div>
        );
      })}
    </>
  );
}

export default function CompareOptionsPanel({
  me,
  friends,
  people,
  metrics,
  onTogglePerson,
  onToggleMetric,
  onSelectAllMetrics,
  onResetMetrics,
  pickerTab = 'people',
  onPickerTabChange,
}: CompareOptionsPanelProps) {
  return (
    <>
      <div className="app-subtabs compare-picker-tabs" role="tablist" aria-label="Compare picker">
        {([
          { key: 'people' as const, label: 'People', count: people.length },
          { key: 'metrics' as const, label: 'Metrics', count: metrics.length },
        ]).map(({ key, label, count }) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={pickerTab === key}
            className={`app-subtab${pickerTab === key ? ' active' : ''}`}
            onClick={() => onPickerTabChange?.(key)}
          >
            {label}
            {count > 0 ? <span className="compare-picker-count">{count}</span> : null}
          </button>
        ))}
      </div>

      {pickerTab === 'people' ? (
        <div className="compare-picker-list">
          <PeopleList
            me={me}
            friends={friends}
            people={people}
            onTogglePerson={onTogglePerson}
          />
        </div>
      ) : (
        <div className="compare-picker-list">
          <MetricsList
            metrics={metrics}
            onToggleMetric={onToggleMetric}
            onSelectAllMetrics={onSelectAllMetrics}
            onResetMetrics={onResetMetrics}
          />
        </div>
      )}
    </>
  );
}
