import { useState } from 'react';
import Popup from '../Popup';
import type {
  SleepCompatibilityDimensionKey,
  SleepCompatibilityFactor,
  SleepCompatibilityScore,
} from '../../lib/sleepCompatibility';

const FACTOR_DETAIL: Record<SleepCompatibilityDimensionKey, string> = {
  schedule: 'Avg bedtime and wake',
  duration: 'Avg time asleep',
  stageMix: 'Deep, REM, and core',
  wakes: 'Avg wake-ups',
};

function omittedNote(keys: SleepCompatibilityDimensionKey[]): string | null {
  if (keys.length === 0) return null;
  if (keys.length === 1 && keys[0] === 'stageMix') {
    return 'Stage mix is left out when either of you has no real deep and REM split, including devices that log the night as core only. Timing, duration, and wakes still compare.';
  }
  const labels = keys.map((key) => FACTOR_DETAIL[key].toLowerCase());
  return `Left out ${labels.join(', ')}. Only data you both have is scored.`;
}

type Props = {
  open: boolean;
  onClose: () => void;
  score: SleepCompatibilityScore | null;
  friendName: string;
};

export default function SleepCompatibilityPopup({ open, onClose, score, friendName }: Props) {
  const [openKey, setOpenKey] = useState<SleepCompatibilityDimensionKey | null>(null);
  const factors = score?.factors ?? [];
  const note = score ? omittedNote(score.omitted) : null;

  return (
    <Popup
      open={open}
      onClose={() => {
        setOpenKey(null);
        onClose();
      }}
      title="Sleep compatibility"
    >
      {score ? (
        <div className="compat-popup">
          <p className="compat-popup-score">{score.score}/100</p>
          <p className="compat-popup-with">with {friendName}</p>
          {score.reasons.length > 0 ? (
            <p className="compat-popup-reasons">{score.reasons.join(' · ')}</p>
          ) : null}
          <div className="compat-table" role="table" aria-label="Compatibility factors">
            <div className="compat-table-row compat-table-row--head" role="row">
              <span role="columnheader">Factor</span>
              <span role="columnheader">%</span>
              <span role="columnheader">Score</span>
            </div>
            {factors.map((factor) => (
              <FactorRow
                key={factor.key}
                factor={factor}
                friendName={friendName}
                open={openKey === factor.key}
                onToggle={() => setOpenKey((current) => (current === factor.key ? null : factor.key))}
              />
            ))}
          </div>
          {note ? <p className="compat-popup-note">{note}</p> : null}
        </div>
      ) : (
        <p className="app-muted">Loading compatibility…</p>
      )}
    </Popup>
  );
}

function FactorRow({
  factor,
  friendName,
  open,
  onToggle,
}: {
  factor: SleepCompatibilityFactor;
  friendName: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="compat-factor">
      <button type="button" className="compat-table-row" onClick={onToggle} aria-expanded={open}>
        <span>{factor.label}</span>
        <span>{factor.subscore}%</span>
        <span>{factor.contribution}</span>
      </button>
      {open ? (
        <div className="compat-factor-detail">
          <p><span>You</span> {factor.selfValue}</p>
          <p><span>{friendName}</span> {factor.friendValue}</p>
          <p className="compat-factor-hint">{FACTOR_DETAIL[factor.key]}</p>
        </div>
      ) : null}
    </div>
  );
}
