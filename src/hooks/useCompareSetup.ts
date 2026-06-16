import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useProfile } from './useProfile';
import { useFriends } from './useSocial';
import {
  ALL_COMPARE_METRIC_IDS,
  DEFAULT_COMPARE_METRIC_IDS,
  getCompareMetrics,
} from '../lib/compareMetrics';
import {
  formatCompareSetupLabel,
  toggleCompareMetric,
  toggleComparePerson,
} from '../lib/comparePickerState';
import {
  loadCompareState,
  saveCompareState,
  type ComparePeriodKey,
} from '../lib/compareState';
import type { CompareParticipant } from '../lib/compareTypes';

export function useCompareSetup() {
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

  const applyPicker = useCallback(() => {
    setSelectedPeople(draftPeople);
    setSelectedMetricIds(draftMetricIds);
    setPickerOpen(false);
  }, [draftPeople, draftMetricIds]);

  const loading = friendsQuery.isLoading || profileQuery.isLoading;
  const error = friendsQuery.error ?? profileQuery.error;
  const setupLabel = formatCompareSetupLabel(selectedPeople.length, activeMetrics.length);

  return {
    me,
    friends,
    period,
    setPeriod,
    participants,
    activeMetrics,
    showTable,
    loading,
    error,
    setupLabel,
    pickerOpen,
    setPickerOpen,
    pickerTab,
    setPickerTab,
    draftPeople,
    draftMetricIds,
    openPicker,
    applyPicker,
    toggleDraftPerson: (id: string) => setDraftPeople((prev) => toggleComparePerson(prev, id)),
    toggleDraftMetric: (id: string) => setDraftMetricIds((prev) => toggleCompareMetric(prev, id)),
    selectAllMetrics: () => setDraftMetricIds([...ALL_COMPARE_METRIC_IDS]),
    resetMetrics: () => setDraftMetricIds(DEFAULT_COMPARE_METRIC_IDS),
  };
}
