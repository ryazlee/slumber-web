import CompareOptionsPanel from './CompareOptionsPanel';
import type { CompareOptionsPanelProps } from './CompareOptionsPanel';
import Popup from './Popup';
import {
  ALL_COMPARE_METRIC_IDS,
  ALL_COMPARE_METRICS,
  DEFAULT_COMPARE_METRIC_IDS,
} from '../lib/compareMetrics';

type Props = Omit<CompareOptionsPanelProps, 'layout'> & {
  open: boolean;
  onClose: () => void;
  onApply: () => void;
  pickerTab: 'people' | 'metrics';
  onPickerTabChange: (tab: 'people' | 'metrics') => void;
};

export default function ComparePicker({
  open,
  onClose,
  onApply,
  pickerTab,
  onPickerTabChange,
  ...panelProps
}: Props) {
  return (
    <Popup open={open} onClose={onClose} title="People & stats" panelClassName="popup-panel--compare">
      <div className="compare-picker-toolbar">
        <button type="button" className="compare-picker-cancel" onClick={onClose}>
          Cancel
        </button>
        <button type="button" className="compare-picker-apply" onClick={onApply}>
          Apply
        </button>
      </div>

      <CompareOptionsPanel
        {...panelProps}
        layout="tabs"
        pickerTab={pickerTab}
        onPickerTabChange={onPickerTabChange}
      />
    </Popup>
  );
}

export function toggleDraftPerson(ids: string[], id: string): string[] {
  return ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
}

export function toggleDraftMetric(ids: string[], id: string): string[] {
  if (ids.includes(id)) {
    if (ids.length <= 1) return ids;
    return ids.filter((x) => x !== id);
  }
  const next = [...ids, id];
  const order = ALL_COMPARE_METRICS.map((m) => m.id);
  next.sort((a, b) => order.indexOf(a) - order.indexOf(b));
  return next;
}

export { ALL_COMPARE_METRIC_IDS, DEFAULT_COMPARE_METRIC_IDS };
