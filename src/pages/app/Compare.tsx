import CompareTableSkeleton from '../../components/CompareTableSkeleton';
import ComparePicker from '../../components/ComparePicker';
import CompareTable from '../../components/CompareTable';
import { COMPARE_PERIODS } from '../../lib/comparePeriods';
import { getOptionalQueryErrorMessage } from '../../lib/queryError';
import { useCompareSetup } from '../../hooks/useCompareSetup';

export default function Compare() {
  const {
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
    toggleDraftPerson,
    toggleDraftMetric,
    selectAllMetrics,
    resetMetrics,
  } = useCompareSetup();

  const errorMessage = getOptionalQueryErrorMessage(error, 'Could not load compare data.');

  return (
    <div className="compare-page">
      <header className="compare-toolbar">
        <div className="compare-segments" role="group" aria-label="Time range">
          {COMPARE_PERIODS.map(({ key, label }) => (
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
        {loading ? <CompareTableSkeleton columns={3} rows={5} /> : null}
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
        onTogglePerson={toggleDraftPerson}
        onToggleMetric={toggleDraftMetric}
        onSelectAllMetrics={selectAllMetrics}
        onResetMetrics={resetMetrics}
        pickerTab={pickerTab}
        onPickerTabChange={setPickerTab}
      />
    </div>
  );
}
