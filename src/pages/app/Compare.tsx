import { useCallback, useEffect, useMemo, useState } from 'react';
import ComparePicker, {
  ALL_COMPARE_METRIC_IDS,
  DEFAULT_COMPARE_METRIC_IDS,
  toggleDraftMetric,
  toggleDraftPerson,
} from '../../components/ComparePicker';
import CompareTable, { PERIODS, type CompareParticipant } from '../../components/CompareTable';
import { useAuth } from '../../context/AuthContext';
import { useProfile } from '../../hooks/useProfile';
import { useFriends } from '../../hooks/useSocial';
import { getCompareMetrics } from '../../lib/compareMetrics';
import {
  loadCompareState,
  saveCompareState,
  type ComparePeriodKey,
} from '../../lib/compareState';

function togglePerson(ids: string[], id: string): string[] {
  return toggleDraftPerson(ids, id);
}

function toggleMetric(ids: string[], id: string): string[] {
  return toggleDraftMetric(ids, id);
}

function formatSetupLabel(peopleCount: number, statsCount: number): string {
  const people = peopleCount === 1 ? '1 person' : `${peopleCount} people`;
  const stats = statsCount === 1 ? '1 stat' : `${statsCount} stats`;
  return `${people} · ${stats}`;
}

export default function Compare() {
  const { user } = useAuth();
  const friendsQuery = useFriends();
  const profileQuery = useProfile(user?.id ?? null);

  const persisted = useMemo(() => loadCompareState(), []);

  const [selectedPeople, setSelectedPeople] = useState<string[]>(persisted?.people ?? []);
  const [selectedMetricIds, setSelectedMetricIds] = useState<string[]>(
    persisted?.metrics?.length ? persisted.metrics : DEFAULT_COMPARE_METRIC_IDS,
  );
  const [period, setPeriod] = useState<ComparePeriodKey>(persisted?.period ?? 'week');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerTab, setPickerTab] = useState<'people' | 'metrics'>('people');
  const [draftPeople, setDraftPeople] = useState<string[]>([]);
  const [draftMetricIds, setDraftMetricIds] = useState<string[]>(DEFAULT_COMPARE_METRIC_IDS);

  const friends = friendsQuery.data ?? [];

  useEffect(() => {
    if (!user?.id) return;
    setSelectedPeople((prev) => {
      const friendIds = new Set(friends.map((f) => f.id));
      const next = prev.filter((id) => id === user.id || friendIds.has(id));
      return next.length === prev.length ? prev : next;
    });
  }, [friends, user?.id]);

  useEffect(() => {
    saveCompareState({
      people: selectedPeople,
      metrics: selectedMetricIds,
      period,
    });
  }, [selectedPeople, selectedMetricIds, period]);

  const me = useMemo((): CompareParticipant | null => (
    user?.id
      ? {
        id: user.id,
        username: profileQuery.data?.username ?? 'you',
        isSelf: true,
      }
      : null
  ), [user?.id, profileQuery.data?.username]);

  const participants = useMemo(() => {
    const list: CompareParticipant[] = [];
    if (me && selectedPeople.includes(me.id)) list.push(me);
    for (const f of friends) {
      if (selectedPeople.includes(f.id)) {
        list.push({ id: f.id, username: f.username, isSelf: false });
      }
    }
    return list;
  }, [me, friends, selectedPeople]);

  const activeMetrics = useMemo(
    () => getCompareMetrics(selectedMetricIds),
    [selectedMetricIds],
  );

  const showTable = participants.some((p) => !p.isSelf) && activeMetrics.length > 0;

  const openPicker = useCallback(() => {
    const allowed = new Set([
      ...(user?.id ? [user.id] : []),
      ...friends.map((f) => f.id),
    ]);
    const basePeople = (user?.id && !selectedPeople.includes(user.id)
      ? [user.id, ...selectedPeople]
      : [...selectedPeople]
    ).filter((id) => allowed.has(id));
    setDraftPeople(basePeople);
    setDraftMetricIds([...selectedMetricIds]);
    setPickerTab('people');
    setPickerOpen(true);
  }, [user?.id, friends, selectedPeople, selectedMetricIds]);

  const applyPicker = () => {
    setSelectedPeople(draftPeople);
    setSelectedMetricIds(draftMetricIds);
    setPickerOpen(false);
  };

  const loading = friendsQuery.isLoading || profileQuery.isLoading;
  const error = friendsQuery.error ?? profileQuery.error;
  const errorMessage = error instanceof Error
    ? error.message
    : error
      ? 'Could not load compare data.'
      : null;

  const selectedCount = selectedPeople.length;
  const setupLabel = formatSetupLabel(selectedCount, activeMetrics.length);

  return (
    <div className="compare-page">
      <header className="compare-toolbar">
        <div className="compare-segments" role="group" aria-label="Time range">
          {PERIODS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              className={`compare-segment${period === key ? ' compare-segment--active' : ''}`}
              onClick={() => setPeriod(key)}
            >
              {label}
            </button>
          ))}
        </div>

        <button
          type="button"
          className="compare-setup-btn"
          onClick={openPicker}
          aria-label={`Edit selection: ${setupLabel}`}
        >
          <span className="compare-setup-label">{setupLabel}</span>
        </button>
      </header>

      <div className="compare-main">
        {loading ? <p className="app-muted">Loading…</p> : null}
        {errorMessage ? <p className="admin-error">{errorMessage}</p> : null}

        {!loading && !errorMessage && (
          showTable ? (
            <CompareTable
              participants={participants}
              period={period}
              metrics={activeMetrics}
            />
          ) : (
            <div className="compare-empty">
              <p className="compare-empty-emoji" aria-hidden>📊</p>
              <h2 className="compare-empty-title">
                {friends.length === 0 ? 'No friends yet' : 'Pick people to compare'}
              </h2>
              <p className="app-muted compare-empty-sub">
                {friends.length === 0
                  ? 'Add friends in the iOS app to see sleep stats side by side.'
                  : 'Select yourself and at least one friend, then choose which stats to show.'}
              </p>
              {friends.length > 0 ? (
                <button type="button" className="compare-empty-cta" onClick={openPicker}>
                  Choose people & stats
                </button>
              ) : null}
            </div>
          )
        )}
      </div>

      <ComparePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onApply={applyPicker}
        me={me}
        friends={friends}
        people={draftPeople}
        metrics={draftMetricIds}
        onTogglePerson={(id) => setDraftPeople((prev) => togglePerson(prev, id))}
        onToggleMetric={(id) => setDraftMetricIds((prev) => toggleMetric(prev, id))}
        onSelectAllMetrics={() => setDraftMetricIds(ALL_COMPARE_METRIC_IDS)}
        onResetMetrics={() => setDraftMetricIds(DEFAULT_COMPARE_METRIC_IDS)}
        pickerTab={pickerTab}
        onPickerTabChange={setPickerTab}
      />
    </div>
  );
}
