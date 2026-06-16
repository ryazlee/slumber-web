import CompareOptionsPanel from './CompareOptionsPanel';
import type { CompareOptionsPanelProps } from './CompareOptionsPanel';
import Popup from './Popup';

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
        pickerTab={pickerTab}
        onPickerTabChange={onPickerTabChange}
      />
    </Popup>
  );
}

export {
  ALL_COMPARE_METRIC_IDS,
  DEFAULT_COMPARE_METRIC_IDS,
} from '../lib/compareMetrics';

export {
  toggleCompareMetric as toggleDraftMetric,
  toggleComparePerson as toggleDraftPerson,
} from '../lib/comparePickerState';
